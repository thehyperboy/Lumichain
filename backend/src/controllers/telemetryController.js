const telemetryService = require("../services/telemetryService");

const postTelemetry = async (req, res) => {
    try {
        const result = await telemetryService.ingestTelemetry(req.body);
        res.status(200).json({
            success: true,
            message: "Telemetry processed and logged successfully",
            data: result,
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const { poleId } = req.params;
        const { limit } = req.query;
        const history = await telemetryService.getTelemetryHistory(poleId, limit ? Number(limit) : 50);

        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    postTelemetry,
    getHistory,
};
