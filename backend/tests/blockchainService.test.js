const assert = require("node:assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const {
  checkBlockchainConnection,
  recordMaintenanceEvent,
  getMaintenanceRecord,
  getProvider,
  getSigner
} = require("../src/services/blockchainService");

async function runBlockchainServiceTests() {
  console.log("==================================================");
  console.log("   LUMICHAIN BLOCKCHAIN SERVICE TEST SUITE        ");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    return (async () => {
      try {
        await fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
      } catch (err) {
        console.error(`  ✘ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        throw err;
      }
    })();
  }

  let testRecordId = null;
  let testTxHash = null;

  // Test 1: Blockchain connection and contract accessibility
  await test("1. Blockchain connection succeeds and contract is reachable", async () => {
    const health = await checkBlockchainConnection();
    assert.strictEqual(health.connected, true, `Connection failed: ${health.error}`);
    assert.ok(health.blockNumber >= 0, "Block number must be >= 0");
    assert.ok(health.chainId > 0, "Chain ID must be > 0");
    assert.ok(health.contractAddress, "Contract address must be returned");
  });

  // Test 2: Contract owner can be read and matches wallet
  await test("2. Contract owner can be read and matches deployer wallet", async () => {
    const health = await checkBlockchainConnection();
    assert.ok(health.contractOwner, "Contract owner must be defined");
    assert.ok(health.walletAddress, "Wallet address must be defined");
    assert.strictEqual(
      health.contractOwner.toLowerCase(),
      health.walletAddress.toLowerCase(),
      "Configured wallet must be the contract owner"
    );
    assert.strictEqual(health.isOwner, true, "isOwner flag must be true");
  });

  // Test 3: Record maintenance event on-chain
  await test("3. A maintenance event can be recorded on-chain", async () => {
    const result = await recordMaintenanceEvent({
      complaintId: "TICK-BACKEND-001",
      poleId: "SL-002",
      eventType: "COMPLAINT_CREATED",
      dataHash: "backend-test-hash",
      status: "HIGH"
    });

    assert.strictEqual(result.success, true, "Result must indicate success");
    assert.ok(result.transactionHash, "Transaction hash must be returned");
    assert.match(result.transactionHash, /^0x[a-fA-F0-9]{64}$/, "Valid tx hash format");
    assert.ok(result.recordId, "Record ID must be returned");
    assert.match(result.recordId, /^0x[a-fA-F0-9]{64}$/, "Valid bytes32 record ID format");
    assert.notStrictEqual(result.recordId, "0x" + "0".repeat(64), "Record ID cannot be zero");

    assert.strictEqual(result.complaintId, "TICK-BACKEND-001");
    assert.strictEqual(result.poleId, "SL-002");
    assert.strictEqual(result.eventType, "COMPLAINT_CREATED");
    assert.strictEqual(result.dataHash, "backend-test-hash");
    assert.strictEqual(result.status, "HIGH");

    testRecordId = result.recordId;
    testTxHash = result.transactionHash;
  });

  // Test 4: Retrieve stored maintenance record
  await test("4. The recorded maintenance record can be retrieved from contract", async () => {
    assert.ok(testRecordId, "Record ID from previous test is required");

    const record = await getMaintenanceRecord(testRecordId);
    assert.ok(record, "Retrieved record must exist");
    assert.strictEqual(record.complaintId, "TICK-BACKEND-001", "complaintId must match");
    assert.strictEqual(record.poleId, "SL-002", "poleId must match");
    assert.strictEqual(record.eventType, "COMPLAINT_CREATED", "eventType must match");
    assert.strictEqual(record.dataHash, "backend-test-hash", "dataHash must match");
    assert.strictEqual(record.status, "HIGH", "status must match");
    assert.ok(record.timestamp > 0, "timestamp must be greater than zero");

    const signer = getSigner();
    assert.strictEqual(
      record.recordedBy.toLowerCase(),
      signer.address.toLowerCase(),
      "recordedBy must match signer address"
    );
  });

  // Test 5: Validation - rejects missing required parameters
  await test("5. Input validation rejects missing required parameters", async () => {
    await assert.rejects(
      async () => {
        await recordMaintenanceEvent({
          complaintId: "",
          poleId: "SL-002",
          eventType: "COMPLAINT_CREATED",
          dataHash: "hash",
          status: "HIGH"
        });
      },
      /Missing or invalid required parameter: complaintId/
    );

    await assert.rejects(
      async () => {
        await recordMaintenanceEvent({
          complaintId: "TICK-001",
          poleId: "",
          eventType: "COMPLAINT_CREATED",
          dataHash: "hash",
          status: "HIGH"
        });
      },
      /Missing or invalid required parameter: poleId/
    );
  });

  // Test 6: Validation - rejects invalid recordId format
  await test("6. getMaintenanceRecord rejects invalid recordId format", async () => {
    await assert.rejects(
      async () => {
        await getMaintenanceRecord("invalid-record-id");
      },
      /Invalid recordId format/
    );
  });

  console.log("\n--------------------------------------------------");
  console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
  console.log("--------------------------------------------------\n");

  return {
    success: passedTests === totalTests,
    passedTests,
    totalTests,
    transactionHash: testTxHash,
    recordId: testRecordId
  };
}

if (require.main === module) {
  runBlockchainServiceTests()
    .then((results) => {
      if (!results.success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}

module.exports = { runBlockchainServiceTests };
