const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/posts/:postId/comments', commentRoutes);

module.exports = router;