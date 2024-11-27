const express = require('express');
const router = express.Router({ mergeParams: true });
const likeController = require('../controllers/post-like.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, likeController.getPostLikes);
router.post('/', authMiddleware, likeController.toggleLike);

module.exports = router;