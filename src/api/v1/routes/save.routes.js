const express = require('express');
const router = express.Router({ mergeParams: true });
const saveController = require('../controllers/save.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, saveController.toggleSave);

module.exports = router;