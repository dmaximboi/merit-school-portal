const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.post('/log', activityLogController.logActivity);
router.get('/all', verifyAdmin, activityLogController.getAllLogs);
router.get('/student/:studentId', verifyAdmin, activityLogController.getStudentLogs);

module.exports = router;
