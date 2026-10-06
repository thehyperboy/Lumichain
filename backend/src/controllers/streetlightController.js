const streetlightService = require("../services/streetlightService");

const getStreetlights = async (req, res) => {
    try {
        const { zone, status, limit } = req.query;
        const streetlights = await streetlightService.getAllStreetlights({
            zone,
            status,
            limit: limit ? Number(limit) : 50,
        });

        res.status(200).json({
            success: true,
            count: streetlights.length,
            data: streetlights,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getStreetlightById = async (req, res) => {
    try {
        const { poleId } = req.params;
        const streetlight = await streetlightService.getStreetlightByPoleId(poleId);

        if (!streetlight) {
            return res.status(404).json({
                success: false,
                error: `Streetlight pole '${poleId}' not found.`,
            });
        }

        res.status(200).json({
            success: true,
            data: streetlight,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createOrUpdateStreetlight = async (req, res) => {
    try {
        const streetlight = await streetlightService.upsertStreetlight(req.body);
        res.status(201).json({
            success: true,
            message: "Streetlight saved successfully",
            data: streetlight,
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    getStreetlights,
    getStreetlightById,
    createOrUpdateStreetlight,
};
