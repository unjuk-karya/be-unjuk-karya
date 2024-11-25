const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/', authMiddleware, upload.single('image'), postController.createPost);
router.put('/:id', authMiddleware, upload.single('image'), postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;