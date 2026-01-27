import { expect } from "chai";
import hre from "hardhat";
import { deployRecordsV1, createTestRecord, getFutureTimestamp } from "../helpers/test-utils";

describe("RecordsV1 - Security: Access Control", function () {
    describe("Owner-Only Functions", function () {
        it("Should revert createRecord when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();

            await expect(
                recordsV1.connect(nonOwner).createRecord("TestBank", BigInt(Date.now()), 1, false, 100n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert updateRecord when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);

            await expect(
                recordsV1.connect(nonOwner).updateRecord(0n, "NewBank", BigInt(Date.now()), 1, true, 200n, 1n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert discardRecord when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);

            await expect(
                recordsV1.connect(nonOwner).discardRecord(0n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert closeRecord when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);

            await expect(
                recordsV1.connect(nonOwner).closeRecord(0n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert addSpendCountMilestoneToRecord when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);

            await expect(
                recordsV1.connect(nonOwner).addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Desc", 100n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert addDirectDepositMiletoneToRecord when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);

            await expect(
                recordsV1.connect(nonOwner).addDirectDepositMiletoneToRecord(0n, getFutureTimestamp(10000), "Desc", 100n, 1n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert closeMilestone when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Desc", 100n);

            await expect(
                recordsV1.connect(nonOwner).closeMilestone(0n, 0n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });

        it("Should revert discardMileStone when called by non-owner", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Desc", 100n);

            await expect(
                recordsV1.connect(nonOwner).discardMileStone(0n, 0n)
            ).to.be.revertedWithCustomError(recordsV1, "OwnableUnauthorizedAccount");
        });
    });

    describe("View Functions - No Access Control", function () {
        it("Should allow non-owner to call getMilestones", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);
            await recordsV1.addSpendCountMilestoneToRecord(0n, getFutureTimestamp(10000), "Test", 100n);

            // Should not revert
            const milestones = await recordsV1.connect(nonOwner).getMilestones(0);
            expect(milestones.length).to.equal(1);
        });

        it("Should allow non-owner to read records public variable", async function () {
            const { recordsV1 } = await deployRecordsV1();
            const [, nonOwner] = await hre.ethers.getSigners();
            await createTestRecord(recordsV1);

            // Should not revert
            const record = await recordsV1.connect(nonOwner).records(0);
            expect(record.bankName).to.equal("TestBank");
        });
    });
});
