const supabase = require('../config/supabaseClient');

// 1. DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const [students, staff, revenue] = await Promise.all([
      supabase.from('students').select('id, is_validated, program_type'),
      supabase.from('staff').select('id'),
      supabase.from('payments').select('amount').eq('status', 'successful')
    ]);

    const totalRevenue = revenue.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    res.json({
      totalStudents: students.data?.length || 0,
      totalStaff: staff.data?.length || 0,
      totalRevenue,
      pendingValidation: students.data?.filter(s => !s.is_validated).length || 0,
      breakdown: {
        jamb: students.data?.filter(s => s.program_type === 'JAMB').length || 0,
        alevel: students.data?.filter(s => s.program_type === 'A-Level').length || 0,
        olevel: students.data?.filter(s => s.program_type === 'O-Level').length || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. STUDENT MANAGEMENT
exports.getAllStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStudentStatus = async (req, res) => {
  const { studentId, action, value } = req.body;
  let updateData = {};

  if (action === 'validate') updateData = { is_validated: value };
  if (action === 'suspend') updateData = { is_suspended: value };
  if (action === 'parent_access') updateData = { is_parent_access_enabled: value };
  if (action === 'payment_status') updateData = { payment_status: value };

  try {
    // Get student info first for logging
    const { data: studentData } = await supabase
      .from('students')
      .select('surname, first_name, student_id_text')
      .eq('id', studentId)
      .single();

    const { error } = await supabase.from('students').update(updateData).eq('id', studentId);
    if (error) throw error;

    // Log payment bypass to transaction_logs table (for unified transaction history)
    if (action === 'payment_status' && value === 'paid') {
      await supabase.from('transaction_logs').insert([{
        student_id: studentId,
        amount: 0,
        status: 'bypassed',
        payment_type: 'manual_bypass',
        payment_method: 'admin',
        tx_ref: `BYPASS-${Date.now()}`,
        description: `Payment manually bypassed by Admin for ${studentData?.surname || ''} ${studentData?.first_name || ''}`,
        admin_note: 'Manually approved by administrator'
      }]);

      // Also log to activity_logs
      await supabase.from('activity_logs').insert([{
        student_id: studentId,
        student_name: `${studentData?.surname || ''} ${studentData?.first_name || ''}`,
        student_id_text: studentData?.student_id_text || 'N/A',
        action: 'payment_bypass_admin',
        ip_address: req.ip || '0.0.0.0',
        device_info: 'Manual Approval by Admin'
      }]);
    }

    res.json({ message: 'Student status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE STUDENT
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete from Auth (This usually cascades, but we force it)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    // 2. Delete from DB (Explicit cleanup)
    const { error: dbError } = await supabase.from('students').delete().eq('id', id);
    if (dbError) throw dbError;

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. SETTINGS & FEES
exports.updateSystemSettings = async (req, res) => {
  const { updates } = req.body;
  try {
    const { error } = await supabase.from('system_settings').upsert(updates);
    if (error) throw error;
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSettings = async (req, res) => {
  const { data } = await supabase.from('system_settings').select('*');
  res.json(data);
};

// 4. BROADCAST
exports.sendBroadcast = async (req, res) => {
  const { title, message, target } = req.body;
  try {
    const { error } = await supabase
      .from('announcements')
      .insert([{ title, message, target_audience: target }]);

    if (error) throw error;
    res.json({ message: 'Broadcast sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: DELETE BROADCAST
exports.deleteBroadcast = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Broadcast deleted successfully' });
  } catch (err) {
    console.error("Delete Broadcast Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: UPDATE BROADCAST
exports.updateBroadcast = async (req, res) => {
  const { id } = req.params;
  const { title, message, target } = req.body;
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ title, message, target_audience: target })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Broadcast updated successfully' });
  } catch (err) {
    console.error("Update Broadcast Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 5. STAFF CODES & MANAGEMENT
exports.generateStaffCode = async (req, res) => {
  const code = `MRT-STF-${Math.floor(1000 + Math.random() * 9000)}`;
  await supabase.from('verification_codes').insert([{ code, created_by: req.user.email }]);
  res.json({ code });
};

// NEW: GET ALL STAFF
exports.getAllStaff = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. TRANSACTION LOGS - Now includes all payment types (Flutterwave, Manual, Bypass)
exports.getTransactionLogs = async (req, res) => {
  try {
    // Get transaction_logs (Flutterwave payments and manual bypasses)
    const { data: txLogs, error: txError } = await supabase
      .from('transaction_logs')
      .select(`
        *,
        students (
          surname,
          first_name,
          student_id_text
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (txError) throw txError;

    // Also get payment bypass logs from activity_logs
    const { data: bypassLogs, error: bypassError } = await supabase
      .from('activity_logs')
      .select('*')
      .in('action', ['payment_bypass_admin', 'cbt_bypass_admin', 'payment_manual'])
      .order('created_at', { ascending: false })
      .limit(100);

    // Transform activity logs to match transaction format
    const transformedBypasses = (bypassLogs || []).map(log => ({
      id: log.id,
      student_id: log.student_id,
      amount: 0,
      status: 'bypassed',
      payment_type: log.action.includes('cbt') ? 'cbt_bypass' : 'payment_bypass',
      payment_method: 'admin',
      tx_ref: `LOG-${log.id}`,
      description: `${log.action.replace(/_/g, ' ')} - ${log.student_name}`,
      created_at: log.created_at,
      students: {
        surname: log.student_name?.split(' ')[0] || '',
        first_name: log.student_name?.split(' ')[1] || '',
        student_id_text: log.student_id_text
      }
    }));

    // Merge and sort by date
    const allTransactions = [...(txLogs || []), ...transformedBypasses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allTransactions);
  } catch (err) {
    console.error('Transaction logs error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  const { id, status, admin_note } = req.body;
  try {
    const { data, error } = await supabase
      .from('transaction_logs')
      .update({ status, admin_note })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If approved, verify the student's payment status in main table too
    if (status === 'approved' && data.student_id) {
      await supabase.from('students')
        .update({ payment_status: 'paid' })
        .eq('id', data.student_id);
    }

    res.json({ message: 'Transaction updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. CBT PARTICIPATION LOGS
exports.getCbtLogs = async (req, res) => {
  try {
    // Try to get from cbt_results table first
    const { data: cbtResults, error: cbtError } = await supabase
      .from('cbt_results')
      .select(`
        id,
        student_id,
        subject,
        score,
        total_questions,
        time_taken,
        created_at,
        students (
          surname,
          first_name,
          student_id_text
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!cbtError && cbtResults && cbtResults.length > 0) {
      const logs = cbtResults.map(r => ({
        id: r.id,
        student_id: r.student_id,
        student_name: `${r.students?.surname || ''} ${r.students?.first_name || ''}`,
        student_id_text: r.students?.student_id_text,
        type: 'cbt',
        subject: r.subject,
        score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
        time_taken: r.time_taken,
        created_at: r.created_at
      }));
      return res.json(logs);
    }

    // Fallback: get from quiz_attempts
    const { data: quizAttempts, error: quizError } = await supabase
      .from('quiz_attempts')
      .select(`
        id,
        user_id,
        quiz_id,
        score,
        total_questions,
        created_at,
        students (
          surname,
          first_name,
          student_id_text
        ),
        quizzes (
          title,
          subject
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!quizError && quizAttempts && quizAttempts.length > 0) {
      const logs = quizAttempts.map(a => ({
        id: a.id,
        student_id: a.user_id,
        student_name: `${a.students?.surname || ''} ${a.students?.first_name || ''}`,
        student_id_text: a.students?.student_id_text,
        type: 'quiz',
        subject: a.quizzes?.subject || a.quizzes?.title || 'Quiz',
        score: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
        created_at: a.created_at
      }));
      return res.json(logs);
    }

    // If neither table has data, return empty with message
    res.json([]);
  } catch (err) {
    console.error('CBT logs error:', err);
    res.status(500).json({ error: err.message });
  }
};
