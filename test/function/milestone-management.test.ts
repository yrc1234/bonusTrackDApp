import { expect } from "chai";
import { deployRecordsV1, createTestRecord, getCurrentTimestamp, getFutureTimestamp } from "../helpers/test-utils";

describe("RecordsV1 - Milestone Management", function () {
    describe("addSpendCountMilestoneToRecord", function () {
        it("Should add a spend count milestone successfully and emit MilestoneChange event", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            const dueDate = getFutureTimestamp(10000);
            const description = "Spend X amount";
            const spendTimes = 10n;

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, dueDate, description, spendTimes))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 0, "Created", owner.address);

            const milestones = await recordsV1.getMilestones(0);
            const milestone = milestones[0];
            expect(milestone.dueDate).to.equal(dueDate);
            expect(milestone.description).to.equal(description);
            expect(milestone.category).to.equal(1n); // SpendTimes
            expect(milestone.spentTimes).to.equal(spendTimes);
            expect(milestone.directDepositAmount).to.equal(0n);
            expect(milestone.directDepositTimes).to.equal(0n);
            expect(milestone.satisfied).to.be.false;
            expect(milestone.discarded).to.be.false;
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.addSpendCountMilestoneToRecord(99n, getCurrentTimestamp(), "Desc", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });

        it("Should revert if dueDate is 0", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, 0n, "Desc", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("dueDate", "must be greater than 0");
        });

        it("Should revert if description is empty", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getCurrentTimestamp(), "", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("description", "must not be empty");
        });

        it("Should revert if spendCount is 0", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getCurrentTimestamp(), "Desc", 0n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("spendCount", "must be greater than 0");
        });

        it("Should revert if record is closed", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.closeRecord(0n);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getCurrentTimestamp(), "Desc", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("closeDate", "can't add milestone for closed account");
        });

        it("Should revert if dueDate is earlier than account open date", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const openDate = getCurrentTimestamp();
            await recordsV1.createRecord("TestBank", openDate, 1, false, 100n);

            const dueDate = openDate - 100n; // Earlier than openDate
            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, dueDate, "Desc", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("dueDate", "can't be earlier than account open date");
        });
    });

    describe("addDirectDepositMiletoneToRecord", function () {
        it("Should add a direct deposit milestone successfully and emit MilestoneChange event", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            const dueDate = getFutureTimestamp(10000);
            const description = "Direct Deposit";
            const directDepositAmount = 1000n;
            const directDepositTimes = 2n;

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, dueDate, description, directDepositAmount, directDepositTimes))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 0, "Created", owner.address);

            const milestones = await recordsV1.getMilestones(0);
            const milestone = milestones[0];
            expect(milestone.dueDate).to.equal(dueDate);
            expect(milestone.description).to.equal(description);
            expect(milestone.category).to.equal(2n); // DirectDeposit
            expect(milestone.spentTimes).to.equal(0n);
            expect(milestone.directDepositAmount).to.equal(directDepositAmount);
            expect(milestone.directDepositTimes).to.equal(directDepositTimes);
            expect(milestone.satisfied).to.be.false;
            expect(milestone.discarded).to.be.false;
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.addDirectDepositMiletoneToRecord(99n, getCurrentTimestamp(), "Desc", 100n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });

        it("Should revert if dueDate is 0", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, 0n, "Desc", 100n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("dueDate", "must be greater than 0");
        });

        it("Should revert if description is empty", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, getCurrentTimestamp(), "", 100n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("description", "must not be empty");
        });

        it("Should revert if both amount and times are 0", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, getCurrentTimestamp(), "Desc", 0n, 0n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("directDeposit", "amount or times must be greater than 0");
        });

        it("Should revert if record is closed", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.closeRecord(0n);

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, getCurrentTimestamp(), "Desc", 100n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("closeDate", "can't add milestone for closed account");
        });

        it("Should revert if dueDate is earlier than account open date", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const openDate = getCurrentTimestamp();
            await recordsV1.createRecord("TestBank", openDate, 1, false, 100n);

            const dueDate = openDate - 100n; // Earlier than openDate
            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, dueDate, "Desc", 100n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("dueDate", "can't be earlier than account open date");
        });
    });

    describe("closeMilestone", function () {
        it("Should close a milestone successfully and emit MilestoneChange event", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Spend", 500n);

            await expect(recordsV1.closeMilestone(0n, 0n))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 0, "Closed", owner.address);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].satisfied).to.be.true;
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.closeMilestone(99n, 0n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });

        it("Should revert if milestoneIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.closeMilestone(0n, 99n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("milestoneIdx", "invalid milestone index");
        });
    });

    describe("discardMileStone", function () {
        it("Should discard a milestone successfully and emit MilestoneChange event", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Spend", 500n);

            await expect(recordsV1.discardMileStone(0n, 0n))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 0, "Discarded", owner.address);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].discarded).to.be.true;
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.discardMileStone(99n, 0n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });

        it("Should revert if milestoneIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.discardMileStone(0n, 99n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("milestoneIdx", "invalid milestone index");
        });
    });

    describe("Multiple Milestones", function () {
        it("Should handle multiple milestones on same record", async function () {
            const { recordsV1, owner } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // Add 3 milestones
            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "First", 10n))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 0, "Created", owner.address);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(20000), "Second", 20n))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 1, "Created", owner.address);

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, getFutureTimestamp(30000), "Third", 100n, 2n))
                .to.emit(recordsV1, "MilestoneChange")
                .withArgs(0, 2, "Created", owner.address);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones.length).to.equal(3);
            expect(milestones[0].spentTimes).to.equal(10n);
            expect(milestones[1].spentTimes).to.equal(20n);
            expect(milestones[2].directDepositAmount).to.equal(100n);
        });

        it("Should close specific milestone without affecting others", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "First", 10n);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(20000), "Second", 20n);

            await recordsV1.closeMilestone(0n, 0n);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].satisfied).to.be.true;
            expect(milestones[1].satisfied).to.be.false;
        });

        it("Should discard specific milestone without affecting others", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "First", 10n);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(20000), "Second", 20n);

            await recordsV1.discardMileStone(0n, 1n);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].discarded).to.be.false;
            expect(milestones[1].discarded).to.be.true;
        });
    });

    describe("getMilestones", function () {
        it("Should return empty array for record with no milestones", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones.length).to.equal(0);
        });

        it("Should return all milestones for a record", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Milestone 1", 100n);
            await recordsV1.addDirectDepositMiletoneToRecord(0n, getFutureTimestamp(20000), "Milestone 2", 500n, 2n);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones.length).to.equal(2);
            expect(milestones[0].description).to.equal("Milestone 1");
            expect(milestones[1].description).to.equal("Milestone 2");
        });

        it("Should revert if recordIdx is invalid", async function () {
            const { recordsV1 } = await deployRecordsV1();

            await expect(recordsV1.getMilestones(99n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });
    });

    describe("Maximum Values for Milestones", function () {
        it("Should handle maximum spendTimes value", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            const maxUint = 2n ** 256n - 1n;

            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Max spend", maxUint);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].spentTimes).to.equal(maxUint);
        });

        it("Should handle maximum directDeposit values", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            const maxUint = 2n ** 256n - 1n;

            await recordsV1.addDirectDepositMiletoneToRecord(0n, getFutureTimestamp(10000), "Max deposit", maxUint, maxUint);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].directDepositAmount).to.equal(maxUint);
            expect(milestones[0].directDepositTimes).to.equal(maxUint);
        });
    });
});
