const supabase = require('../config/supabaseClient');

// ==================== HELPER FUNCTIONS ====================

const hasPermission = (requestingUserId, targetStudentId, userRole) => {
  return requestingUserId === targetStudentId || userRole === 'admin';
};

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress || '0.0.0.0';
};

const logActivity = async (studentId, action, details = {}) => {
  try {
    await supabase.from('activity_logs').insert([{
      student_id: studentId,
      student_name: details.name || 'Student',
      student_id_text: details.student_id_text || 'UNKNOWN',
      action: action,
      ip_address: getClientIP(details.req),
      device_info: details.device_info || 'Web Client'
    }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const getSystemSettings = async () => {
  const { data } = await supabase.from('system_settings').select('*');
  const settings = {};
  data?.forEach(item => { settings[item.key] = item.value; });
  return settings;
};

// ==================== STUDENT PROFILE ====================

exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!hasPermission(req.user.id, id, req.user.role)) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    // 1. Fetch Basic Info
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !student) throw new Error('Student not found');

    // 2. Fetch Multi-Programs (NEW FEATURE)
    const { data: programs } = await supabase
      .from('student_programs')
      .select('*')
      .eq('student_id', id);

    // 3. Fetch Active CBT Subscription (NEW FEATURE)
    const { data: cbtSub } = await supabase
      .from('cbt_subscriptions') // Uses the view or table
      .select('*')
      .eq('student_id', id)
      .gt('expiry_date', new Date().toISOString()) // Check if not expired
      .maybeSingle();

    res.json({
      success: true,
      student: {
        ...student,
        programs: programs || [], // Returns array of programs (JAMB, O-Level)
        cbt_subscription: cbtSub ? { active: true, expiry: cbtSub.expiry_date } : { active: false }
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!hasPermission(req.user.id, id, req.user.role)) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    // Only allow updating contact info, not academic/payment data
    const allowed = ['phone_number', 'address', 'parents_phone', 'state_of_origin', 'lga'];
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowed.includes(key)) filteredUpdates[key] = updates[key];
    });

    const { data, error } = await supabase
      .from('students')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, student: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== ANNOUNCEMENTS ====================

exports.getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, announcements: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== PAYMENTS (Updated for Multi-Program) ====================

exports.getSchoolFees = async (req, res) => {
  try {
    const { data } = await supabase.from('system_settings').select('*');
    const settings = {};
    data?.forEach(item => { settings[item.key] = Number(item.value); });

    // Return only fees
    res.json({
      fee_jamb: settings.fee_jamb || 0,
      fee_alevel: settings.fee_alevel || 0,
      fee_olevel: settings.fee_olevel || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1. Verify Online Payment (Flutterwave)
exports.verifyPayment = async (req, res) => {
  const { transaction_id, student_id, purpose, program_type } = req.body;
  // 'purpose' can be 'program_fee' or 'cbt_access'

  try {
    // A. Verify with Flutterwave (Mock logic for now, add real FLW call here)
    // const flwResponse = await verifyFlutterwave(transaction_id); 
    // if (flwResponse.status !== 'successful') throw new Error("Payment Failed");
    const amountPaid = 0; // Replace with flwResponse.amount

    // B. Handle different payment types
    if (purpose === 'program_fee') {
      // Update specific program status
      await supabase
        .from('student_programs')
        .update({ payment_status: 'paid' })
        .eq('student_id', student_id)
        .eq('program_type', program_type);

    } else if (purpose === 'cbt_access') {
      // Create Subscription
      await supabase.from('cbt_subscriptions').insert([{
        student_id,
        amount_paid: amountPaid,
        plan_type: 'monthly'
      }]);
    }

    // C. Log to Main Payments Table
    await supabase.from('payments').insert([{
      student_id,
      amount: amountPaid, // use real amount
      reference: transaction_id,
      status: 'successful',
      channel: 'flutterwave'
    }]);

    res.json({ success: true, message: "Payment Verified" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Submit Manual Payment (Using the NEW transaction_logs table)
exports.submitManualPayment = async (req, res) => {
  const { student_id, reference, amount, payment_purpose, proof_url } = req.body;

  try {
    if (!hasPermission(req.user.id, student_id, req.user.role)) {
      return res.status(403).json({ error: "Access Denied" });
    }

    const { data, error } = await supabase
      .from('transaction_logs') // <--- USING CORRECT TABLE
      .insert([{
        student_id,
        reference_number: reference,
        amount,
        payment_purpose, // 'School Fee - JAMB', 'CBT Access'
        proof_url,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Manual payment submitted. Waiting for Admin approval.",
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== PASSWORD RESET (New Request) ====================

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  // Only allow this if it's the logged-in user OR if they have a specialized token (Forgot Password flow)
  // For simple Dashboard reset:
  if (req.user.email !== email && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (error) throw error;
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  const { student_id } = req.params;
  try {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });
    res.json({ success: true, payments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
