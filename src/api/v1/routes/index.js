const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');
const postLike = require('./post-like.routes');
const searchRoutes = require('./search.routes');
const saveRoute = require('./save.routes');
const commentLikeRoutes = require('./comment-like.routes');
const followRoutes = require('./follow.routes');
const profileRoutes = require('./profile.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const reviewRoutes = require('./review.routes');
const categoryRoutes = require('./category.routes');

router.use('/auth', authRoutes);
router.use('/users', searchRoutes);
router.use('/users', followRoutes);
router.use('/users', profileRoutes);
router.use('/posts', postRoutes);
router.use('/posts/:postId/likes', postLike);

router.use('/posts/:postId/comments', commentRoutes);
router.use('/posts/:postId/comments/:commentId/likes', commentLikeRoutes);

router.use('/products', productRoutes);
router.use('/products/:productId/saves', saveRoute);
router.use('/orders', orderRoutes);
router.use('/orders/:orderId/reviews', reviewRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;