const crypto = require("crypto");
const { supabase } = require("../config/supabase");
const { predictStreetlightFailure } = require("./aiService");
const { updateStreetlightHealth, getStreetlightByPoleId, upsertStreetlight } = require("./streetlightService");
const { createTicket } = require("./ticketService");
const { recordMaintenanceEvent } = require("./blockchainService");

/**
 * Ingests streetlight telemetry, runs AI diagnosis, records logs in Supabase,
 * updates pole health, and auto-generates maintenance tickets when required.
 */
const ingestTelemetry = async (telemetryInput) => {
    const poleId = telemetryInput.pole_id || telemetryInput.poleId;
    if (!poleId) {
        throw new Error("Missing required field: poleId");
    }

    // 1. Ensure pole exists in Supabase streetlights table
    let pole = await getStreetlightByPoleId(poleId);
    if (!pole) {
        pole = await upsertStreetlight({
            poleId,
            zone: telemetryInput.zone || "Sector-1",
            operatingHours: telemetryInput.operating_hours || telemetryInput.operatingHours || 0,
            previousFailures: telemetryInput.previous_failures || telemetryInput.previousFailures || 0,
        });
    }

    // 2. Invoke LumiChain AI Service for ML inference & Decision Engine verification
    const aiDecision = await predictStreetlightFailure(telemetryInput);

    // 3. Insert Telemetry Log into Supabase
    const telemetryRecord = {
        pole_id: poleId,
        current: Number(telemetryInput.current),
        voltage: Number(telemetryInput.voltage),
        light_intensity: Number(telemetryInput.light_intensity ?? telemetryInput.lightIntensity),
        temperature: Number(telemetryInput.temperature),
        neighbor_confirmation: Number(telemetryInput.neighbor_confirmation ?? telemetryInput.neighborConfirmation ?? 0),
        operating_hours: Number(telemetryInput.operating_hours ?? telemetryInput.operatingHours ?? pole.operating_hours),
        previous_failures: Number(telemetryInput.previous_failures ?? telemetryInput.previousFailures ?? pole.previous_failures),
        ai_failure_detected: Boolean(aiDecision.failureDetected),
        ai_failure_type: aiDecision.failureType || "WORKING",
        ai_confidence: Number(aiDecision.confidence || 0),
        ai_verification_status: aiDecision.verificationStatus || "NORMAL",
        ai_priority: aiDecision.priority || "LOW",
        ai_recommendation: aiDecision.recommendation || "NO_ACTION",
        ai_reason: aiDecision.reason || "",
        sensor_alerts: aiDecision.sensorAlerts || [],
    };

    const { data: savedLog, error: logError } = await supabase
        .from("telemetry_logs")
        .insert(telemetryRecord)
        .select()
        .single();

    if (logError) {
        throw new Error(`Failed to save telemetry log: ${logError.message}`);
    }

    // 4. Update Streetlight Pole status in Supabase
    const newStatus = aiDecision.failureDetected ? aiDecision.failureType : "WORKING";
    let updatedPreviousFailures = Number(telemetryRecord.previous_failures);
    if (aiDecision.failureDetected && pole.status === "WORKING") {
        updatedPreviousFailures += 1;
    }

    await updateStreetlightHealth(poleId, {
        status: newStatus,
        operatingHours: telemetryRecord.operating_hours,
        previousFailures: updatedPreviousFailures,
        lastTelemetryAt: savedLog.created_at,
    });

    // 5. Automatic Maintenance Ticket Generation if recommended
    let ticket = null;
    let blockchainAudit = null;

    if (aiDecision.recommendation === "CREATE_MAINTENANCE_COMPLAINT") {
        // Check if an OPEN or IN_PROGRESS ticket already exists for this pole
        const { data: existingTickets } = await supabase
            .from("maintenance_tickets")
            .select("id, ticket_number, status")
            .eq("pole_id", poleId)
            .in("status", ["OPEN", "IN_PROGRESS"])
            .limit(1);

        if (!existingTickets || existingTickets.length === 0) {
            ticket = await createTicket({
                poleId,
                failureType: aiDecision.failureType,
                priority: aiDecision.priority,
                verificationStatus: aiDecision.verificationStatus,
                description: aiDecision.reason,
                telemetrySnapshot: {
                    current: telemetryRecord.current,
                    voltage: telemetryRecord.voltage,
                    light_intensity: telemetryRecord.light_intensity,
                    temperature: telemetryRecord.temperature,
                    neighbor_confirmation: telemetryRecord.neighbor_confirmation,
                    sensor_alerts: telemetryRecord.sensor_alerts,
                },
            });
        } else {
            ticket = existingTickets[0]; // Active ticket already exists
        }

        // 6. Cryptographically anchor fault event on the blockchain smart contract
        if (ticket) {
            try {
                const telemetryPayloadString = JSON.stringify({
                    poleId,
                    current: telemetryRecord.current,
                    voltage: telemetryRecord.voltage,
                    failureType: aiDecision.failureType,
                    ticketNumber: ticket.ticket_number || ticket.id,
                    timestamp: savedLog.created_at,
                });
                const dataHash = "0x" + crypto.createHash("sha256").update(telemetryPayloadString).digest("hex");

                blockchainAudit = await recordMaintenanceEvent({
                    complaintId: ticket.ticket_number || ticket.id,
                    poleId,
                    eventType: "AI_FAULT_DETECTED",
                    dataHash,
                    status: aiDecision.priority || "HIGH",
                });
                console.log(`[Blockchain] Auto-anchored AI fault for ${poleId} (Tx: ${blockchainAudit.transactionHash}, Record: ${blockchainAudit.recordId})`);
            } catch (bcError) {
                console.warn(`[Blockchain] Auto-anchor skipped or failed: ${bcError.message}`);
            }
        }
    }

    return {
        poleId,
        telemetry: savedLog,
        aiDecision,
        ticket,
        blockchainAudit,
    };
};

/**
 * Retrieves recent telemetry history for a specific pole.
 */
const getTelemetryHistory = async (poleId, limit = 50) => {
    const { data, error } = await supabase
        .from("telemetry_logs")
        .select("*")
        .eq("pole_id", poleId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to fetch telemetry history for ${poleId}: ${error.message}`);
    }
    return data;
};

module.exports = {
    ingestTelemetry,
    getTelemetryHistory,
};
