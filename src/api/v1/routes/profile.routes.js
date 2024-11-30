const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const createUpload = require('../middlewares/upload.middleware');

router.put('/profile', authMiddleware, ...createUpload('avatar', 'avatars/'), profileController.updateProfile);

module.exports = router;