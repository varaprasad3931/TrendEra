const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: "user"
    },

    loginAttempts: {
        type: Number,
        required: true,
        default: 0
    },

    lockUntil: {
        type: Date
    },

    twoFactorSecret: {
        type: String
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);