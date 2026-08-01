const express = require("express");
const router = express.Router();
const {
    placeOrder,
    getOrders,
    getOrderById,
    getMyOrders,
    updateOrderStatus,
    deleteOrder,
    cancelOrder
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// User routes (authenticated)
router.post("/", authMiddleware, placeOrder);
router.get("/myorders", authMiddleware, getMyOrders);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id/cancel", authMiddleware, cancelOrder);

// Admin routes
router.get("/", authMiddleware, adminMiddleware, getOrders);
router.put("/:id", authMiddleware, adminMiddleware, updateOrderStatus);
router.delete("/:id", authMiddleware, adminMiddleware, deleteOrder);

module.exports = router;