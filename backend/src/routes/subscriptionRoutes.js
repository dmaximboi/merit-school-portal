const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyStudent, verifyAdmin } = require('../middleware/authMiddleware');

// Student Routes
router.post('/cbt/activate', verifyStudent, subscriptionController.activateCbtSubscription);
router.get('/quiz/limits', verifyStudent, subscriptionController.checkQuizLimits);
router.post('/quiz/unlock', verifyStudent, subscriptionController.unlockQuizLimit);
router.post('/quiz/increment', verifyStudent, subscriptionController.incrementQuizCount);

// Admin Routes
router.get('/settings', verifyAdmin, subscriptionController.getSubscriptionSettings);
router.post('/settings', verifyAdmin, subscriptionController.updateSubscriptionSettings);
router.post('/cbt/bypass', verifyAdmin, subscriptionController.adminBypassCbt);

module.exports = router;
