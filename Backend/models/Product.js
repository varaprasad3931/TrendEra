const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    price: {
        type: Number,
        required: true
    },

    image: {
        type: String
    },

    images: [{
        type: String
    }],

    videos: [{
        type: String
    }],

    features: [{
        type: String
    }],

    specifications: [{
        group: { type: String },
        name: { type: String },
        value: { type: String }
    }],

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    stock: {
        type: Number,
        default: 0
    },

    averageRating: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);