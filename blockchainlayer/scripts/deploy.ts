import { network } from "hardhat";

async function main() {
  console.log("Initializing connection to Local Hardhat Network...");
  const { ethers } = await network.create();

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer / Owner address: ${deployer.address}`);

  // 1. Deploy LumiChainAudit contract
  console.log("Deploying LumiChainAudit contract...");
  const LumiChainAuditFactory = await ethers.getContractFactory("LumiChainAudit", deployer);
  const lumiChainAudit = await LumiChainAuditFactory.deploy();

  // 2. Wait for deployment to complete
  await lumiChainAudit.waitForDeployment();
  const contractAddress = await lumiChainAudit.getAddress();

  // 3. Print deployed contract address
  console.log(`Deployed Contract Address: ${contractAddress}`);

  // 4. Print deployer/owner address
  console.log(`Deployer Address: ${deployer.address}`);

  // 5. Verify that the deployed contract's owner() matches the deployer address
  const contractOwner = await lumiChainAudit.owner();
  console.log(`Contract owner() query: ${contractOwner}`);
  if (contractOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Owner mismatch! Expected: ${deployer.address}, Got: ${contractOwner}`);
  }
  console.log("Owner verification check: PASSED");

  // Real local blockchain transaction: recordEvent
  console.log("\n--- Submitting Local Blockchain Transaction ---");
  const complaintId = "TICK-LOCAL-001";
  const poleId = "SL-002";
  const eventType = "COMPLAINT_CREATED";
  const dataHash = "local-test-hash";
  const status = "HIGH";

  console.log(`Calling recordEvent("${complaintId}", "${poleId}", "${eventType}", "${dataHash}", "${status}")...`);
  const tx = await lumiChainAudit.recordEvent(
    complaintId,
    poleId,
    eventType,
    dataHash,
    status
  );

  console.log(`Transaction Hash: ${tx.hash}`);

  // Wait for transaction confirmation
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction execution failed or reverted");
  }
  console.log(`Transaction successfully mined in block: ${receipt.blockNumber}`);

  // Verify AuditEventRecorded event and extract recordId
  let recordId: string | null = null;
  for (const log of receipt.logs) {
    try {
      const parsed = lumiChainAudit.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (parsed && parsed.name === "AuditEventRecorded") {
        recordId = parsed.args.recordId;
        break;
      }
    } catch {
      // Skip irrelevant logs
    }
  }

  if (!recordId) {
    throw new Error("AuditEventRecorded event was not found in transaction logs");
  }

  if (recordId === ethers.ZeroHash || recordId === "0x" + "0".repeat(64)) {
    throw new Error(`Generated recordId is zero: ${recordId}`);
  }
  console.log(`AuditEventRecorded emitted with Record ID: ${recordId}`);

  // Retrieve the record using getAuditRecord(recordId)
  console.log("\n--- Retrieving Stored Audit Record ---");
  const record = await lumiChainAudit.getAuditRecord(recordId);

  console.log("Retrieved Audit Record:");
  console.log(`  complaintId: ${record.complaintId}`);
  console.log(`  poleId:      ${record.poleId}`);
  console.log(`  eventType:   ${record.eventType}`);
  console.log(`  dataHash:    ${record.dataHash}`);
  console.log(`  status:      ${record.status}`);
  console.log(`  timestamp:   ${record.timestamp}`);
  console.log(`  recordedBy:  ${record.recordedBy}`);

  // Assertions on returned values
  if (record.complaintId !== complaintId) {
    throw new Error(`complaintId mismatch: expected ${complaintId}, got ${record.complaintId}`);
  }
  if (record.poleId !== poleId) {
    throw new Error(`poleId mismatch: expected ${poleId}, got ${record.poleId}`);
  }
  if (record.eventType !== eventType) {
    throw new Error(`eventType mismatch: expected ${eventType}, got ${record.eventType}`);
  }
  if (record.dataHash !== dataHash) {
    throw new Error(`dataHash mismatch: expected ${dataHash}, got ${record.dataHash}`);
  }
  if (record.status !== status) {
    throw new Error(`status mismatch: expected ${status}, got ${record.status}`);
  }
  if (record.timestamp <= 0n) {
    throw new Error(`timestamp must be greater than zero, got ${record.timestamp}`);
  }
  if (record.recordedBy.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`recordedBy mismatch: expected ${deployer.address}, got ${record.recordedBy}`);
  }
  console.log("Record field assertions: ALL PASSED");

  // Output standard report
  console.log("\nBLOCKCHAIN DEPLOYMENT RESULT");
  console.log("----------------------------");
  console.log("Network: Local Hardhat Network");
  console.log("Contract: LumiChainAudit");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner/Deployer: ${deployer.address}`);
  console.log(`Transaction Hash: ${tx.hash}`);
  console.log(`Record ID: ${recordId}`);
  console.log("Event: COMPLAINT_CREATED");
  console.log("Pole: SL-002");
  console.log("Status: HIGH");
  console.log("Record Retrieval: SUCCESS\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
