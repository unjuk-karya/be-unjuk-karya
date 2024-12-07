const orderService = require('../services/order.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const orderController = {
    createOrder: async (req, res) => {
        try {
            const userId = req.user.id;
            const { productId, quantity } = req.body;

            const result = await orderService.createOrder({
                userId,
                productId,
                quantity
            });

            return res.status(201).json(
                createSuccessResponse(result, 'Order created successfully', 201)
            );
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    },

    cancelOrder: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const result = await orderService.cancelOrder({
                orderId: id,
                userId
            });

            return res.json(
                createSuccessResponse(result, 'Order cancelled successfully')
            );
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    },

    handleNotification: async (req, res) => {
        try {
            const notification = req.body;

            const result = await orderService.handleNotification(notification);

            return res.json(
                createSuccessResponse(result, 'Payment notification handled successfully')
            );
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    }
};

module.exports = orderController;