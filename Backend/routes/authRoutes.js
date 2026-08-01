const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const {
    register,
    login,
    sendOTP,
    verify2FA
} = require("../controllers/authController");

const { authLimiter } = require("../middleware/rateLimiter");

// Request validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};

// Validation rules
const registerRules = [
    body("name").notEmpty().withMessage("Name is required").trim(),
    body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
    body("password")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/\d/).withMessage("Password must contain at least one number")
        .matches(/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage("Password must contain at least one special character")
];

const loginRules = [
    body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
];

// Routes with rate limiting & validation
router.post("/send-otp", authLimiter, [
    body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail()
], validateRequest, sendOTP);

router.post("/register", authLimiter, registerRules, validateRequest, register);

router.post("/login", authLimiter, loginRules, validateRequest, login);

router.post("/verify-2fa", authLimiter, [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
], validateRequest, verify2FA);

module.exports = router;