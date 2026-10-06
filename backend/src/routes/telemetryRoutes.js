const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");

router.post("/", telemetryController.postTelemetry);
router.get("/:poleId", telemetryController.getHistory);

module.exports = router;
