import { expect } from "chai";
import hre from "hardhat";
import { deployRecordsV1, createTestRecord, getCurrentTimestamp } from "../helpers/test-utils";

describe("RecordsV1 - Record Management", function () {
    describe("Deployment and Initialization", function () {
        it("Should set the right owner", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            expect((await recordsV1.owner())).to.equal(owner.address);
        });
    });

    describe("createRecord", function () {
        it("Should create a new record successfully", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const bankName = "TestBank";
            const openDate = getCurrentTimestamp();
            const productType = 1; // Saving
            const requireMeetAllMilestones = true;
            const bonusAmount = BigInt(100);

            await recordsV1.createRecord(bankName, openDate, productType, requireMeetAllMilestones, bonusAmount);

            const record = await recordsV1.records(0);
            expect(record.bankName).to.equal(bankName);
            expect(record.openDate).to.equal(openDate);
            expect(record.closeDate).to.equal(0n);
            expect(record.bonusEarnedDate).to.equal(0n);
            expect(record.bonusAmount).to.equal(bonusAmount);
            expect(record.nonce).to.equal(0n);
            expect(record.productType).to.equal(productType);
            expect(record.requireMeetAllMilsones).to.equal(requireMeetAllMilestones);
            expect(record.discarded).to.be.false;
        });

        it("Should revert if bankName is empty", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const openDate = getCurrentTimestamp();
            const productType = 1;

            await expect(recordsV1.createRecord("", openDate, productType, true, 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput").withArgs("bankName", "must not be empty");
        });

        it("Should revert if productType is Undefined", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const bankName = "TestBank";
            const openDate = getCurrentTimestamp();
            const productType = 0; // Undefined

            await expect(recordsV1.createRecord(bankName, openDate, productType, true, 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput").withArgs("productType", "must set desired product type");
        });

        it("Should revert if openDate is 0", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const bankName = "TestBank";
            const openDate = BigInt(0);
            const productType = 1;

            await expect(recordsV1.createRecord(bankName, openDate, productType, true, 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput").withArgs("openDate", "must not be empty");
        });
    });

    describe("updateRecord", function () {
        it("Should update an existing record successfully", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const initialBankName = "InitialBank";
            const initialOpenDate = getCurrentTimestamp() - 1000n;
            const initialProductType = 1;
            const initialBonusAmount = 50n;

            await recordsV1.createRecord(initialBankName, initialOpenDate, initialProductType, false, initialBonusAmount);

            const updatedBankName = "UpdatedBank";
            const updatedOpenDate = getCurrentTimestamp();
            const updatedProductType = 2; // Checking
            const updatedBonusAmount = 200n;

            await recordsV1.updateRecord(0, updatedBankName, updatedOpenDate, updatedProductType, true, updatedBonusAmount, 1);

            const record = await recordsV1.records(0);
            expect(record.bankName).to.equal(updatedBankName);
            expect(record.openDate).to.equal(updatedOpenDate);
            expect(record.productType).to.equal(updatedProductType);
            expect(record.requireMeetAllMilsones).to.be.true;
            expect(record.bonusAmount).to.equal(updatedBonusAmount);
            expect(record.nonce).to.equal(1n);
        });

        it("Should revert with InvalidClientNonce if nonce is incorrect", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const initialBankName = "InitialBank";
            const initialOpenDate = getCurrentTimestamp() - 1000n;
            const initialProductType = 1;
            const initialBonusAmount = 50n;

            await recordsV1.createRecord(initialBankName, initialOpenDate, initialProductType, false, initialBonusAmount);

            await expect(recordsV1.updateRecord(0, "NewBank", getCurrentTimestamp(), 1, true, 100n, 0))
                .to.be.revertedWithCustomError(recordsV1, "InvalidClientNonce").withArgs(0, 1, 0);
        });

        it("Should revert if bankName is empty during update", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const initialOpenDate = getCurrentTimestamp() - 1000n;
            const initialProductType = 1;

            await recordsV1.createRecord("ValidBank", initialOpenDate, initialProductType, false, 50n);

            await expect(recordsV1.updateRecord(0, "", initialOpenDate, initialProductType, true, 100n, 1))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput").withArgs("bankName", "must not be empty");
        });

        it("Should revert if openDate is 0 during update", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const initialBankName = "InitialBank";
            const initialProductType = 1;

            await recordsV1.createRecord(initialBankName, getCurrentTimestamp(), initialProductType, false, 50n);

            await expect(recordsV1.updateRecord(0, initialBankName, 0n, initialProductType, true, 100n, 1))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput").withArgs("openDate", "must be greater than 0");
        });

        it("Should revert if productType is Undefined during update", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const initialBankName = "InitialBank";
            const initialOpenDate = getCurrentTimestamp() - 1000n;

            await recordsV1.createRecord(initialBankName, initialOpenDate, 1, false, 50n);

            await expect(recordsV1.updateRecord(0, initialBankName, initialOpenDate, 0, true, 100n, 1))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput").withArgs("productType", "must set desired product type");
        });
    });

    describe("discardRecord", function () {
        it("Should discard a record successfully and emit RecordChange event", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.discardRecord(0n))
                .to.emit(recordsV1, "RecordChange")
                .withArgs(0, "Discarded", owner.address);

            const record = await recordsV1.records(0);
            expect(record.discarded).to.be.true;
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.discardRecord(99n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });
    });

    describe("closeRecord", function () {
        it("Should close a record successfully and emit RecordChange event", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.closeRecord(0n))
                .to.emit(recordsV1, "RecordChange")
                .withArgs(0, "Closed", owner.address);

            const record = await recordsV1.records(0);
            expect(record.closeDate).to.not.equal(0n);
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.closeRecord(99n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });

        it("Should be idempotent - calling closeRecord multiple times should not fail", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.closeRecord(0n);
            const record1 = await recordsV1.records(0);
            const firstCloseDate = record1.closeDate;

            // Close again
            await recordsV1.closeRecord(0n);
            const record2 = await recordsV1.records(0);

            // closeDate should remain the same (idempotent)
            expect(record2.closeDate).to.equal(firstCloseDate);
        });
    });

    describe("ProductType Enum", function () {
        it("Should create records with all valid ProductType values", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const openDate = getCurrentTimestamp();

            // Saving = 1
            await recordsV1.createRecord("Bank1", openDate, 1, false, 100n);
            expect((await recordsV1.records(0)).productType).to.equal(1);

            // Checking = 2
            await recordsV1.createRecord("Bank2", openDate, 2, false, 100n);
            expect((await recordsV1.records(1)).productType).to.equal(2);

            // MoneyMarket = 3
            await recordsV1.createRecord("Bank3", openDate, 3, false, 100n);
            expect((await recordsV1.records(2)).productType).to.equal(3);

            // Broker = 4
            await recordsV1.createRecord("Bank4", openDate, 4, false, 100n);
            expect((await recordsV1.records(3)).productType).to.equal(4);

            // CreditCard = 5
            await recordsV1.createRecord("Bank5", openDate, 5, false, 100n);
            expect((await recordsV1.records(4)).productType).to.equal(5);
        });

        it("Should update record with different ProductType values", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // Update from Saving to CreditCard
            await recordsV1.updateRecord(0n, "UpdatedBank", getCurrentTimestamp(), 5, true, 200n, 1n);
            expect((await recordsV1.records(0)).productType).to.equal(5);
        });
    });

    describe("Discarded Record Behavior", function () {
        it("Should allow updating a discarded record", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.discardRecord(0n);

            // Should still be able to update
            await expect(recordsV1.updateRecord(0n, "UpdatedBank", getCurrentTimestamp(), 2, true, 200n, 1n))
                .to.emit(recordsV1, "RecordChange")
                .withArgs(0, "Updated", owner.address);

            const record = await recordsV1.records(0);
            expect(record.discarded).to.be.true;
            expect(record.bankName).to.equal("UpdatedBank");
        });

        it("Should allow adding milestones to a discarded record if not closed", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.discardRecord(0n);

            // Should still be able to add milestone since not closed
            await recordsV1.addSpendCountMilestoneToRecord(0n, getCurrentTimestamp() + 10000n, "Milestone", 100n);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones.length).to.equal(1);
        });
    });

    describe("Sequential Nonce Updates", function () {
        it("Should handle multiple sequential updates with correct nonces", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // First update - nonce should be 0, expect 1
            await expect(recordsV1.updateRecord(0n, "Update1", getCurrentTimestamp(), 1, false, 100n, 1n))
                .to.emit(recordsV1, "RecordChange")
                .withArgs(0, "Updated", owner.address);
            expect((await recordsV1.records(0)).nonce).to.equal(1n);

            // Second update - nonce should be 1, expect 2
            await expect(recordsV1.updateRecord(0n, "Update2", getCurrentTimestamp(), 2, false, 200n, 2n))
                .to.emit(recordsV1, "RecordChange")
                .withArgs(0, "Updated", owner.address);
            expect((await recordsV1.records(0)).nonce).to.equal(2n);

            // Third update - nonce should be 2, expect 3
            await expect(recordsV1.updateRecord(0n, "Update3", getCurrentTimestamp(), 3, true, 300n, 3n))
                .to.emit(recordsV1, "RecordChange")
                .withArgs(0, "Updated", owner.address);
            expect((await recordsV1.records(0)).nonce).to.equal(3n);

            const record = await recordsV1.records(0);
            expect(record.bankName).to.equal("Update3");
            expect(record.bonusAmount).to.equal(300n);
        });

        it("Should revert if skipping nonce values", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // Try to skip from nonce 0 to 3
            await expect(recordsV1.updateRecord(0n, "Update", getCurrentTimestamp(), 1, false, 100n, 3n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidClientNonce")
                .withArgs(0, 1, 3);
        });

        it("Should revert if using old nonce value", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // First update
            await recordsV1.updateRecord(0n, "Update1", getCurrentTimestamp(), 1, false, 100n, 1n);

            // Try to use nonce 1 again
            await expect(recordsV1.updateRecord(0n, "Update2", getCurrentTimestamp(), 1, false, 200n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidClientNonce")
                .withArgs(0, 2, 1);
        });
    });

    describe("Maximum Values for Records", function () {
        it("Should handle maximum uint values for bonus amounts", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const maxUint = 2n ** 256n - 1n;
            const openDate = getCurrentTimestamp();

            await recordsV1.createRecord("TestBank", openDate, 1, false, maxUint);

            const record = await recordsV1.records(0);
            expect(record.bonusAmount).to.equal(maxUint);
        });

        it("Should handle very large timestamp values", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const largeTimestamp = 2n ** 64n - 1n; // Max uint64 value

            await recordsV1.createRecord("TestBank", largeTimestamp, 1, false, 100n);

            const record = await recordsV1.records(0);
            expect(record.openDate).to.equal(largeTimestamp);
        });
    });
});
