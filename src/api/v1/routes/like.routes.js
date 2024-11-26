const express = require('express');
const router = express.Router({ mergeParams: true });
const likeController = require('../controllers/like.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', likeController.getPostLikes);
router.post('/', authMiddleware, likeController.toggleLike);

module.exports = router;