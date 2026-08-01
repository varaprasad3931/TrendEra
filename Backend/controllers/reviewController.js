const Review = require("../models/Review");

exports.getReviews = async (req, res) => {

    try {

        let query = {};
        if (req.query.productId) {
            query.product = req.query.productId;
        }

        const reviews =
            await Review.find(query)
            .populate("user")
            .populate("product");

        res.status(200).json(reviews);

    }
    catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

exports.addReview = async (req, res) => {

    try {

        const review =
            await Review.create(req.body);

        res.status(201).json(review);

    }
    catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

exports.deleteReview = async (req, res) => {

    try {

        await Review.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            message: "Review Deleted"
        });

    }
    catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};