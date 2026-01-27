// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
contract RecordsV1 is Initializable, OwnableUpgradeable {
    enum ProductType {
        Undefined,
        Saving,
        Checking,
        MoneyMarket,
        Broker,
        CreditCard
        // to be added;
    }
    enum MilestoneCategory {
        Undefined,
        SpendTimes,
        DirectDeposit
    }

    struct Milestone {
        uint dueDate; // epoc sec
        MilestoneCategory category;
        string description;
        bool satisfied;
        bool discarded;
        uint spentTimes;
        uint directDepositAmount;
        uint directDepositTimes;
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
    error InvalidClientNonce(uint recordIdx, uint expectedNonce, uint clientExpectedNonce);

    event RecordChange(uint recordIdx, string indexed changeType, address indexed owner);
    event MilestoneChange(uint recordIdx, uint milestoneIdx, string indexed changeType, address indexed owner);

    Record[] public records;

    // use for testing purpose only
    // constructor() {
    //     _disableInitializers();
    //     transferOwnership(msg.sender);
    // }
    
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
        _transferOwnership(_owner);
    }
    
    function createRecord(string calldata _bankName, uint _openDate, ProductType _productType, bool _requireMeetAllMilsones, uint _bonusAmount) external onlyOwner{
        if (bytes(_bankName).length == 0) revert InvalidInput("bankName", "must not be empty");
        if (_productType == ProductType.Undefined) revert InvalidInput("productType", "must set desired product type");
        if (_openDate == 0) revert InvalidInput("openDate", "must not be empty");
        Record storage r = records.push();
        r.bankName = _bankName;
        r.openDate = _openDate;
        r.productType = _productType;
        r.requireMeetAllMilsones = _requireMeetAllMilsones;
        r.bonusAmount = _bonusAmount;
        r.nonce = 0; // Initialize nonce for a new record
        emit RecordChange(records.length - 1, "Created", msg.sender);
    }
    
    function updateRecord(uint recordIdx, string calldata _bankName, uint _openDate, ProductType _productType, bool _requireMeetAllMilsones, uint _bonusAmount, uint _clientExpectedNonce) external onlyOwner verifyRecordIndex(recordIdx) {
        Record storage r = records[recordIdx];
        if (_clientExpectedNonce != r.nonce + 1) revert InvalidClientNonce(recordIdx, r.nonce + 1, _clientExpectedNonce);

        if (bytes(_bankName).length == 0) revert InvalidInput("bankName", "must not be empty");
        r.bankName = _bankName;

        if (_openDate == 0) revert InvalidInput("openDate", "must be greater than 0");
        r.openDate = _openDate;

        if (_productType == ProductType.Undefined) revert InvalidInput("productType", "must set desired product type");
        
        r.productType = _productType;
        r.requireMeetAllMilsones = _requireMeetAllMilsones;
        r.bonusAmount = _bonusAmount;
        r.nonce++;
        emit RecordChange(recordIdx, "Updated", msg.sender);
    }
    
    function discardRecord(uint recordIdx) external onlyOwner verifyRecordIndex(recordIdx){
        Record storage r = records[recordIdx];
        r.discarded = true;
        emit RecordChange(recordIdx, "Discarded", msg.sender);
    }
    
    function closeRecord(uint recordIdx) external onlyOwner verifyRecordIndex(recordIdx){
        Record storage r = records[recordIdx];
        if(r.closeDate == 0) {
            r.closeDate = block.timestamp;
        }
        emit RecordChange(recordIdx, "Closed", msg.sender);
    }
    
    function addSpendCountMilestoneToRecord(uint recordIdx, uint _dueDate, string calldata _description, uint _spendTimes) external onlyOwner verifyBasicMilestoneData(recordIdx, _dueDate, _description){
        if (_spendTimes == 0) revert InvalidInput("spendCount", "must be greater than 0");
        Record storage r = records[recordIdx];
        Milestone memory milestone = Milestone({
            dueDate: _dueDate,
            description: _description,
            satisfied: false,
            discarded: false,
            category: MilestoneCategory.SpendTimes,
            spentTimes: _spendTimes,
            directDepositAmount: 0,
            directDepositTimes: 0
        });
        r.milestones.push(milestone);
        emit MilestoneChange(recordIdx, r.milestones.length - 1, "Created", msg.sender);
    }
    
    function addDirectDepositMiletoneToRecord(uint recordIdx, uint _dueDate, string calldata _description, uint _directDepositAmount, uint _directDepositTimes) external onlyOwner verifyBasicMilestoneData(recordIdx, _dueDate, _description) {
        if (_directDepositAmount == 0 && _directDepositTimes == 0) revert InvalidInput("directDeposit", "amount or times must be greater than 0");
        Record storage r = records[recordIdx];
        Milestone memory milestone = Milestone({
            dueDate: _dueDate,
            description: _description,
            satisfied: false,
            discarded: false,
            category: MilestoneCategory.DirectDeposit,
            spentTimes: 0,
            directDepositAmount: _directDepositAmount,
            directDepositTimes: _directDepositTimes
        });
        r.milestones.push(milestone);
        emit MilestoneChange(recordIdx, r.milestones.length - 1, "Created", msg.sender);
    }
    
    function closeMilestone(uint recordIdx, uint milestoneIdx) external onlyOwner verifyRecordIndex(recordIdx) {
        Record storage r = records[recordIdx];
        if (milestoneIdx >= r.milestones.length) revert InvalidInput("milestoneIdx", "invalid milestone index");
        r.milestones[milestoneIdx].satisfied = true;
        emit MilestoneChange(recordIdx, milestoneIdx, "Closed", msg.sender);
    }
    
    function discardMileStone(uint recordIdx, uint milestoneIdx) external onlyOwner verifyRecordIndex(recordIdx) {
        Record storage r = records[recordIdx];
        if (milestoneIdx >= r.milestones.length) revert InvalidInput("milestoneIdx", "invalid milestone index");
        r.milestones[milestoneIdx].discarded = true;
        emit MilestoneChange(recordIdx, milestoneIdx, "Discarded", msg.sender);
    }

    function getMilestones(uint recordIdx) external view verifyRecordIndex(recordIdx) returns (Milestone[] memory) {
        return records[recordIdx].milestones;
    }
}