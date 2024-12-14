const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, orderController.createOrder);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);
router.post('/notification', orderController.handleNotification);
router.get('/history', authMiddleware, orderController.getTransactionHistory);

module.exports = router;