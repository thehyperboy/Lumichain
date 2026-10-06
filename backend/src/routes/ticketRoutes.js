const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.get("/", ticketController.getTickets);
router.get("/:id", ticketController.getTicketById);
router.patch("/:id/status", ticketController.updateStatus);
router.post("/", ticketController.createManualTicket);

module.exports = router;
