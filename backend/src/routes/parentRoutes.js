const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

// Route: POST /api/parents/login
router.post('/login', parentController.parentLogin);

module.exports = router;