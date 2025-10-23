// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
contract RecordsV1 is Initializable, OwnableUpgradeable {
    enum ProductType {
        UNDEFINED,
        SAVING,
        CHECKING,
        MoneyMarket,
        Broker,
        CreditCard
        // to be added;
    }
    struct Milestone {
        uint dueDate; // epoc sec
        string description;
        bool satisfied;
        bool discarded;
        int spendCount;
        int directDepositAmount;
        int directDepositTimes;
    }
    struct Record {
        string bankName;
        uint openDate; // epoc sec
        uint closeDate; // epoc sec
        uint bonusEarnedDate; // epoc sec
        uint bonusAmount;
        uint nonce; // Incremental counter for updates
        ProductType productType;
        bool requireMeetAllMilsones;
        bool discarded;
        Milestone[] milestones;
    }

    error InvalidInput(string field, string reason);

    Record[] public records;

    // use for testing purpose only
    constructor() {
        _disableInitializers();
        transferOwnership(msg.sender);
    }
    
    modifier verifyBasicMilestoneData(uint recordIdx, uint _dueDate, string calldata _description) {
        if (recordIdx >= records.length) revert InvalidInput("recordIdx", "invalid record index");
        Record memory r = records[recordIdx];
        if (r.closeDate != 0) revert InvalidInput("closeDate", "can't add milestone for closed account");
        if (_dueDate == 0) revert InvalidInput("dueDate", "must be greater than 0");
        if (bytes(_description).length == 0) revert InvalidInput("description", "must not be empty");
        if (_dueDate <= r.openDate) revert InvalidInput("dueDate", "can't be earlier than account open date");
        _;
    }
    
    modifier verifyRecordIndex(uint recordIdx) {
        if (recordIdx >= records.length) revert InvalidInput("recordIdx", "invalid record index");
        _;
    }
    
    function initialize(address _owner) initializer public {
        transferOwnership(_owner);
    }
    
    function createRecord(string calldata _bankName, uint _openDate, ProductType _productType, bool _requireMeetAllMilsones, uint _bonusAmount) external onlyOwner returns(uint){
        if (bytes(_bankName).length == 0) revert InvalidInput("bankName", "must not be empty");
        if (_productType == ProductType.UNDEFINED) revert InvalidInput("productType", "must set desired product type");
        if (_openDate == 0) revert InvalidInput("openDate", "must not be empty");
        Record storage r = records.push();
        r.bankName = _bankName;
        r.openDate = _openDate;
        r.productType = _productType;
        r.requireMeetAllMilsones = _requireMeetAllMilsones;
        r.bonusAmount = _bonusAmount;
        r.nonce = 0; // Initialize nonce for a new record
        return records.length - 1;
    }
    
    function updateRecord(uint recordIdx, string calldata _bankName, uint _openDate, ProductType _productType, bool _requireMeetAllMilsones, uint _bonusAmount, uint _clientExpectedNonce) external onlyOwner verifyRecordIndex(recordIdx) returns(uint) {
        Record storage r = records[recordIdx];

        if (_clientExpectedNonce != r.nonce + 1) revert InvalidClientNonce(recordIdx, r.nonce + 1, _clientExpectedNonce);

        if (bytes(_bankName).length > 0) {
            r.bankName = _bankName;
        } else {
            revert InvalidInput("bankName", "must not be empty");
        }
        if (_openDate > 0) {
            r.openDate = _openDate;
        } else {
            revert InvalidInput("openDate", "must be greater than 0");
        }
        if (_productType != ProductType.UNDEFINED) {
            r.productType = _productType;
        } else {
            revert InvalidInput("productType", "must set desired product type");
        }
        r.requireMeetAllMilsones = _requireMeetAllMilsones;
        r.bonusAmount = _bonusAmount;
        r.nonce++;
        r.lastUpdateTime = block.timestamp * 1000;
        return recordIdx;
    }
    
    function discardRecord(uint recordIdx) external onlyOwner verifyRecordIndex(recordIdx) returns(uint) {
        Record storage r = records[recordIdx];
        r.discarded = true;
        return recordIdx;
    }
    
    function closeRecord(uint recordIdx) external onlyOwner verifyRecordIndex(recordIdx) returns(uint) {
        Record storage r = records[recordIdx];
        if(r.closeDate == 0) {
            r.closeDate = block.timestamp;
        }
        return recordIdx;
    }
    
    function addSpendCountMilestoneToRecord(uint recordIdx, uint _dueDate, string calldata _description, int _spendCount) external onlyOwner verifyBasicMilestoneData(recordIdx, _dueDate, _description) returns (uint) {
        if (_spendCount <= 0) revert InvalidInput("spendCount", "must be greater than 0");
        Record storage r = records[recordIdx];
        Milestone memory milestone = Milestone({
            dueDate: _dueDate,
            description: _description,
            satisfied: false,
            spendCount: _spendCount,
            directDepositAmount: -1,
            directDepositTimes: -1,
            discarded: false
        });
        r.milestones.push(milestone);
        return r.milestones.length - 1;
    }
    
    function addDirectDepositMiletoneToRecord(uint recordIdx, uint _dueDate, string calldata _description, int _directDepositAmount, int _directDepositTimes) external onlyOwner verifyBasicMilestoneData(recordIdx, _dueDate,  _description) returns (uint) {
        if (_directDepositAmount <= 0 && _directDepositTimes <= 0) revert InvalidInput("directDeposit", "amount or times must be greater than 0");
        Record storage r = records[recordIdx];
        Milestone memory milestone = Milestone({
            dueDate: _dueDate,
            description: _description,
            satisfied: false,
            spendCount: -1,
            directDepositAmount: _directDepositAmount,
            directDepositTimes: _directDepositTimes,
            discarded: false
        });
        r.milestones.push(milestone);
        return r.milestones.length - 1;
    }
    
    function closeMilestone(uint recordIdx, uint milestoneIdx) external onlyOwner verifyRecordIndex(recordIdx) returns(uint, uint) {
        Record storage r = records[recordIdx];
        if (milestoneIdx >= r.milestones.length) revert InvalidInput("milestoneIdx", "invalid milestone index");
        r.milestones[milestoneIdx].satisfied = true;
        return (recordIdx, milestoneIdx);
    }
    
    function discardMileStone(uint recordIdx, uint milestoneIdx) external onlyOwner verifyRecordIndex(recordIdx) returns(uint, uint) {
        Record storage r = records[recordIdx];
        if (milestoneIdx >= r.milestones.length) revert InvalidInput("milestoneIdx", "invalid milestone index");
        r.milestones[milestoneIdx].discarded = true;
        return (recordIdx, milestoneIdx);
    }
}