const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const createUpload = require('../middlewares/upload.middleware');

router.put('/profile', authMiddleware, createUpload('./public/uploads/avatars/').single('avatar'), profileController.updateProfile);

module.exports = router;