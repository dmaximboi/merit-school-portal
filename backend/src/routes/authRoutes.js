const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// --- PUBLIC VALIDATION ---
// Used by Student Register to check duplicate emails
router.post('/check-email', authController.checkEmailExists);

// --- LOGIN ROUTES (Restored to match Frontend) ---
// Frontend calls: /auth/admin/login
router.post('/admin/login', authController.adminLogin);

// Frontend calls: /auth/student/login
router.post('/student/login', authController.studentLogin);

// Frontend calls: /auth/staff/login
router.post('/staff/login', authController.staffLogin);

// Frontend calls: /auth/parent/login
router.post('/parent/login', authController.parentLogin);

// --- REGISTER ROUTES ---
// Note: Student Register mainly uses /students/register (via studentRoutes), 
// but we keep this here for direct auth access if needed.
router.post('/student/register', authController.registerStudent);

module.exports = router;
