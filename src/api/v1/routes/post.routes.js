const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const createUpload = require('../middlewares/upload.middleware');

router.post('/', authMiddleware, ...createUpload('image', 'posts/'), postController.createPost);
router.put('/:id', authMiddleware, ...createUpload('image', 'posts/'), postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.get('/', authMiddleware, postController.getAllPosts);
router.get('/feed', authMiddleware, postController.getFollowingPosts);
router.get('/:id',authMiddleware, postController.getPostById);

module.exports = router;