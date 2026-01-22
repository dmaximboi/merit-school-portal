const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { verifyAny } = require('../middleware/authMiddleware');

// --- QUIZ ROUTES FOR ALL ROLES (Admin, Staff, Parent, Student) ---
// Uses verifyAny middleware to allow any authenticated user

router.get('/public', verifyAny, quizController.getPublicQuizzes);
router.post('/create', verifyAny, quizController.createQuiz);
router.post('/attempt', verifyAny, quizController.submitAttempt);
router.get('/history', verifyAny, quizController.getMyHistory);
router.get('/leaderboard', verifyAny, quizController.getLeaderboard);

module.exports = router;
