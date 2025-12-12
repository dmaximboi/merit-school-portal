const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

router.post('/login', parentController.parentLogin);

module.exports = router;
