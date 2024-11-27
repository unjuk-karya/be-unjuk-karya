const express = require('express');
const router = express.Router({ mergeParams: true });
const replyController = require('../controllers/reply.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/',authMiddleware, replyController.getReplies);
router.post('/', authMiddleware, replyController.createReply);
router.delete('/:id', authMiddleware, replyController.deleteReply);

module.exports = router;