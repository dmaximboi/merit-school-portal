const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const cbtController = require('../controllers/cbtController');

router.use(verifyAdmin);

// Dashboard Stats
router.get('/dashboard-stats', adminController.getDashboardStats);

// Students
router.get('/students', adminController.getAllStudents);
router.post('/update-student', adminController.updateStudentStatus);
router.delete('/students/:id', adminController.deleteStudent);

// Settings & Fees
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSystemSettings);

// Broadcasts
router.post('/broadcast', adminController.sendBroadcast);
router.put('/broadcast/:id', adminController.updateBroadcast);
router.delete('/broadcast/:id', adminController.deleteBroadcast);

// Transaction Logs
router.get('/transactions', adminController.getTransactionLogs);
router.post('/transactions/update', adminController.updateTransactionStatus);

// Staff Token & Management
router.post('/generate-code', adminController.generateStaffCode);
router.get('/staff', adminController.getAllStaff);

// CBT Management
router.post('/cbt-question', cbtController.addQuestion);
router.post('/cbt-bulk-generate', cbtController.bulkGenerateQuestions);
router.get('/cbt-logs', cbtController.getParticipationLogs);
router.get('/cbt-settings', cbtController.getCbtSettings);
router.post('/cbt-settings', cbtController.updateCbtSettings);
router.get('/cbt-question-stats', cbtController.getQuestionStats);

// Student Export
const exportController = require('../controllers/exportController');
router.get('/export/students', exportController.getExportData);
router.get('/export/filters', exportController.getFilterOptions);
router.get('/export/stats', exportController.getStats);

module.exports = router;

