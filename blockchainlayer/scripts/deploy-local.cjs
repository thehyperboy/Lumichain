const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function deploy() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  console.log(`Connecting to local RPC at ${rpcUrl}...`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Deployer address: ${wallet.address}`);

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/LumiChainAudit.sol/LumiChainAudit.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("Deploying LumiChainAudit contract to local node...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const owner = await contract.owner();

  console.log("==========================================");
  console.log(`LumiChainAudit deployed at: ${address}`);
  console.log(`Contract owner:             ${owner}`);
  console.log("==========================================");
}

deploy().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
