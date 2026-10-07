const express = require("express");
const router = express.Router();
const {
    checkBlockchainConnection,
    recordMaintenanceEvent,
    getMaintenanceRecord
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

module.exports = router;
