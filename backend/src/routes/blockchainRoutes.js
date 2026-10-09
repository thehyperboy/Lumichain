const express = require("express");
const router = express.Router();
const {
    checkBlockchainConnection,
    recordMaintenanceEvent,
    getMaintenanceRecord,
    getAuditEvents
} = require("../services/blockchainService");

// Check blockchain RPC and contract status
router.get("/status", async (req, res) => {
    try {
        const result = await checkBlockchainConnection();
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Record an audit event on-chain
router.post("/record", async (req, res) => {
    try {
        const { complaintId, poleId, eventType, dataHash, status } = req.body;
        if (!complaintId || !poleId || !eventType || !dataHash || !status) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: complaintId, poleId, eventType, dataHash, status"
            });
        }

        const result = await recordMaintenanceEvent({
            complaintId,
            poleId,
            eventType,
            dataHash,
            status
        });

        res.status(201).json({
            success: true,
            message: "Audit record committed on-chain",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Retrieve an audit record by recordId
router.get("/record/:recordId", async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await getMaintenanceRecord(recordId);
        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// List all smart contract audit events
router.get("/events", async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const events = await getAuditEvents(limit);
        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cryptographically verify a record on-chain
router.post("/verify", async (req, res) => {
    try {
        const { recordId } = req.body;
        if (!recordId) {
            return res.status(400).json({
                success: false,
                error: "Missing required field: recordId"
            });
        }
        const record = await getMaintenanceRecord(recordId);
        res.status(200).json({
            success: true,
            verified: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            verified: false,
            error: error.message
        });
    }
});

module.exports = router;
