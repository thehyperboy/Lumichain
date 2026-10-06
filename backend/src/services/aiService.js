const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Sends telemetry data to the LumiChain AI Service for ML inference & Decision Engine verification.
 */
const predictStreetlightFailure = async (telemetryData) => {
    try {
        const payload = {
            poleId: telemetryData.pole_id || telemetryData.poleId,
            current: Number(telemetryData.current),
            voltage: Number(telemetryData.voltage),
            lightIntensity: Number(telemetryData.light_intensity ?? telemetryData.lightIntensity),
            temperature: Number(telemetryData.temperature),
            neighborConfirmation: Number(telemetryData.neighbor_confirmation ?? telemetryData.neighborConfirmation ?? 0),
            operatingHours: Number(telemetryData.operating_hours ?? telemetryData.operatingHours ?? 0),
            previousFailures: Number(telemetryData.previous_failures ?? telemetryData.previousFailures ?? 0),
        };

        const response = await axios.post(`${AI_SERVICE_URL}/predict`, payload, {
            timeout: 5000,
        });

        return response.data;
    } catch (error) {
        console.warn(`[AI Service Warning] Failed to reach AI service at ${AI_SERVICE_URL}:`, error.message);
        
        // Return a fallback decision if AI service is temporarily unreachable
        return {
            poleId: telemetryData.pole_id || telemetryData.poleId,
            failureDetected: false,
            failureType: "UNKNOWN",
            confidence: 0.0,
            verificationStatus: "UNCERTAIN",
            priority: "MEDIUM",
            recommendation: "REQUEST_RECHECK",
            reason: `AI service inference unavailable (${error.message}). Telemetry logged for deferred analysis.`,
            sensorAlerts: ["AI_SERVICE_OFFLINE"],
        };
    }
};

/**
 * Checks health of the AI Service.
 */
const checkAiServiceHealth = async () => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 });
        return { online: true, data: response.data };
    } catch (error) {
        return { online: false, error: error.message };
    }
};

module.exports = {
    predictStreetlightFailure,
    checkAiServiceHealth,
};
