const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createTicket,
    getTickets,
    addReply
} = require("../controllers/supportController");

// All support routes require authentication
router.post("/tickets", authMiddleware, createTicket);
router.get("/tickets", authMiddleware, getTickets);
router.post("/tickets/:id/reply", authMiddleware, addReply);

module.exports = router;
