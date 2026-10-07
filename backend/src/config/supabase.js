const dns = require("node:dns");
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("FATAL: SUPABASE_URL and SUPABASE_ANON_KEY must be provided in .env");
    process.exit(1);
}

const WebSocket = require("ws");

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    realtime: {
        transport: WebSocket,
    },
});

/**
 * Validates connection to Supabase database.
 */
const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase
            .from("streetlights")
            .select("pole_id")
            .limit(1);

        if (error) {
            throw error;
        }

        console.log("Supabase PostgreSQL connected successfully");
        return true;
    } catch (error) {
        console.error("Supabase connection failed:", error.message);
        throw error;
    }
};

module.exports = {
    supabase,
    checkSupabaseConnection,
};
