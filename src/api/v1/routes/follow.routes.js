const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/:userId/followers', authMiddleware, followController.getFollowers);
router.get('/:userId/following', authMiddleware, followController.getFollowing);
router.post('/:userId/follow', authMiddleware, followController.toggleFollow);

module.exports = router;