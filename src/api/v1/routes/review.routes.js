const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, reviewController.createReview);
router.put('/', authMiddleware, reviewController.updateReview);
router.get('/',authMiddleware , reviewController.getReviewByOrderId);

module.exports = router;