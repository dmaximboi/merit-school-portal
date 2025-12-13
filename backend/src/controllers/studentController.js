{
type: "file_content_replacement",
fileName: "uhhghhujbh/merit-school-portal/merit-school-portal-a4a74196d9139b068ba5538c081690a51cba6ee2/backend/src/controllers/studentController.js",
fullContent: `const supabase = require('../config/supabaseClient');

// 1. GET STUDENT PROFILE
exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
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

  if (!transaction_id || !student_id) {
    return res.status(400).json({ error: "Missing transaction details" });
  }
  
  try {
    // A. Verify with Flutterwave
    const flwUrl = \`https://api.flutterwave.com/v3/transactions/\${transaction_id}/verify\`;
    const response = await fetch(flwUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${process.env.FLUTTERWAVE_SECRET_KEY}\`
        }
    });
    
    const flwData = await response.json();

    if (flwData.status !== 'success' || flwData.data.status !== 'successful') {
        return res.status(400).json({ error: 'Payment failed or declined by bank.' });
    }

    const { amount, currency, tx_ref } = flwData.data;

    // B. Fetch Student & System Settings (To verify Amount)
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', student_id)
        .maybeSingle();
        
    if (!student) return res.status(404).json({ error: "Student record not found." });

    const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');
        
    if (settingsError) throw settingsError;

    // C. Determine Expected Fee
    let expectedFee = 0;
    if (student.program_type === 'JAMB') expectedFee = Number(settings.find(s => s.key === 'fee_jamb')?.value || 0);
    else if (student.program_type === 'A-Level') expectedFee = Number(settings.find(s => s.key === 'fee_alevel')?.value || 0);
    else expectedFee = Number(settings.find(s => s.key === 'fee_olevel')?.value || 0);

    // D. *** SECURITY CHECKS ***
    
    // 1. Check Currency
    if (currency !== 'NGN') {
        return res.status(400).json({ error: "Invalid currency. Payment must be in NGN." });
    }

    // 2. Check Amount (Allowing small difference for fees if necessary, or strict equality)
    // Using >= to ensure they paid AT LEAST the fee.
    if (amount < expectedFee) {
        console.warn(\`FRAUD ATTEMPT: Student \${student_id} paid \${amount} but expected \${expectedFee}\`);
        return res.status(400).json({ error: \`Insufficient Payment. You paid ₦\${amount} but the fee is ₦\${expectedFee}.\` });
    }

    // 3. Check Ownership (Prevent using another student's receipt or external receipt)
    // The frontend generates tx_ref as \`MCAS-\${Date.now()}-\${user.id}\`
    // So we check if the tx_ref contains the student_id
    if (!tx_ref.includes(student_id)) {
        console.warn(\`FRAUD ATTEMPT: Student \${student_id} used receipt \${tx_ref} belonging to someone else.\`);
        return res.status(400).json({ error: "Invalid Receipt. This payment does not belong to your account." });
    }

    // E. Update Database
    const { error: updateError } = await supabase
        .from('students')
        .update({ payment_status: 'paid' })
        .eq('id', student_id);

    if (updateError) throw updateError;

    // Log the successful payment
    await supabase.from('payments').insert([{
        student_id: student_id,
        amount: amount,
        reference: tx_ref,
        status: 'successful'
    }]);

    await supabase.from('activity_logs').insert([{
        student_id: student_id,
        student_name: 'System Payment',
        student_id_text: 'PAYMENT',
        action: 'payment_verified_secure',
        ip_address: '0.0.0.0',
        device_info: \`Amount: \${amount}\`
    }]);

    res.json({ message: 'Payment Verified Successfully' });

  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. GET SCHOOL FEES
exports.getSchoolFees = async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) throw error;

    // Convert array to object { fee_jamb: 15000, ... }
    const fees = {};
    data.forEach(item => fees[item.key] = Number(item.value));
    res.json(fees);
  } catch (err) {
    console.error("Get Fees Error:", err);
    res.status(500).json({ error: err.message });
  }
};
`
}
