const express = require("express");
const router = express.Router();
const streetlightController = require("../controllers/streetlightController");

router.get("/", streetlightController.getStreetlights);
router.get("/:poleId", streetlightController.getStreetlightById);
router.post("/", streetlightController.createOrUpdateStreetlight);

module.exports = router;
