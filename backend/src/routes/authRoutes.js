const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Admin Auth
router.post('/admin/login', authController.adminLogin); 

// Student Auth
router.post('/student/login', authController.studentLogin);
router.post('/student/register', authController.registerStudent);

module.exports = router;
