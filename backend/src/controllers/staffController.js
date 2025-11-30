const supabase = require('../config/supabaseClient');

exports.registerStaff = async (req, res) => {
  const { 
    email, password, fullName, department, position, 
    adminToken, phone, address, qualification, gender 
  } = req.body;

  try {
    // 1. Validate Token from Database
    const { data: tokenData, error: tokenError } = await supabase
      .from('staff_tokens')
      .select('*')
      .eq('token', adminToken)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return res.status(403).json({ error: 'Invalid or expired staff token.' });
    }

    // 2. Check if token was used within last 6 hours
    if (tokenData.used_at) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const lastUsed = new Date(tokenData.used_at);
      
      if (lastUsed > sixHoursAgo) {
        return res.status(403).json({ 
          error: 'Token already used. Please wait 6 hours or use another token.' 
        });
      }
    }

    // 3. Update token usage timestamp
    await supabase
      .from('staff_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', adminToken);

    // 4. Create Login
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 5. Update Profile Role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'staff', full_name: fullName })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 6. Delete auto-created student row
    await supabase.from('students').delete().eq('id', userId);

    // 7. Create Staff Record
    const staffIdText = `STF/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    
    const { error: staffError } = await supabase
      .from('staff')
      .insert([{
        id: userId,
        staff_id_text: staffIdText,
        full_name: fullName,
        email,
        department,
        position,
        phone_number: phone,
        address,
        qualification,
        gender,
        is_suspended: false
      }]);

    if (staffError) {
      await supabase.auth.admin.deleteUser(userId);
      throw staffError;
    }

    res.status(201).json({ 
      message: 'Staff Registration Successful', 
      staffId: staffIdText 
    });

  } catch (error) {
    console.error('Staff Reg Error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.staffLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Credentials' });

    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (!staffData) return res.status(403).json({ error: 'No Staff Profile Found.' });

    res.json({ 
      user: { ...staffData, role: 'staff' }, 
      token: data.session.access_token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get students in staff's department
exports.getMyStudents = async (req, res) => {
  try {
    const staffDepartment = req.staff.department;

    if (!staffDepartment) {
      return res.status(400).json({ error: 'Staff department not set.' });
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('department', staffDepartment)
      .order('surname');

    if (error) throw error;

    res.json(students || []);
  } catch (err) {
    console.error('Get Students Error:', err);
    res.status(500).json({ error: err.message });
  }
};