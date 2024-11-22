const express = require('express');
const router = express.Router();
const v1Routes = require('./routes');

// Prefix semua routes dengan /api/v1
router.use('/v1', v1Routes);

module.exports = router;