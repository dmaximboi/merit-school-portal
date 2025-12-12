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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// 2. STUDENT MANAGEMENT
exports.getAllStudents = async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateStudentStatus = async (req, res) => {
  const { studentId, action, value } = req.body; 
  let updateData = {};
  if (action === 'validate') updateData = { is_validated: value };
  if (action === 'suspend') updateData = { is_suspended: value };
  if (action === 'parent_access') updateData = { is_parent_access_enabled: value };

  try {
    const { error } = await supabase.from('students').update(updateData).eq('id', studentId);
    if (error) throw error;
    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- FIXED: DELETE STUDENT ---
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete from Auth (Cascades to DB usually, but safer to do explicit)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    // Even if auth fails (e.g. user already gone), try deleting DB record
    
    // 2. Manual DB Cleanup 
    const { error: dbError } = await supabase.from('students').delete().eq('id', id);
    if (dbError) throw dbError;
    
    res.json({ message: 'Student permanently deleted' });
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
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSettings = async (req, res) => {
  const { data } = await supabase.from('system_settings').select('*');
  res.json(data);
};

// 4. BROADCAST
exports.sendBroadcast = async (req, res) => {
  const { title, message, target } = req.body;
  try {
    const { error } = await supabase.from('announcements').insert([{ title, message, target_audience: target }]);
    if (error) throw error;
    res.json({ message: 'Broadcast sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. STAFF CODES
exports.generateStaffCode = async (req, res) => {
  const code = `MRT-STF-${Math.floor(1000 + Math.random() * 9000)}`;
  await supabase.from('verification_codes').insert([{ code, created_by: req.user.email }]);
  res.json({ code });
};
