const ticketService = require("../services/ticketService");

const getTickets = async (req, res) => {
    try {
        const { status, priority, limit } = req.query;
        const tickets = await ticketService.getAllTickets({
            status,
            priority,
            limit: limit ? Number(limit) : 50,
        });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await ticketService.getTicketById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: `Ticket '${id}' not found.`,
            });
        }

        res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: "Missing required field 'status'.",
            });
        }

        const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const updated = await ticketService.updateTicketStatus(id, status);
        res.status(200).json({
            success: true,
            message: `Ticket status updated to ${status}`,
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createManualTicket = async (req, res) => {
    try {
        const { poleId, failureType, priority, description } = req.body;
        if (!poleId || !failureType) {
            return res.status(400).json({
                success: false,
                error: "Fields 'poleId' and 'failureType' are required.",
            });
        }

        const ticket = await ticketService.createTicket({
            poleId,
            failureType,
            priority: priority || "MEDIUM",
            description,
            verificationStatus: "MANUAL",
        });

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: ticket,
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    getTickets,
    getTicketById,
    updateStatus,
    createManualTicket,
};
