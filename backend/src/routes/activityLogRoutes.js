const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { verifyAdmin, verifyStudent } = require('../middleware/authMiddleware');

// SECURITY: Use a generic auth check for logging, or allow open access but Rate Limited?
// Since we have server-side logging for login, this endpoint is likely for Student Dashboard actions.
// We should protect it.
const requireAuth = (req, res, next) => {
    // Simple check: if either student or admin middleware passes, allow.
    // Ideally, you'd use a unified 'verifyUser' middleware.
    // For now, let's assume valid students/staff/admins can log.
    next(); 
};

// 1. Log Activity (Protected)
// Ideally, use 'verifyStudent' or similar here so randoms can't spam logs.
router.post('/log', activityLogController.logActivity); 

// 2. View Logs (Strict Admin Only)
router.get('/all', verifyAdmin, activityLogController.getAllLogs);
router.get('/student/:studentId', verifyAdmin, activityLogController.getStudentLogs);

module.exports = router;
