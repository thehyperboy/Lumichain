import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("LumiChainAudit", function () {
  // Helper to extract AuditEventRecorded event from transaction receipt logs
  function getAuditEventFromReceipt(receipt: any, contract: any) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === "AuditEventRecorded") {
          return parsed;
        }
      } catch {
        // Skip logs that do not belong to this contract interface
      }
    }
    return null;
  }

  async function deployLumiChainAuditFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const LumiChainAuditFactory = await ethers.getContractFactory("LumiChainAudit");
    const lumiChainAudit = await LumiChainAuditFactory.deploy();
    await lumiChainAudit.waitForDeployment();

    return { lumiChainAudit, owner, otherAccount };
  }

  describe("Owner Test", function () {
    it("Should deploy and verify the deployer address is returned by owner()", async function () {
      const { lumiChainAudit, owner } = await deployLumiChainAuditFixture();
      expect(await lumiChainAudit.owner()).to.equal(owner.address);
    });
  });

  describe("Record Event Test", function () {
    it("Should record event successfully, emit AuditEventRecorded with expected values, and have non-zero recordId", async function () {
      const { lumiChainAudit } = await deployLumiChainAuditFixture();

      const tx = await lumiChainAudit.recordEvent(
        "TICK-001",
        "SL-002",
        "COMPLAINT_CREATED",
        "hash-123",
        "HIGH"
      );

      // Verify transaction succeeds and AuditEventRecorded is emitted
      await expect(tx).to.emit(lumiChainAudit, "AuditEventRecorded");

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Extract AuditEventRecorded event robustly
      const event = getAuditEventFromReceipt(receipt, lumiChainAudit);
      expect(event, "AuditEventRecorded event must exist in receipt logs").to.not.be.null;

      // Verify emitted values contain expected data
      expect(event!.args.complaintId).to.equal("TICK-001");
      expect(event!.args.poleId).to.equal("SL-002");
      expect(event!.args.eventType).to.equal("COMPLAINT_CREATED");
      expect(event!.args.status).to.equal("HIGH");

      // Verify generated recordId is not zero
      expect(event!.args.recordId).to.not.equal(ethers.ZeroHash);
      expect(ethers.isHexString(event!.args.recordId, 32)).to.be.true;
    });
  });

  describe("Retrieve Record Test", function () {
    it("Should record event, obtain recordId from emitted event, and retrieve complete record with getAuditRecord()", async function () {
      const { lumiChainAudit, owner } = await deployLumiChainAuditFixture();

      const tx = await lumiChainAudit.recordEvent(
        "TICK-002",
        "SL-003",
        "REPAIR_COMPLETED",
        "hash-456",
        "RESOLVED"
      );
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Obtain generated recordId from emitted event
      const event = getAuditEventFromReceipt(receipt, lumiChainAudit);
      expect(event, "AuditEventRecorded event must exist in receipt logs").to.not.be.null;
      const recordId = event!.args.recordId;
      expect(recordId).to.not.equal(ethers.ZeroHash);

      // Call getAuditRecord(recordId)
      const record = await lumiChainAudit.getAuditRecord(recordId);

      // Verify retrieved record fields
      expect(record.complaintId).to.equal("TICK-002");
      expect(record.poleId).to.equal("SL-003");
      expect(record.eventType).to.equal("REPAIR_COMPLETED");
      expect(record.dataHash).to.equal("hash-456");
      expect(record.status).to.equal("RESOLVED");

      // Verify timestamp is greater than zero
      expect(record.timestamp).to.be.greaterThan(0n);

      // Verify recordedBy is the deployer's address
      expect(record.recordedBy).to.equal(owner.address);
    });
  });

  describe("Unauthorized Access Test", function () {
    it("Should revert when a non-owner calls recordEvent()", async function () {
      const { lumiChainAudit, otherAccount } = await deployLumiChainAuditFixture();

      // Connect using second signer and verify revert reason
      await expect(
        lumiChainAudit.connect(otherAccount).recordEvent(
          "TICK-001",
          "SL-002",
          "COMPLAINT_CREATED",
          "hash-123",
          "HIGH"
        )
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });

  describe("Validation Tests", function () {
    it("Should reject an empty complaintId with 'Complaint ID required'", async function () {
      const { lumiChainAudit } = await deployLumiChainAuditFixture();

      await expect(
        lumiChainAudit.recordEvent(
          "",
          "SL-002",
          "COMPLAINT_CREATED",
          "hash-123",
          "HIGH"
        )
      ).to.be.revertedWith("Complaint ID required");
    });

    it("Should reject an empty poleId with 'Pole ID required'", async function () {
      const { lumiChainAudit } = await deployLumiChainAuditFixture();

      await expect(
        lumiChainAudit.recordEvent(
          "TICK-001",
          "",
          "COMPLAINT_CREATED",
          "hash-123",
          "HIGH"
        )
      ).to.be.revertedWith("Pole ID required");
    });

    it("Should reject an empty eventType with 'Event type required'", async function () {
      const { lumiChainAudit } = await deployLumiChainAuditFixture();

      await expect(
        lumiChainAudit.recordEvent(
          "TICK-001",
          "SL-002",
          "",
          "hash-123",
          "HIGH"
        )
      ).to.be.revertedWith("Event type required");
    });
  });

  describe("Ownership Transfer", function () {
    it("Should allow owner to transfer ownership and allow new owner to record events", async function () {
      const { lumiChainAudit, owner, otherAccount } = await deployLumiChainAuditFixture();

      // Transfer ownership
      await lumiChainAudit.transferOwnership(otherAccount.address);
      expect(await lumiChainAudit.owner()).to.equal(otherAccount.address);

      // New owner can record event
      await expect(
        lumiChainAudit.connect(otherAccount).recordEvent(
          "TICK-010",
          "SL-010",
          "MAINTENANCE_SCHEDULED",
          "hash-789",
          "SCHEDULED"
        )
      ).to.emit(lumiChainAudit, "AuditEventRecorded");

      // Former owner cannot record event
      await expect(
        lumiChainAudit.connect(owner).recordEvent(
          "TICK-011",
          "SL-011",
          "MAINTENANCE_SCHEDULED",
          "hash-789",
          "SCHEDULED"
        )
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should revert when non-owner attempts to transfer ownership", async function () {
      const { lumiChainAudit, otherAccount } = await deployLumiChainAuditFixture();

      await expect(
        lumiChainAudit.connect(otherAccount).transferOwnership(otherAccount.address)
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should revert when transferring ownership to the zero address", async function () {
      const { lumiChainAudit } = await deployLumiChainAuditFixture();

      await expect(
        lumiChainAudit.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid owner address");
    });
  });
});
