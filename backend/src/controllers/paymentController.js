/**
 * Flutterwave Payment Controller
 * Handles payment initialization and verification for CBT/Quiz subscriptions
 */

const crypto = require('crypto');

// Flutterwave configuration
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const supabase = require('../config/supabaseClient');

/**
 * Initialize payment for CBT or Quiz subscription
 */
exports.initializePayment = async (req, res) => {
    const { type, amount } = req.body; // type: 'cbt' or 'quiz'
    const user = req.user;

    try {
        // Generate unique transaction reference
        const txRef = `MSP_${type.toUpperCase()}_${user.id}_${Date.now()}`;

        // Get student info for payment
        const { data: student } = await supabase
            .from('students')
            .select('email, first_name, surname, phone_number')
            .eq('id', user.id)
            .single();

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Create payment record in database
        await supabase.from('payments').insert([{
            student_id: user.id,
            tx_ref: txRef,
            amount: amount,
            type: type, // 'cbt' or 'quiz'
            status: 'pending',
            created_at: new Date().toISOString()
        }]);

        // Flutterwave payment data
        const paymentData = {
            public_key: FLW_PUBLIC_KEY,
            tx_ref: txRef,
            amount: amount,
            currency: 'NGN',
            payment_options: 'card,banktransfer,ussd',
            customer: {
                email: student.email,
                phone_number: student.phone_number || '',
                name: `${student.first_name} ${student.surname}`
            },
            customizations: {
                title: 'Merit School Portal',
                description: type === 'cbt' ? 'CBT Subscription (3 months)' : 'Quiz Limit Unlock',
                logo: 'https://your-logo-url.com/logo.png'
            },
            redirect_url: `${FRONTEND_URL}/payment/callback?type=${type}`
        };

        res.json({
            success: true,
            paymentData,
            txRef
        });
    } catch (err) {
        console.error('Payment init error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Verify payment after callback
 */
exports.verifyPayment = async (req, res) => {
    const { transaction_id, tx_ref } = req.body;

    try {
        // Verify with Flutterwave API
        const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${FLW_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.status === 'success' && data.data.status === 'successful') {
            // Payment verified successfully
            const payment = data.data;

            // Update payment record
            await supabase
                .from('payments')
                .update({
                    status: 'completed',
                    flw_ref: payment.flw_ref,
                    verified_at: new Date().toISOString()
                })
                .eq('tx_ref', tx_ref);

            // Get payment type from our records
            const { data: paymentRecord } = await supabase
                .from('payments')
                .select('type, student_id')
                .eq('tx_ref', tx_ref)
                .single();

            if (paymentRecord) {
                // Activate subscription based on type
                if (paymentRecord.type === 'cbt') {
                    // 3 months CBT access
                    const expiresAt = new Date();
                    expiresAt.setMonth(expiresAt.getMonth() + 3);

                    await supabase
                        .from('students')
                        .update({
                            cbt_subscription_active: true,
                            cbt_subscription_expires: expiresAt.toISOString()
                        })
                        .eq('id', paymentRecord.student_id);
                } else if (paymentRecord.type === 'quiz') {
                    // Reset quiz limits
                    await supabase
                        .from('students')
                        .update({
                            quiz_questions_today: 0,
                            quiz_questions_week: 0,
                            quiz_limit_reset: new Date().toISOString()
                        })
                        .eq('id', paymentRecord.student_id);
                }
            }

            res.json({
                success: true,
                message: 'Payment verified and subscription activated!',
                data: {
                    amount: payment.amount,
                    currency: payment.currency,
                    type: paymentRecord?.type
                }
            });
        } else {
            // Payment not successful
            await supabase
                .from('payments')
                .update({ status: 'failed' })
                .eq('tx_ref', tx_ref);

            res.status(400).json({
                success: false,
                error: 'Payment verification failed',
                details: data.message
            });
        }
    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Flutterwave Webhook handler
 * Receives payment notifications from Flutterwave
 */
exports.webhook = async (req, res) => {
    // Verify webhook signature
    const signature = req.headers['verif-hash'];
    const secretHash = process.env.FLW_WEBHOOK_SECRET || FLW_SECRET_KEY;

    if (!signature || signature !== secretHash) {
        console.warn('[PAYMENT WEBHOOK] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;

    try {
        if (payload.event === 'charge.completed') {
            const data = payload.data;
            const txRef = data.tx_ref;

            // Verify payment status
            if (data.status === 'successful') {
                // Update payment record
                await supabase
                    .from('payments')
                    .update({
                        status: 'completed',
                        flw_ref: data.flw_ref,
                        verified_at: new Date().toISOString()
                    })
                    .eq('tx_ref', txRef);

                // Get payment type and activate subscription
                const { data: paymentRecord } = await supabase
                    .from('payments')
                    .select('type, student_id')
                    .eq('tx_ref', txRef)
                    .single();

                if (paymentRecord) {
                    if (paymentRecord.type === 'cbt') {
                        const expiresAt = new Date();
                        expiresAt.setMonth(expiresAt.getMonth() + 3);

                        await supabase
                            .from('students')
                            .update({
                                cbt_subscription_active: true,
                                cbt_subscription_expires: expiresAt.toISOString()
                            })
                            .eq('id', paymentRecord.student_id);
                    } else if (paymentRecord.type === 'quiz') {
                        await supabase
                            .from('students')
                            .update({
                                quiz_questions_today: 0,
                                quiz_questions_week: 0,
                                quiz_limit_reset: new Date().toISOString()
                            })
                            .eq('id', paymentRecord.student_id);
                    }

                    console.log(`[PAYMENT] Subscription activated for student ${paymentRecord.student_id}`);
                }
            }
        }

        res.status(200).json({ status: 'received' });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get subscription prices from database
 */
exports.getPrices = async (req, res) => {
    try {
        const { data } = await supabase
            .from('app_settings')
            .select('*')
            .in('key', ['cbt_price', 'quiz_price']);

        const prices = {
            cbt: 2000,  // Default
            quiz: 500   // Default
        };

        if (data) {
            data.forEach(setting => {
                if (setting.key === 'cbt_price') prices.cbt = parseInt(setting.value);
                if (setting.key === 'quiz_price') prices.quiz = parseInt(setting.value);
            });
        }

        res.json(prices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get payment history for a student
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('student_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Check subscription status
 */
exports.checkSubscription = async (req, res) => {
    try {
        const { data: student } = await supabase
            .from('students')
            .select('cbt_subscription_active, cbt_subscription_expires, quiz_questions_today, quiz_questions_week')
            .eq('id', req.user.id)
            .single();

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if CBT subscription is expired
        let cbtActive = student.cbt_subscription_active;
        if (cbtActive && student.cbt_subscription_expires) {
            if (new Date(student.cbt_subscription_expires) < new Date()) {
                cbtActive = false;
                // Update database
                await supabase
                    .from('students')
                    .update({ cbt_subscription_active: false })
                    .eq('id', req.user.id);
            }
        }

        // Quiz limits
        const dailyLimit = 10;
        const weeklyLimit = 30;
        const quizLocked = (student.quiz_questions_week || 0) >= weeklyLimit;

        res.json({
            cbt: {
                active: cbtActive,
                expires: student.cbt_subscription_expires
            },
            quiz: {
                locked: quizLocked,
                questionsToday: student.quiz_questions_today || 0,
                questionsWeek: student.quiz_questions_week || 0,
                dailyLimit,
                weeklyLimit
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;
