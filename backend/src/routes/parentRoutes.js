const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

// Routes
router.post('/login', parentController.parentLogin);
router.post('/update-password', parentController.updatePassword); 

module.exports = router;
