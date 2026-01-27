import hre from "hardhat";

/**
 * Deploy RecordsV1 contract and initialize with owner
 */
export async function deployRecordsV1() {
    const [owner] = await hre.ethers.getSigners();
    const RecordsV1Factory = await hre.ethers.getContractFactory("RecordsV1");
    const recordsV1Deployment = await RecordsV1Factory.deploy();
    const recordsV1 = await recordsV1Deployment.waitForDeployment();
    await recordsV1.initialize(owner.address);

    return { recordsV1, owner };
}

/**
 * Create a test record with default values
 */
export async function createTestRecord(contract: any) {
    await contract.createRecord(
        "TestBank",
        BigInt(Math.floor(Date.now() / 1000) - 1000),
        1, // Saving
        false,
        100n
    );
}

/**
 * Get current timestamp as BigInt
 */
export function getCurrentTimestamp(): bigint {
    return BigInt(Math.floor(Date.now() / 1000));
}

/**
 * Get future timestamp
 */
export function getFutureTimestamp(secondsInFuture: number): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + secondsInFuture);
}
