const supabase = require('../config/supabaseClient');

exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    // Uses maybeSingle to avoid 406 error if multiple rows exist (safety check)
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!student) return res.status(404).json({ error: 'Profile not found.' });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    res.status(500).json({ error: error.message });
  }
};

// *** FIXED PAYMENT VERIFICATION ***
exports.verifyPayment = async (req, res) => {
  const { transaction_id, student_id } = req.body;

  if (!transaction_id || !student_id) {
    return res.status(400).json({ error: "Missing transaction details" });
  }
  
  try {
    // 1. Verify with Flutterwave API
    const flwUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    const response = await fetch(flwUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
    });
    
    const flwData = await response.json();

    if (flwData.status === 'success' && flwData.data.status === 'successful') {
        
        // 2. Check if student exists BEFORE attempting update
        const { data: student, error: fetchError } = await supabase
            .from('students')
            .select('id')
            .eq('id', student_id)
            .maybeSingle();

        if (!student) {
            console.error(`PAYMENT ERROR: Student ${student_id} not found in DB.`);
            return res.status(404).json({ error: "Student record not found. Contact Admin with Trans ID." });
        }

        // 3. Update Student Status to 'paid'
        const { error: updateError } = await supabase
            .from('students')
            .update({ payment_status: 'paid' })
            .eq('id', student_id);

        if (updateError) throw updateError;

        // 4. Log Payment Record
        await supabase.from('payments').insert([{
            student_id: student_id,
            amount: flwData.data.amount,
            reference: flwData.data.tx_ref,
            status: 'successful'
        }]);

        // 5. Log to Activity Logs for Admin Dashboard
        await supabase.from('activity_logs').insert([{
            student_id: student_id,
            student_name: 'System Payment',
            student_id_text: 'PAYMENT',
            action: 'payment_completed',
            ip_address: '0.0.0.0',
            device_info: 'Flutterwave Webhook'
        }]);

        console.log(`Payment Verified for Student ${student_id}`);
        res.json({ message: 'Payment Verified Successfully' });
    } else {
        res.status(400).json({ error: 'Flutterwave verification failed' });
    }
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSchoolFees = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;

    const fees = {};
    data.forEach(item => fees[item.key] = Number(item.value));
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
