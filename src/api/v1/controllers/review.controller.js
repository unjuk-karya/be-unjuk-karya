const reviewService = require('../services/review.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const reviewController = {
    createReview: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            const { rating, comment } = req.body;

            const result = await reviewService.createReview({
                userId,
                orderId,
                rating,
                comment
            });

            return res.status(201).json(
                createSuccessResponse(result, 'Review created successfully', 201)
            );
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    },

    updateReview: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            const { rating, comment } = req.body;

            const result = await reviewService.updateReview({
                orderId,
                userId,
                rating,
                comment
            });

            return res.json(
                createSuccessResponse(result, "Review updated successfully")
            );
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    },

    getReviewByOrderId: async (req, res) => {
        try {
            const { orderId } = req.params;
            const result = await reviewService.getReviewByOrderId(orderId);

            return res.json(
                createSuccessResponse(result, "Review fetched successfully")
            );
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    },
};

module.exports = reviewController;