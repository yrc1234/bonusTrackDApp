import {deploy} from "./deploy";

async function main() {
  await deploy("RecordsV1");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});