const express = require('express');
const router = express.Router({ mergeParams: true });
const replyLikeController = require('../controllers/reply-like.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, replyLikeController.toggleLike);

module.exports = router;