const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDatabase = require("./config/database");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "LumiChain Backend",
        version: "1.0.0"
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        message: "LumiChain Backend API is running"
    });
});

// Connect to MongoDB and start server
const startServer = async () => {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`LumiChain Backend running on http://localhost:${PORT}`);
    });
};

startServer();