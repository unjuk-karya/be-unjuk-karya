const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');
const likeRoutes = require('./like.routes');
const userRoutes = require('./user.routes'); 

router.use('/auth', authRoutes);
router.use('/users', userRoutes); 
router.use('/posts', postRoutes);
router.use('/posts/:postId/comments', commentRoutes);
router.use('/posts/:postId/likes', likeRoutes);

module.exports = router;