const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');
const postLike = require('./post-like.routes');
const userRoutes = require('./user.routes'); 
const favoriteRoutes = require('./favorite.routes');
const commentLikeRoutes = require('./comment-like.routes');
const replyRoutes = require('./reply.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/posts/:postId/likes', postLike);
router.use('/posts/:postId/comments', commentRoutes);
router.use('/posts/:postId/comments/:commentId/likes', commentLikeRoutes);
router.use('/posts/:postId/comments/:commentId/replies', replyRoutes);
router.use('/posts/:postId/favorites', favoriteRoutes);


module.exports = router;