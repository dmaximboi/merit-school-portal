const supabase = require('../config/supabaseClient');

// 1. GET STUDENT PROFILE
exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch Student Data
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    res.json(student);
  } catch (error) {
    console.error("Profile Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. GET ANNOUNCEMENTS
exports.getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .in('target_audience', ['all', 'student'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Announcements Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 3. VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  const { transaction_id, student_id } = req.body;

  if (!transaction_id || !student_id) {
    return res.status(400).json({ error: "Missing transaction_id or student_id" });
  }
  
  try {
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
        const { error: updateError } = await supabase
            .from('students')
            .update({ payment_status: 'paid' })
            .eq('id', student_id);

        if (updateError) throw new Error("Status update failed: " + updateError.message);

        await supabase.from('payments').insert([{
            student_id: student_id,
            amount: flwData.data.amount,
            reference: flwData.data.tx_ref,
            status: 'successful'
        }]);

        res.json({ message: 'Payment Verified' });
    } else {
        res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (err) {
    console.error("Payment Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};