const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyAny } = require('../middleware/authMiddleware');

// Use generic verification to support Admin, Staff, Student, Parent
router.use(verifyAny);

// Chat messages
router.get('/', chatController.getMessages);
router.post('/', chatController.sendMessage);

// Create quiz from chat
router.post('/create-quiz', chatController.createQuizFromChat);

module.exports = router;

