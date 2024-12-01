const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const createUpload = require('../middlewares/upload.middleware');

router.put(
  '/profile', 
  authMiddleware, 
  createUpload([
    { name: 'avatar', path: 'avatars/' },
    { name: 'coverPhoto', path: 'covers/' }
  ]), 
  profileController.updateProfile
);

router.get('/:userId/profile', authMiddleware, profileController.getUserProfile);

module.exports = router;