const crypto = require("crypto");
const { supabase } = require("../config/supabase");
const { recordMaintenanceEvent } = require("./blockchainService");

/**
 * Creates a maintenance complaint/ticket in Supabase.
 */
const createTicket = async ({
    poleId,
    failureType,
    priority,
    verificationStatus = "CONFIRMED",
    description = "",
    telemetrySnapshot = {},
}) => {
    // Generate clean unique ticket number
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `TICK-${timestamp}-${randomSuffix}`;

    const record = {
        ticket_number: ticketNumber,
        pole_id: poleId,
        failure_type: failureType,
        priority: priority || "MEDIUM",
        status: "OPEN",
        verification_status: verificationStatus,
        description: description || `Automated maintenance ticket for ${failureType} on pole ${poleId}`,
        telemetry_snapshot: telemetrySnapshot,
    };

    const { data, error } = await supabase
        .from("maintenance_tickets")
        .insert(record)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create ticket for ${poleId}: ${error.message}`);
    }
    return data;
};

/**
 * Retrieves maintenance tickets with optional status and priority filters.
 */
const getAllTickets = async ({ status, priority, limit = 50 } = {}) => {
    let query = supabase
        .from("maintenance_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (status) {
        query = query.eq("status", status);
    }
    if (priority) {
        query = query.eq("priority", priority);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
    return data;
};

/**
 * Retrieves a single maintenance ticket by id or ticket_number.
 */
const getTicketById = async (idOrNumber) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const column = isUuid ? "id" : "ticket_number";

    const { data, error } = await supabase
        .from("maintenance_tickets")
        .select("*")
        .eq(column, idOrNumber)
        .single();

    if (error) {
        throw new Error(`Failed to fetch ticket ${idOrNumber}: ${error.message}`);
    }
    return data;
};

/**
 * Updates status of a maintenance ticket (e.g. IN_PROGRESS, RESOLVED, CLOSED).
 */
const updateTicketStatus = async (idOrNumber, newStatus) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const column = isUuid ? "id" : "ticket_number";

    const updates = {
        status: newStatus,
        updated_at: new Date().toISOString(),
    };

    if (newStatus === "RESOLVED" || newStatus === "CLOSED") {
        updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from("maintenance_tickets")
        .update(updates)
        .eq(column, idOrNumber)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update ticket ${idOrNumber}: ${error.message}`);
    }

    // Automatically restore streetlight to WORKING when ticket is resolved
    if (data?.pole_id && (newStatus === "RESOLVED" || newStatus === "CLOSED")) {
        try {
            await supabase
                .from("streetlights")
                .update({ status: "WORKING", updated_at: new Date().toISOString() })
                .eq("pole_id", data.pole_id);
        } catch (slErr) {
            console.warn(`[Streetlight] Failed to restore pole status: ${slErr.message}`);
        }

        // Anchor repair resolution on smart contract
        try {
            const repairHash = "0x" + crypto
                .createHash("sha256")
                .update(JSON.stringify({ ticketId: data.id, poleId: data.pole_id, status: newStatus, resolvedAt: updates.resolved_at }))
                .digest("hex");

            const bcReceipt = await recordMaintenanceEvent({
                complaintId: data.ticket_number || data.id,
                poleId: data.pole_id,
                eventType: "REPAIR_VERIFIED",
                dataHash: repairHash,
                status: "RESOLVED",
            });
            console.log(`[Blockchain] Auto-anchored REPAIR_VERIFIED for ${data.pole_id} (Tx: ${bcReceipt.transactionHash})`);
            data.blockchainAudit = bcReceipt;
        } catch (bcErr) {
            console.warn(`[Blockchain] Auto-anchor repair failed: ${bcErr.message}`);
        }
    }

    return data;
};

module.exports = {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicketStatus,
};
