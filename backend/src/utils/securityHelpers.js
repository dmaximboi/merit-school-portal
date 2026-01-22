const supabase = require('../config/supabaseClient');

/**
 * Security Helper: Check Account Suspension
 * Verifies if account is suspended and throws error if so
 */
const checkAccountSuspension = async (email) => {
    const { data } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

    if (data?.suspended_until && new Date(data.suspended_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(data.suspended_until) - new Date()) / 60000);
        const hoursLeft = Math.floor(minutesLeft / 60);
        const minsLeft = minutesLeft % 60;

        const timeMsg = hoursLeft > 0
            ? `${hoursLeft}h ${minsLeft}m`
            : `${minsLeft} minutes`;

        throw new Error(`Account suspended due to multiple failed login attempts. Try again in ${timeMsg}.`);
    }

    return data;
};

/**
 * Security Helper: Record Failed Login
 * Increments attempt counter and suspends account after 5 failures
 */
const recordFailedLogin = async (email) => {
    const attempt = await checkAccountSuspension(email);
    const attempts = (attempt?.attempts || 0) + 1;

    const suspensionData = {
        email: email.toLowerCase(),
        attempts,
        last_attempt: new Date().toISOString(),
        suspended_until: attempts >= 5
            ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
            : null,
        updated_at: new Date().toISOString()
    };

    await supabase
        .from('login_attempts')
        .upsert(suspensionData, { onConflict: 'email' });

    if (attempts >= 5) {
        throw new Error('Account suspended for 2 hours due to multiple failed login attempts.');
    }

    return attempts;
};

/**
 * Security Helper: Clear Login Attempts
 * Resets attempt counter on successful login
 */
const clearLoginAttempts = async (email) => {
    await supabase
        .from('login_attempts')
        .delete()
        .eq('email', email.toLowerCase());
};

/**
 * Security Helper: Log Security Event
 * Records security-related events for audit trail
 */
const logSecurityEvent = async (event) => {
    try {
        await supabase.from('security_logs').insert({
            event_type: event.type,
            user_id: event.userId || null,
            ip_address: event.ip || null,
            user_agent: event.userAgent || null,
            details: event.details || {},
            severity: event.severity || 'LOW'
        });
    } catch (err) {
        console.error('Failed to log security event:', err);
    }
};

module.exports = {
    checkAccountSuspension,
    recordFailedLogin,
    clearLoginAttempts,
    logSecurityEvent
};
