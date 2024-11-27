const express = require('express');
const router = express.Router({ mergeParams: true });
const commentLikeController = require('../controllers/comment-like.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, commentLikeController.toggleLike);

module.exports = router;