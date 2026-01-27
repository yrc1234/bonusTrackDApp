import {ethers} from "hardhat";

export async function deploy(contractName: string) {
  const contractSchema = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);
  const contract = await contractSchema.deploy();
//   await contract.deployed();
  console.log(`${contractName} deployed to: ${await contract.getAddress()}`);
  return contract;
}