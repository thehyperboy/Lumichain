const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { checkSupabaseConnection } = require("./config/supabase");
const { checkAiServiceHealth } = require("./services/aiService");

const streetlightRoutes = require("./routes/streetlightRoutes");
const telemetryRoutes = require("./routes/telemetryRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    credentials: true,
}));
app.use(express.json());

// Comprehensive Health check endpoint
app.get("/health", async (req, res) => {
    let supabaseStatus = "disconnected";
    try {
        await checkSupabaseConnection();
        supabaseStatus = "connected";
    } catch (e) {
        supabaseStatus = `error: ${e.message}`;
    }

    const aiStatus = await checkAiServiceHealth();

    res.status(200).json({
        status: "healthy",
        service: "LumiChain Backend",
        database: {
            provider: "Supabase PostgreSQL",
            status: supabaseStatus,
        },
        aiService: {
            url: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
            status: aiStatus.online ? "online" : "offline",
            details: aiStatus.data || aiStatus.error,
        },
        version: "2.0.0",
        timestamp: new Date().toISOString(),
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        message: "LumiChain Backend API is running (Supabase Edition)",
        version: "2.0.0",
        endpoints: {
            health: "/health",
            streetlights: "/api/streetlights",
            telemetry: "/api/telemetry",
            tickets: "/api/tickets",
        },
    });
});

// API Routes
app.use("/api/streetlights", streetlightRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/tickets", ticketRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("[Backend Error]", err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

// Connect to Supabase and start Express server
const startServer = async () => {
    try {
        await checkSupabaseConnection();

        app.listen(PORT, () => {
            console.log(`LumiChain Backend running on http://localhost:${PORT}`);
            console.log(`Connected to Supabase PostgreSQL at ${process.env.SUPABASE_URL}`);
        });
    } catch (error) {
        console.error("Failed to start server due to database connection error:", error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;