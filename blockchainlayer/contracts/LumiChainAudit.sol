// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract LumiChainAudit {
    address public owner;

    struct AuditRecord {
        string complaintId;
        string poleId;
        string eventType;
        string dataHash;
        string status;
        uint256 timestamp;
        address recordedBy;
    }

    mapping(bytes32 => AuditRecord) private auditRecords;

    event AuditEventRecorded(
        bytes32 indexed recordId,
        string complaintId,
        string poleId,
        string eventType,
        string status,
        uint256 timestamp,
        address recordedBy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordEvent(
        string memory complaintId,
        string memory poleId,
        string memory eventType,
        string memory dataHash,
        string memory status
    ) public onlyOwner returns (bytes32) {
        require(bytes(complaintId).length > 0, "Complaint ID required");
        require(bytes(poleId).length > 0, "Pole ID required");
        require(bytes(eventType).length > 0, "Event type required");

        bytes32 recordId = keccak256(
            abi.encodePacked(
                complaintId,
                poleId,
                eventType,
                block.timestamp,
                msg.sender
            )
        );

        auditRecords[recordId] = AuditRecord({
            complaintId: complaintId,
            poleId: poleId,
            eventType: eventType,
            dataHash: dataHash,
            status: status,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });

        emit AuditEventRecorded(
            recordId,
            complaintId,
            poleId,
            eventType,
            status,
            block.timestamp,
            msg.sender
        );

        return recordId;
    }

    function getAuditRecord(
        bytes32 recordId
    )
        public
        view
        returns (
            string memory complaintId,
            string memory poleId,
            string memory eventType,
            string memory dataHash,
            string memory status,
            uint256 timestamp,
            address recordedBy
        )
    {
        AuditRecord memory record = auditRecords[recordId];

        return (
            record.complaintId,
            record.poleId,
            record.eventType,
            record.dataHash,
            record.status,
            record.timestamp,
            record.recordedBy
        );
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid owner address");
        owner = newOwner;
    }
}