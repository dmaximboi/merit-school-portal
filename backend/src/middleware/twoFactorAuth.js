/**
 * Two-Factor Authentication (2FA) System
 * Provides OTP-based verification for high-security operations
 * NOW PERSISTENT (Database-backed)
 */

const crypto = require('crypto');
const supabase = require('../config/supabaseClient');

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a cryptographically secure OTP
 */
const generateOTP = () => {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    return String(num).slice(-OTP_LENGTH).padStart(OTP_LENGTH, '0');
};

/**
 * Create and store OTP for a user (DB Backed)
 */
const createOTP = async (userId, purpose = 'login') => {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY).toISOString();

    // 1. Invalidate old kinds for this user/purpose
    await supabase
        .from('otp_codes')
        .delete()
        .eq('user_id', userId)
        .eq('purpose', purpose);

    // 2. Insert new OTP
    const { error } = await supabase
        .from('otp_codes')
        .insert([{
            user_id: userId,
            code: otp,
            purpose,
            expires_at: expiresAt
        }]);

    if (error) {
        console.error('OTP Creation Error:', error);
        throw new Error('Failed to generate OTP');
    }

    // Log OTP creation
    await supabase.from('security_logs').insert([{
        event_type: 'otp_created',
        user_id: userId,
        details: { purpose },
        ip_address: 'system' // reliable IP capture needs req object, passing 'system' for internal calls
    }]).catch(err => console.error('Log Error:', err));

    return otp;
};

/**
 * Verify OTP (DB Backed)
 */
const verifyOTP = async (userId, inputOTP, purpose = 'login') => {
    // 1. Fetch OTP
    const { data: stored, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('purpose', purpose)
        .maybeSingle();

    if (error || !stored) {
        return { valid: false, error: 'No OTP found. Please request a new one.' };
    }

    // 2. Check expiry
    if (new Date() > new Date(stored.expires_at)) {
        await supabase.from('otp_codes').delete().eq('id', stored.id);
        return { valid: false, error: 'OTP expired. Please request a new one.' };
    }

    // 3. Check attempts
    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
        await supabase.from('otp_codes').delete().eq('id', stored.id);

        await supabase.from('security_logs').insert([{
            event_type: 'otp_max_attempts',
            user_id: userId,
            details: { purpose, attempts: stored.attempts }
        }]);

        return { valid: false, error: 'Too many attempts. Requests a new OTP.' };
    }

    // 4. Verify Code
    if (stored.code !== inputOTP) {
        // Increment attempts
        await supabase
            .from('otp_codes')
            .update({ attempts: stored.attempts + 1 })
            .eq('id', stored.id);

        return { valid: false, error: 'Invalid OTP. Please try again.' };
    }

    // 5. Success - Delete used OTP
    await supabase.from('otp_codes').delete().eq('id', stored.id);

    // Log Success
    await supabase.from('security_logs').insert([{
        event_type: 'otp_verified',
        user_id: userId,
        details: { purpose }
    }]);

    return { valid: true };
};

/**
 * Check if user has 2FA enabled
 */
const is2FAEnabled = async (userId) => {
    try {
        const { data } = await supabase
            .from('students')
            .select('two_fa_enabled')
            .eq('id', userId)
            .single();

        return data?.two_fa_enabled || false;
    } catch {
        return false;
    }
};

/**
 * Enable 2FA for a user
 */
const enable2FA = async (userId) => {
    try {
        const { error } = await supabase
            .from('students')
            .update({ two_fa_enabled: true })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * Disable 2FA for a user
 */
const disable2FA = async (userId) => {
    try {
        const { error } = await supabase
            .from('students')
            .update({ two_fa_enabled: false })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * 2FA Verification Middleware
 */
const require2FA = (purpose = 'action') => {
    return async (req, res, next) => {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if 2FA is enabled for this user
        const enabled = await is2FAEnabled(userId);

        if (!enabled) {
            return next();
        }

        const otp = req.headers['x-otp'] || req.body?.otp;

        if (!otp) {
            return res.status(403).json({
                error: '2FA verification required',
                code: '2FA_REQUIRED',
                message: 'Please enter your OTP code'
            });
        }

        const result = await verifyOTP(userId, otp, purpose);

        if (!result.valid) {
            return res.status(403).json({
                error: result.error,
                code: '2FA_INVALID'
            });
        }

        next();
    };
};

/**
 * Send OTP via email (placeholder)
 */
const sendOTPEmail = async (email, otp) => {
    console.log(`[2FA] OTP EMAIL to ${email}: ${otp}`);
    return { sent: true };
};

/**
 * Send OTP via SMS (placeholder)
 */
const sendOTPSMS = async (phone, otp) => {
    console.log(`[2FA] OTP SMS to ${phone}: ${otp}`);
    return { sent: true };
};

module.exports = {
    generateOTP,
    createOTP,
    verifyOTP,
    is2FAEnabled,
    enable2FA,
    disable2FA,
    require2FA,
    sendOTPEmail,
    sendOTPSMS
};
