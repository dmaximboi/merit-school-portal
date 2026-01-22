const supabase = require('../config/supabaseClient');

// Activate CBT Subscription
exports.activateCbtSubscription = async (req, res) => {
    const { student_id, payment_ref, duration_months = 3 } = req.body;

    try {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + duration_months);

        const { error } = await supabase
            .from('students')
            .update({
                cbt_subscription_active: true,
                cbt_subscription_expires: expiresAt.toISOString()
            })
            .eq('id', student_id);

        if (error) throw error;

        // Log transaction
        await supabase.from('subscription_transactions').insert([{
            student_id,
            type: 'cbt_subscription',
            payment_ref,
            amount: 2000, // Default, should come from settings
            status: 'approved'
        }]);

        res.json({ message: 'CBT Subscription Activated!', expires: expiresAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Check Quiz Limits
exports.checkQuizLimits = async (req, res) => {
    const student_id = req.user.id;

    try {
        const { data: student, error } = await supabase
            .from('students')
            .select('quiz_questions_today, quiz_questions_this_week, quiz_last_reset_date')
            .eq('id', student_id)
            .single();

        if (error) throw error;

        // Reset daily/weekly counters if needed
        const today = new Date().toISOString().split('T')[0];
        const lastReset = student.quiz_last_reset_date;

        let questionsToday = student.quiz_questions_today || 0;
        let questionsThisWeek = student.quiz_questions_this_week || 0;

        if (lastReset !== today) {
            questionsToday = 0;

            // Check if week has passed (simple: if 7+ days)
            const daysDiff = lastReset ? Math.floor((new Date() - new Date(lastReset)) / (1000 * 60 * 60 * 24)) : 7;
            if (daysDiff >= 7) {
                questionsThisWeek = 0;
            }

            // Update reset date
            await supabase
                .from('students')
                .update({
                    quiz_questions_today: 0,
                    quiz_questions_this_week: daysDiff >= 7 ? 0 : questionsThisWeek,
                    quiz_last_reset_date: today
                })
                .eq('id', student_id);
        }

        const dailyLimit = 10;
        const weeklyLimit = 30;

        res.json({
            questionsToday,
            questionsThisWeek,
            dailyLimit,
            weeklyLimit,
            canTakeQuiz: questionsToday < dailyLimit && questionsThisWeek < weeklyLimit
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Unlock Quiz Limit (₦500 payment)
exports.unlockQuizLimit = async (req, res) => {
    const { student_id, payment_ref } = req.body;

    try {
        // Reset weekly limit
        await supabase
            .from('students')
            .update({ quiz_questions_this_week: 0 })
            .eq('id', student_id);

        // Log transaction
        await supabase.from('subscription_transactions').insert([{
            student_id,
            type: 'quiz_unlock',
            payment_ref,
            amount: 500,
            status: 'approved'
        }]);

        res.json({ message: 'Quiz Limit Unlocked! You can now take more quizzes.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Increment Quiz Question Count
exports.incrementQuizCount = async (req, res) => {
    const student_id = req.user.id;
    const { question_count } = req.body;

    try {
        const { data: student } = await supabase
            .from('students')
            .select('quiz_questions_today, quiz_questions_this_week')
            .eq('id', student_id)
            .single();

        await supabase
            .from('students')
            .update({
                quiz_questions_today: (student.quiz_questions_today || 0) + question_count,
                quiz_questions_this_week: (student.quiz_questions_this_week || 0) + question_count
            })
            .eq('id', student_id);

        res.json({ message: 'Quiz count updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Subscription Settings (Admin)
exports.getSubscriptionSettings = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscription_fees')
            .select('*');

        if (error) throw error;

        const settings = {
            cbt_fee: data.find(f => f.fee_type === 'cbt_subscription')?.amount || 2000,
            quiz_unlock_fee: data.find(f => f.fee_type === 'quiz_unlock')?.amount || 500
        };

        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Subscription Settings (Admin)
exports.updateSubscriptionSettings = async (req, res) => {
    const { cbt_fee, quiz_unlock_fee } = req.body;

    try {
        // Upsert CBT fee
        await supabase
            .from('subscription_fees')
            .upsert({ fee_type: 'cbt_subscription', amount: cbt_fee }, { onConflict: 'fee_type' });

        // Upsert Quiz unlock fee
        await supabase
            .from('subscription_fees')
            .upsert({ fee_type: 'quiz_unlock', amount: quiz_unlock_fee }, { onConflict: 'fee_type' });

        res.json({ message: 'Subscription fees updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin Bypass CBT Subscription (1 month free)
exports.adminBypassCbt = async (req, res) => {
    const { student_id } = req.body;

    try {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month access

        const { error } = await supabase
            .from('students')
            .update({
                cbt_subscription_active: true,
                cbt_subscription_expires: expiresAt.toISOString()
            })
            .eq('id', student_id);

        if (error) throw error;

        // Log as admin bypass
        await supabase.from('subscription_transactions').insert([{
            student_id,
            type: 'cbt_bypass',
            payment_ref: 'ADMIN_BYPASS',
            amount: 0,
            status: 'approved'
        }]);

        res.json({ message: 'CBT Access Granted (1 Month)!', expires: expiresAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
