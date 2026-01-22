const express = require('express');
const router = express.Router();
const cbtController = require('../controllers/cbtController');
const { verifyAny, verifyAdmin } = require('../middleware/authMiddleware');
const { require2FA } = require('../middleware/twoFactorAuth');

// --- STUDENT CBT ROUTES ---
router.post('/generate', verifyAny, cbtController.generateQuestions);
router.post('/dictionary', verifyAny, cbtController.defineWord);
router.get('/participation', verifyAdmin, cbtController.getParticipationLogs);

// --- SETTINGS (ADMIN ONLY) ---
router.get('/settings', verifyAdmin, cbtController.getCbtSettings);
router.put('/settings', verifyAdmin, require2FA('update_settings'), cbtController.updateCbtSettings);

// --- QUESTION MANAGEMENT ---
router.post('/add-question', verifyAdmin, cbtController.addQuestion);
router.post('/bulk-generate', verifyAdmin, cbtController.bulkGenerateQuestions);
router.post('/topics', verifyAny, cbtController.getTopics);
router.get('/stats', verifyAdmin, cbtController.getQuestionStats);

module.exports = router;
