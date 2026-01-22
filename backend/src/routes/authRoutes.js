const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const twoFactorAuth = require('../middleware/twoFactorAuth');
const { verifyStudent } = require('../middleware/authMiddleware');

// --- PUBLIC VALIDATION ---
// Used by Student Register to check duplicate emails
router.post('/check-email', authController.checkEmailExists);

// --- LOGIN ROUTES (Restored to match Frontend) ---
// Frontend calls: /auth/admin/login
router.post('/admin/login', authController.adminLogin);

// Frontend calls: /auth/student/login
router.post('/student/login', authController.studentLogin);

// Frontend calls: /auth/staff/login
router.post('/staff/login', authController.staffLogin);

// Frontend calls: /auth/parent/login
router.post('/parent/login', authController.parentLogin);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// --- REGISTER ROUTES ---
// Note: Student Register mainly uses /students/register (via studentRoutes), 
// but we keep this here for direct auth access if needed.
router.post('/student/register', authController.registerStudent);

// --- 2FA ROUTES ---
// Request OTP for 2FA verification
router.post('/2fa/request-otp', verifyStudent, async (req, res) => {
    try {
        const userId = req.user.id;
        const purpose = req.body.purpose || 'verification';

        const otp = await twoFactorAuth.createOTP(userId, purpose);

        // In production, send via email/SMS
        // For now, we return a success message
        // await twoFactorAuth.sendOTPEmail(req.user.email, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            // Remove this in production - only for testing
            ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp })
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP
router.post('/2fa/verify-otp', verifyStudent, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otp, purpose } = req.body;

        if (!otp) {
            return res.status(400).json({ error: 'OTP is required' });
        }

        const result = await twoFactorAuth.verifyOTP(userId, otp, purpose || 'verification');

        if (result.valid) {
            res.json({ success: true, message: 'OTP verified successfully' });
        } else {
            res.status(403).json({ error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enable 2FA for user
router.post('/2fa/enable', verifyStudent, async (req, res) => {
    try {
        const result = await twoFactorAuth.enable2FA(req.user.id);
        if (result.success) {
            res.json({ success: true, message: '2FA enabled successfully' });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Disable 2FA for user
router.post('/2fa/disable', verifyStudent, twoFactorAuth.require2FA('disable_2fa'), async (req, res) => {
    try {
        const result = await twoFactorAuth.disable2FA(req.user.id);
        if (result.success) {
            res.json({ success: true, message: '2FA disabled successfully' });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check 2FA status
router.get('/2fa/status', verifyStudent, async (req, res) => {
    try {
        const enabled = await twoFactorAuth.is2FAEnabled(req.user.id);
        res.json({ enabled });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

