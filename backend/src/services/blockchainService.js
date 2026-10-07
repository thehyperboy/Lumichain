const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Fallback ABI in case the Hardhat artifact is not directly accessible
const FALLBACK_ABI = [
  "constructor()",
  "event AuditEventRecorded(bytes32 indexed recordId, string complaintId, string poleId, string eventType, string status, uint256 timestamp, address recordedBy)",
  "function owner() view returns (address)",
  "function recordEvent(string complaintId, string poleId, string eventType, string dataHash, string status) returns (bytes32)",
  "function getAuditRecord(bytes32 recordId) view returns (string complaintId, string poleId, string eventType, string dataHash, string status, uint256 timestamp, address recordedBy)",
  "function transferOwnership(address newOwner)"
];

/**
 * Loads the LumiChainAudit contract ABI from Hardhat build artifacts,
 * falling back to the typed human-readable ABI if not found.
 */
function loadContractAbi() {
  try {
    const artifactPath = path.resolve(
      __dirname,
      "../../../blockchainlayer/artifacts/contracts/LumiChainAudit.sol/LumiChainAudit.json"
    );
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      if (artifact && Array.isArray(artifact.abi)) {
        return artifact.abi;
      }
    }
  } catch (err) {
    console.warn("[BlockchainService] Failed to load artifact ABI, using fallback ABI:", err.message);
  }
  return FALLBACK_ABI;
}

const CONTRACT_ABI = loadContractAbi();

/**
 * Strips any sensitive values (such as private keys) from error messages.
 */
function sanitizeErrorMessage(error) {
  let message = error && error.message ? error.message : String(error);
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (privateKey && privateKey.length > 8) {
    message = message.split(privateKey).join("[REDACTED_PRIVATE_KEY]");
  }
  return message;
}

/**
 * Returns a configured JsonRpcProvider.
 */
function getProvider() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Returns a configured Wallet connected to the provider.
 */
function getSigner(provider = getProvider()) {
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is not defined in environment variables");
  }
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Returns an ethers.Contract instance connected to the given runner (provider or signer).
 */
function getContract(runner) {
  const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid or missing BLOCKCHAIN_CONTRACT_ADDRESS: ${contractAddress}`);
  }
  return new ethers.Contract(contractAddress, CONTRACT_ABI, runner);
}

/**
 * Verifies connectivity to the blockchain network and LumiChainAudit contract.
 * Checks RPC health, contract bytecode existence, wallet signer validity, and contract ownership.
 * Does not submit any on-chain transactions.
 */
async function checkBlockchainConnection() {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      throw new Error(`Invalid or missing BLOCKCHAIN_CONTRACT_ADDRESS: ${contractAddress}`);
    }

    const code = await provider.getCode(contractAddress);
    if (code === "0x" || code === "0x0") {
      throw new Error(`No smart contract bytecode deployed at address: ${contractAddress}`);
    }

    // Verify read access to owner()
    const readOnlyContract = getContract(provider);
    const ownerAddress = await readOnlyContract.owner();

    // Verify configured wallet
    let walletAddress = null;
    let isOwner = false;
    if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
      const wallet = getSigner(provider);
      walletAddress = wallet.address;
      isOwner = ownerAddress.toLowerCase() === walletAddress.toLowerCase();
    }

    return {
      connected: true,
      chainId: Number(network.chainId),
      blockNumber,
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
      contractAddress,
      contractOwner: ownerAddress,
      walletAddress,
      isOwner
    };
  } catch (error) {
    const safeError = sanitizeErrorMessage(error);
    return {
      connected: false,
      error: safeError
    };
  }
}

/**
 * Records a maintenance audit event immutably on the LumiChain smart contract.
 *
 * @param {Object} params
 * @param {string} params.complaintId - Ticket or complaint reference ID
 * @param {string} params.poleId - Streetlight pole identifier
 * @param {string} params.eventType - Type of audit event (e.g. COMPLAINT_CREATED, REPAIR_COMPLETED)
 * @param {string} params.dataHash - Cryptographic or integrity hash of event telemetry
 * @param {string} params.status - Operational/urgency status (e.g. HIGH, RESOLVED)
 * @returns {Promise<Object>} JSON-friendly result containing recordId and transactionHash
 */
async function recordMaintenanceEvent({ complaintId, poleId, eventType, dataHash, status }) {
  if (!complaintId || typeof complaintId !== "string" || !complaintId.trim()) {
    throw new Error("Missing or invalid required parameter: complaintId");
  }
  if (!poleId || typeof poleId !== "string" || !poleId.trim()) {
    throw new Error("Missing or invalid required parameter: poleId");
  }
  if (!eventType || typeof eventType !== "string" || !eventType.trim()) {
    throw new Error("Missing or invalid required parameter: eventType");
  }
  if (!dataHash || typeof dataHash !== "string" || !dataHash.trim()) {
    throw new Error("Missing or invalid required parameter: dataHash");
  }
  if (!status || typeof status !== "string" || !status.trim()) {
    throw new Error("Missing or invalid required parameter: status");
  }

  try {
    const provider = getProvider();
    const wallet = getSigner(provider);
    const contract = getContract(wallet);

    const tx = await contract.recordEvent(
      complaintId.trim(),
      poleId.trim(),
      eventType.trim(),
      dataHash.trim(),
      status.trim()
    );

    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction execution reverted or failed during mining");
    }

    // Extract AuditEventRecorded event and recordId
    let recordId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        if (parsed && parsed.name === "AuditEventRecorded") {
          recordId = parsed.args.recordId;
          break;
        }
      } catch {
        // Skip logs not matching the contract interface
      }
    }

    if (!recordId) {
      throw new Error("AuditEventRecorded event was not found in transaction receipt logs");
    }

    return {
      success: true,
      recordId,
      transactionHash: tx.hash,
      complaintId: complaintId.trim(),
      poleId: poleId.trim(),
      eventType: eventType.trim(),
      dataHash: dataHash.trim(),
      status: status.trim(),
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
}

/**
 * Retrieves an immutable audit record from the LumiChainAudit smart contract by recordId.
 *
 * @param {string} recordId - bytes32 hex string representing the record ID
 * @returns {Promise<Object>} Clean JSON-friendly record object
 */
async function getMaintenanceRecord(recordId) {
  if (!recordId || typeof recordId !== "string" || !ethers.isHexString(recordId, 32)) {
    throw new Error(`Invalid recordId format: must be a 32-byte hex string (got ${recordId})`);
  }

  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const record = await contract.getAuditRecord(recordId);

    return {
      complaintId: record.complaintId || record[0],
      poleId: record.poleId || record[1],
      eventType: record.eventType || record[2],
      dataHash: record.dataHash || record[3],
      status: record.status || record[4],
      timestamp: Number(record.timestamp !== undefined ? record.timestamp : record[5]),
      recordedBy: record.recordedBy || record[6]
    };
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
}

module.exports = {
  checkBlockchainConnection,
  recordMaintenanceEvent,
  getMaintenanceRecord,
  getProvider,
  getSigner,
  getContract
};
