const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// In-memory store for registration OTPs (email -> { otp, expires })
const tempOtps = new Map();

// Helper to generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for registration
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const otp = generateOTP();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        // Save to temporary memory store
        tempOtps.set(email.toLowerCase(), { otp, expires });

        // Log to console for testing/development
        console.log(`\n==============================================`);
        console.log(`[SECURITY] OTP for registering ${email}: ${otp}`);
        console.log(`==============================================\n`);

        res.status(200).json({
            message: "Verification code sent to email.",
            // In developer mode, we can include it in the response header or body for convenience,
            // but to be secure we just print it to the console. However, let's send it in response
            // ONLY if process.env.NODE_ENV !== 'production' or just return it in a helper field for easy UI toast testing.
            // Let's include devOtp for easy testing so the user doesn't have to look at terminal log!
            devOtp: otp 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        // Check if OTP is provided
        if (!otp) {
            return res.status(400).json({ message: "Verification code (OTP) is required" });
        }

        // Verify OTP
        const cached = tempOtps.get(email.toLowerCase());
        if (!cached) {
            return res.status(400).json({ message: "OTP not requested or expired" });
        }

        if (cached.expires < Date.now()) {
            tempOtps.delete(email.toLowerCase());
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        if (cached.otp !== otp) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Clear OTP on success
        tempOtps.delete(email.toLowerCase());

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User Registered Successfully",
            user: userResponse
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User (First Step)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // Check Lockout Status
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(403).json({
                message: `Account temporarily locked due to too many failed attempts. Try again in ${timeRemaining} minutes.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Increment failed attempts
            user.loginAttempts += 1;

            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
                user.loginAttempts = 0; // Reset attempts for next session
                await user.save();
                return res.status(403).json({
                    message: "Account locked for 15 minutes due to 5 consecutive failed login attempts."
                });
            }

            await user.save();
            const attemptsLeft = 5 - user.loginAttempts;
            return res.status(401).json({
                message: `Invalid Password. You have ${attemptsLeft} attempts remaining before account lock.`
            });
        }

        // Credentials are correct. Generate OTP for 2-step verification (2FA)
        const otp = generateOTP();
        const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        // Store OTP in user document as "otp:expires"
        user.twoFactorSecret = `${otp}:${otpExpires}`;
        await user.save();

        // Log OTP to console
        console.log(`\n==============================================`);
        console.log(`[SECURITY] 2FA OTP for logging in ${email}: ${otp}`);
        console.log(`==============================================\n`);

        res.status(200).json({
            requires2FA: true,
            userId: user._id,
            message: "Verification code sent. Please enter the OTP to login.",
            devOtp: otp // Included for easy frontend toast demo testing
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify 2FA OTP and complete login
exports.verify2FA = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ message: "User ID and OTP are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check Lockout Status just in case
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(403).json({
                message: `Account is locked. Try again in ${timeRemaining} minutes.`
            });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: "No active 2FA request found for this user." });
        }

        const [savedOtp, expiryStr] = user.twoFactorSecret.split(":");
        const expiry = parseInt(expiryStr, 10);

        if (expiry < Date.now()) {
            user.twoFactorSecret = undefined;
            await user.save();
            return res.status(400).json({ message: "Verification code expired. Please log in again." });
        }

        if (savedOtp !== otp) {
            // We can optionally count failed OTP entry towards lockout, but usually password failures lock.
            // Let's increment failed attempts if they keep guessing OTPs to prevent OTP brute forcing!
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000;
                user.loginAttempts = 0;
                user.twoFactorSecret = undefined;
                await user.save();
                return res.status(403).json({
                    message: "Account locked for 15 minutes due to too many failed verification attempts."
                });
            }
            await user.save();
            const attemptsLeft = 5 - user.loginAttempts;
            return res.status(400).json({
                message: `Invalid verification code. ${attemptsLeft} attempts remaining.`
            });
        }

        // OTP is correct! Clear security values and reset lock parameters
        user.twoFactorSecret = undefined;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.twoFactorSecret;

        res.status(200).json({
            token,
            user: userResponse
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};