const supabase = require('../config/supabaseClient');

// ... (Keep uploadPhoto helper) ...
async function uploadPhoto(base64Data, userId) {
  if (!base64Data) return null;
  try {
    const base64File = base64Data.split(';base64,').pop();
    const buffer = Buffer.from(base64File, 'base64');
    const path = `students/${userId}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Photo Upload Error:", err.message);
    return null;
  }
}

// --- HELPER: PASSWORD VALIDATION ---
const validatePassword = (password) => {
    // Min 6 chars, at least one number (Basic requirement)
    // You can make this stricter (e.g. symbols) if desired
    const regex = /^(?=.*\d).{6,}$/;
    return regex.test(password);
};

// ... (Keep adminLogin and studentLogin) ...
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Email or Password' });

    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (!adminEntry) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Access Denied: You are not an Administrator.' });
    }

    res.json({
      message: 'Admin Login Successful',
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email, role: 'admin' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.studentLogin = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data } = await supabase
        .from('students')
        .select('email')
        .ilike('student_id_text', identifier.trim())
        .maybeSingle();
      if (!data) return res.status(404).json({ error: 'Student ID not found' });
      email = data.email;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid Password' });

    const { data: profile, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (dbError) throw dbError;
    if (!profile) return res.status(500).json({ error: 'Profile row missing.' });

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- REGISTER STUDENT (SECURE) ---
exports.registerStudent = async (req, res) => {
  const clean = (val) => (val && val.trim() !== "" ? val : null);

  const { 
    email, password, surname, middleName, lastName, 
    programme, department, subjects, photoPreview,
    dateOfBirth, gender, stateOfOrigin, lga, permanentAddress,
    parentsPhone, studentPhone, university, course
  } = req.body;

  try {
    // 1. SECURITY: Enforce Password Policy
    if (!validatePassword(password)) {
        return res.status(400).json({ error: "Password is too weak. Must be at least 6 characters and include a number." });
    }

    // 2. SECURITY: Check Duplicate Phone/Email (Frontend does this, but backend is safer)
    // (Supabase Auth handles Email duplication automatically)

    // 3. Create Auth User
    const fullName = `${surname} ${middleName} ${lastName}`.trim();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName } 
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 4. Generate ID
    const year = new Date().getFullYear().toString().slice(-2);
    const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
    const deptMap = { 'Science': 'SCI', 'Art': 'ART', 'Commercial': 'BUS' };
    const deptCode = deptMap[department] || 'GEN';
    const studentIdText = `MCAS/${deptCode}/${year}/${randAlpha}`; 

    // 5. Upload Photo
    const photoUrl = await uploadPhoto(photoPreview, userId);

    // 6. DB Inserts
    await supabase.from('profiles').upsert({
        id: userId,
        email,
        role: 'student',
        full_name: fullName
    });

    const { error: updateError } = await supabase
      .from('students')
      .upsert({
        id: userId,
        email,
        student_id_text: studentIdText,
        department: clean(department),
        surname: clean(surname),
        first_name: clean(middleName),
        last_name: clean(lastName),
        gender: clean(gender),
        dob: clean(dateOfBirth),
        state_of_origin: clean(stateOfOrigin),
        lga: clean(lga),
        address: clean(permanentAddress),
        parents_phone: clean(parentsPhone),
        phone_number: clean(studentPhone),
        program_type: programme,
        subjects: subjects,
        university_choice: clean(university),
        course_choice: clean(course),
        photo_url: photoUrl,
        is_validated: false,
        payment_status: 'unpaid'
      });

    if (updateError) throw updateError;

    // 7. Log
    await supabase.from('activity_logs').insert([{
        student_id: userId,
        student_name: fullName,
        student_id_text: studentIdText,
        action: 'registered',
        ip_address: req.ip || 'unknown',
        device_info: req.headers['user-agent'] || 'unknown'
    }]);

    res.status(201).json({ message: 'Success', studentId: studentIdText });

  } catch (error) {
    console.error("Registration Error:", error);
    // Cleanup if auth created but db failed
    if (error.message.includes("Database") && userId) {
        // await supabase.auth.admin.deleteUser(userId); // Optional cleanup
    }
    res.status(400).json({ error: error.message });
  }
};
