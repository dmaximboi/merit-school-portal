/**
 * Payment Routes
 * Flutterwave payment integration for CBT/Quiz subscriptions
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyStudent, verifyAny } = require('../middleware/authMiddleware');

// Public route - Get subscription prices
router.get('/prices', paymentController.getPrices);

// Protected routes - Require authentication
router.post('/initialize', verifyStudent, paymentController.initializePayment);
router.post('/verify', verifyStudent, paymentController.verifyPayment);
router.get('/history', verifyStudent, paymentController.getPaymentHistory);
router.get('/subscription-status', verifyStudent, paymentController.checkSubscription);

// Webhook - No auth (Flutterwave server calls this)
router.post('/webhook', paymentController.webhook);

module.exports = router;
