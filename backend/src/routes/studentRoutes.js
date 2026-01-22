const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const cbtController = require('../controllers/cbtController');
const quizController = require('../controllers/quizController');
const { verifyStudent } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
router.post('/register', authController.registerStudent);

// --- PROTECTED ROUTES (Require Login) ---
// These routes will now have access to 'req.user' because of 'verifyStudent'
router.get('/profile/:id', verifyStudent, studentController.getStudentProfile);
router.get('/announcements', verifyStudent, studentController.getAnnouncements);
router.get('/fees', verifyStudent, studentController.getSchoolFees);
router.post('/verify-payment', verifyStudent, studentController.verifyPayment);
router.post('/manual-payment', verifyStudent, studentController.submitManualPayment);

// --- CBT ROUTES ---
router.post('/cbt/generate', verifyStudent, cbtController.generateQuestions);
router.post('/topics', verifyStudent, cbtController.getTopics);

// --- QUIZ ROUTES ---
router.get('/quiz/public', verifyStudent, quizController.getPublicQuizzes);
router.post('/quiz/create', verifyStudent, quizController.createQuiz);
router.post('/quiz/attempt', verifyStudent, quizController.submitAttempt);
router.get('/quiz/history', verifyStudent, quizController.getMyHistory);
router.get('/quiz/leaderboard', verifyStudent, quizController.getLeaderboard);

module.exports = router;
