const { supabase } = require("../config/supabase");

/**
 * Retrieves all streetlights from Supabase with optional filters.
 */
const getAllStreetlights = async ({ zone, status, limit = 50 } = {}) => {
    let query = supabase
        .from("streetlights")
        .select("*")
        .order("pole_id", { ascending: true })
        .limit(limit);

    if (zone) {
        query = query.eq("zone", zone);
    }
    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch streetlights: ${error.message}`);
    }
    return data;
};

/**
 * Retrieves a single streetlight by pole_id.
 */
const getStreetlightByPoleId = async (poleId) => {
    const { data, error } = await supabase
        .from("streetlights")
        .select("*")
        .eq("pole_id", poleId)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = not found
        throw new Error(`Failed to fetch streetlight ${poleId}: ${error.message}`);
    }
    return data;
};

/**
 * Creates or updates a streetlight record in Supabase.
 */
const upsertStreetlight = async (streetlightData) => {
    const record = {
        pole_id: streetlightData.pole_id || streetlightData.poleId,
        zone: streetlightData.zone || "Sector-1",
        latitude: streetlightData.latitude ?? null,
        longitude: streetlightData.longitude ?? null,
        status: streetlightData.status || "WORKING",
        operating_hours: Number(streetlightData.operating_hours ?? streetlightData.operatingHours ?? 0),
        previous_failures: Number(streetlightData.previous_failures ?? streetlightData.previousFailures ?? 0),
    };

    const { data, error } = await supabase
        .from("streetlights")
        .upsert(record, { onConflict: "pole_id" })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to upsert streetlight ${record.pole_id}: ${error.message}`);
    }
    return data;
};

/**
 * Updates a streetlight's health status and telemetry timestamp.
 */
const updateStreetlightHealth = async (poleId, { status, operatingHours, previousFailures, lastTelemetryAt }) => {
    const updates = {
        last_telemetry_at: lastTelemetryAt || new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (operatingHours !== undefined) updates.operating_hours = Number(operatingHours);
    if (previousFailures !== undefined) updates.previous_failures = Number(previousFailures);

    const { data, error } = await supabase
        .from("streetlights")
        .update(updates)
        .eq("pole_id", poleId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update streetlight status for ${poleId}: ${error.message}`);
    }
    return data;
};

module.exports = {
    getAllStreetlights,
    getStreetlightByPoleId,
    upsertStreetlight,
    updateStreetlightHealth,
};
