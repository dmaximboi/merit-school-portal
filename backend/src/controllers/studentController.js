const supabase = require('../config/supabaseClient');

// 1. GET STUDENT PROFILE (SECURED)
exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // --- SECURITY: BOLA CHECK ---
    // Ensure the requester is either the owner OR an admin
    // req.user is populated by the authMiddleware
    if (req.user.id !== id && req.user.role !== 'admin') {
        console.warn(`UNAUTHORIZED ACCESS ATTEMPT: User ${req.user.id} tried to view ${id}`);
        return res.status(403).json({ error: 'Access Denied: You can only view your own profile.' });
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!student) return res.status(404).json({ error: 'Profile not found.' });

    res.json(student);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. GET ANNOUNCEMENTS
exports.getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .or('target_audience.eq.all,target_audience.eq.student')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3. *** SECURE PAYMENT VERIFICATION ***
exports.verifyPayment = async (req, res) => {
  const { transaction_id, student_id } = req.body;

  // --- SECURITY: BOLA CHECK FOR PAYMENTS ---
  // A student should not be able to verify a payment for someone else
  if (req.user.id !== student_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access Denied: Cannot process payment for another student." });
  }

  if (!transaction_id || !student_id) {
    return res.status(400).json({ error: "Missing transaction details" });
  }
  
  try {
    // A. Check Replay Attack
    const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('reference', transaction_id.toString())
        .eq('status', 'successful')
        .maybeSingle();

    if (existingPayment) {
        return res.status(409).json({ error: "This transaction has already been used." });
    }

    // B. Verify with Flutterwave
    const flwUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    const response = await fetch(flwUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
    });
    
    const flwData = await response.json();

    if (flwData.status !== 'success' || flwData.data.status !== 'successful') {
        return res.status(400).json({ error: 'Payment failed or declined by bank.' });
    }

    const { amount, currency, tx_ref } = flwData.data;

    // C. Fetch Student & System Settings
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', student_id)
        .maybeSingle();
        
    if (!student) return res.status(404).json({ error: "Student record not found." });

    const { data: settings, error: settingsError } = await supabase.from('system_settings').select('*');
    if (settingsError) throw settingsError;

    let expectedFee = 0;
    if (student.program_type === 'JAMB') expectedFee = Number(settings.find(s => s.key === 'fee_jamb')?.value || 0);
    else if (student.program_type === 'A-Level') expectedFee = Number(settings.find(s => s.key === 'fee_alevel')?.value || 0);
    else expectedFee = Number(settings.find(s => s.key === 'fee_olevel')?.value || 0);

    // D. Security Checks
    if (currency !== 'NGN') return res.status(400).json({ error: "Invalid currency." });
    if (amount < expectedFee) return res.status(400).json({ error: `Insufficient Payment. Fee is ₦${expectedFee}.` });
    if (!tx_ref.includes(student_id)) return res.status(400).json({ error: "Invalid Receipt Ownership." });

    // E. Update
    await supabase.from('students').update({ payment_status: 'paid' }).eq('id', student_id);

    await supabase.from('payments').insert([{
        student_id: student_id,
        amount: amount,
        reference: transaction_id.toString(),
        status: 'successful',
        channel: 'flutterwave'
    }]);

    res.json({ message: 'Payment Verified Successfully' });

  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. SUBMIT MANUAL PAYMENT
exports.submitManualPayment = async (req, res) => {
    const { student_id, reference, amount } = req.body;
    
    // --- SECURITY: BOLA CHECK ---
    if (req.user.id !== student_id) {
        return res.status(403).json({ error: "You cannot submit payments for others." });
    }

    try {
        if (!student_id || !reference) return res.status(400).json({ error: "Missing details" });

        const { error } = await supabase.from('payments').insert([{
            student_id,
            amount: amount || 0,
            reference: reference,
            status: 'pending_manual',
            channel: 'manual_transfer'
        }]);

        if (error) throw error;

        await supabase.from('activity_logs').insert([{
            student_id,
            student_name: 'Student User',
            student_id_text: 'MANUAL PAY',
            action: 'payment_manual_submitted',
            ip_address: req.ip || '0.0.0.0',
            device_info: `Ref: ${reference}`
        }]);

        res.json({ message: "Manual payment submitted for review." });
    } catch (err) {
        console.error("Manual Payment Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 5. GET FEES
exports.getSchoolFees = async (req, res) => {
  try {
    const { data } = await supabase.from('system_settings').select('*');
    const fees = {};
    data?.forEach(item => fees[item.key] = Number(item.value));
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
