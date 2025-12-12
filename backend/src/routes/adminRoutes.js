const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(verifyAdmin);

// Dashboard Stats
router.get('/dashboard-stats', adminController.getDashboardStats);

// Students
router.get('/students', adminController.getAllStudents);
router.post('/update-student', adminController.updateStudentStatus);
router.delete('/students/:id', adminController.deleteStudent); // FIXED: Added this route

// Settings & Fees
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSystemSettings);

// Broadcasts
router.post('/broadcast', adminController.sendBroadcast);

// Staff Token
router.post('/generate-code', adminController.generateStaffCode);

module.exports = router;
