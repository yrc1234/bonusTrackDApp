import { expect } from "chai";
import { deployRecordsV1, createTestRecord, getCurrentTimestamp, getFutureTimestamp } from "../helpers/test-utils";

describe("RecordsV1 - Security: Validation and Integrity", function () {
    describe("Input Validation - Records", function () {
        it("Should prevent creating record with empty bankName", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.createRecord("", getCurrentTimestamp(), 1, false, 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("bankName", "must not be empty");
        });

        it("Should prevent creating record with zero openDate", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.createRecord("TestBank", 0n, 1, false, 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("openDate", "must not be empty");
        });

        it("Should prevent creating record with undefined productType", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.createRecord("TestBank", getCurrentTimestamp(), 0, false, 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("productType", "must set desired product type");
        });

        it("Should prevent updating record with invalid index", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await expect(recordsV1.updateRecord(99n, "Bank", getCurrentTimestamp(), 1, false, 100n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });
    });

    describe("Input Validation - Milestones", function () {
        it("Should prevent adding milestone with zero dueDate", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, 0n, "Test", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("dueDate", "must be greater than 0");
        });

        it("Should prevent adding milestone with empty description", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("description", "must not be empty");
        });

        it("Should prevent adding milestone with zero spendCount", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Test", 0n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("spendCount", "must be greater than 0");
        });

        it("Should prevent adding direct deposit milestone with both amount and times as zero", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.addDirectDepositMiletoneToRecord(0n, getFutureTimestamp(10000), "Test", 0n, 0n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("directDeposit", "amount or times must be greater than 0");
        });

        it("Should prevent adding milestone with invalid record index", async function () {
            const { recordsV1 } = await deployRecordsV1();

            await expect(recordsV1.addSpendCountMilestoneToRecord(99n, getFutureTimestamp(10000), "Test", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("recordIdx", "invalid record index");
        });

        it("Should prevent adding milestone with invalid milestone index when closing", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await expect(recordsV1.closeMilestone(0n, 99n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("milestoneIdx", "invalid milestone index");
        });
    });

    describe("State Integrity - Nonce", function () {
        it("Should enforce strict nonce ordering", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // Must use nonce 1 for first update
            await expect(recordsV1.updateRecord(0n, "Update", getCurrentTimestamp(), 1, false, 100n, 2n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidClientNonce")
                .withArgs(0, 1, 2);
        });

        it("Should prevent replay attacks by rejecting old nonces", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            // First update with nonce 1
            await recordsV1.updateRecord(0n, "Update1", getCurrentTimestamp(), 1, false, 100n, 1n);

            // Try to reuse nonce 1 - should fail
            await expect(recordsV1.updateRecord(0n, "Update2", getCurrentTimestamp(), 1, false, 200n, 1n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidClientNonce")
                .withArgs(0, 2, 1);
        });

        it("Should increment nonce correctly on each update", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            expect((await recordsV1.records(0)).nonce).to.equal(0n);

            await recordsV1.updateRecord(0n, "Update1", getCurrentTimestamp(), 1, false, 100n, 1n);
            expect((await recordsV1.records(0)).nonce).to.equal(1n);

            await recordsV1.updateRecord(0n, "Update2", getCurrentTimestamp(), 1, false, 100n, 2n);
            expect((await recordsV1.records(0)).nonce).to.equal(2n);
        });
    });

    describe("State Integrity - Closed Records", function () {
        it("Should prevent adding milestones to closed records", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.closeRecord(0n);

            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Test", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("closeDate", "can't add milestone for closed account");
        });

        it("Should still allow updating closed records", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.closeRecord(0n);

            // Should not revert
            await recordsV1.updateRecord(0n, "UpdatedBank", getCurrentTimestamp(), 1, false, 200n, 1n);
            expect((await recordsV1.records(0)).bankName).to.equal("UpdatedBank");
        });
    });

    describe("Business Logic Integrity - Temporal Validation", function () {
        it("Should prevent milestone dueDate earlier than record openDate", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const openDate = getCurrentTimestamp();
            await recordsV1.createRecord("TestBank", openDate, 1, false, 100n);

            const pastDueDate = openDate - 100n;
            await expect(recordsV1.addSpendCountMilestoneToRecord(0n, pastDueDate, "Test", 100n))
                .to.be.revertedWithCustomError(recordsV1, "InvalidInput")
                .withArgs("dueDate", "can't be earlier than account open date");
        });

        it("Should allow milestone dueDate after record openDate", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const openDate = getCurrentTimestamp();
            await recordsV1.createRecord("TestBank", openDate, 1, false, 100n);

            const futureDueDate = openDate + 1000n;
            // Should not revert
            await recordsV1.addSpendCountMilestoneToRecord(0n, futureDueDate, "Test", 100n);

            const milestones = await recordsV1.getMilestones(0);
            expect(milestones[0].dueDate).to.equal(futureDueDate);
        });
    });

    describe("Idempotency and Duplicate Operations", function () {
        it("Should handle multiple closeRecord calls idempotently", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.closeRecord(0n);
            const firstCloseDate = (await recordsV1.records(0)).closeDate;

            // Second close should not change closeDate
            await recordsV1.closeRecord(0n);
            const secondCloseDate = (await recordsV1.records(0)).closeDate;

            expect(secondCloseDate).to.equal(firstCloseDate);
        });

        it("Should allow multiple discardRecord calls", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);

            await recordsV1.discardRecord(0n);
            expect((await recordsV1.records(0)).discarded).to.be.true;

            // Second discard should not revert
            await recordsV1.discardRecord(0n);
            expect((await recordsV1.records(0)).discarded).to.be.true;
        });

        it("Should allow multiple closeMilestone calls", async function () {
            const { recordsV1 } = await deployRecordsV1();
            await createTestRecord(recordsV1);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Test", 100n);

            await recordsV1.closeMilestone(0n, 0n);
            expect((await recordsV1.getMilestones(0))[0].satisfied).to.be.true;

            // Second close should not revert
            await recordsV1.closeMilestone(0n, 0n);
            expect((await recordsV1.getMilestones(0))[0].satisfied).to.be.true;
        });
    });
});
