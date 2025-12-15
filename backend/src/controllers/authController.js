const supabase = require('../config/supabaseClient');

// --- HELPER: Upload Photo to Supabase Storage ---
async function uploadPhoto(base64Data, userId) {
  if (!base64Data) return null;
  try {
    // Remove header (data:image/jpeg;base64,)
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
    return null; // Fail silently on image to allow registration to proceed
  }
}

// --- HELPER: Password Validation ---
const validatePassword = (password) => {
    // Min 6 chars, at least one number
    const regex = /^(?=.*\d).{6,}$/;
    return regex.test(password);
};

// --- 1. CHECK EMAIL EXISTENCE (New for Frontend Validation) ---
exports.checkEmailExists = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check 'profiles' table which maps 1:1 with Auth Users
    const { data, error } = await supabase
      .from('profiles') 
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (data) {
        return res.json({ exists: true, message: "Email already registered" });
    }
    
    return res.json({ exists: false });
  } catch (err) {
    console.error("Email Check Error:", err); 
    // Return false on error to prevent blocking user if DB hiccups, 
    // but log it. Real duplication check happens at 'createUser' anyway.
    res.status(500).json({ error: "Unable to verify email" });
  }
};

// --- 2. REGISTER STUDENT ---
exports.registerStudent = async (req, res) => {
  const clean = (val) => (val && val.trim() !== "" ? val : null);

  const { 
    email, password, surname, middleName, lastName, 
    programme, department, subjects, photoPreview,
    dateOfBirth, gender, stateOfOrigin, lga, permanentAddress,
    parentsPhone, studentPhone, university, course
  } = req.body;

  let userId = null;

  try {
    // A. Security Check: Password Policy
    if (!validatePassword(password)) {
        return res.status(400).json({ error: "Password is too weak. Must be at least 6 characters and include a number." });
    }

    // B. Create Auth User (Supabase Auth)
    const fullName = `${surname} ${middleName} ${lastName}`.trim();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName } 
    });

    if (authError) throw authError;
    userId = authData.user.id;

    // C. Generate Student ID (Format: MCAS/DEPT/YEAR/4RAND)
    const year = new Date().getFullYear().toString().slice(-2); // e.g., '25'
    const randAlpha = Math.floor(1000 + Math.random() * 9000); // e.g., 4821
    const deptMap = { 'Science': 'SCI', 'Art': 'ART', 'Commercial': 'BUS' };
    const deptCode = deptMap[department] || 'GEN';
    
    const studentIdText = `MCAS/${deptCode}/${year}/${randAlpha}`; 

    // D. Upload Photo
    const photoUrl = await uploadPhoto(photoPreview, userId);

    // E. Database Insert: Profile (Role Mapping)
    await supabase.from('profiles').upsert({
        id: userId,
        email,
        role: 'student',
        full_name: fullName
    });

    // F. Database Insert: Student Record
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
        is_validated: false, // Default to locked
        payment_status: 'unpaid' // Default to unpaid
      });

    if (updateError) throw updateError;

    // G. Log Activity
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
    // Cleanup: If auth user created but DB failed, try to delete auth user
    if (userId && error.message.includes("Database")) {
        await supabase.auth.admin.deleteUser(userId); 
    }
    res.status(400).json({ error: error.message });
  }
};

// --- 3. ADMIN LOGIN ---
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Email or Password' });

    // Security: Check Admin Allowlist
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

// --- 4. STUDENT LOGIN ---
exports.studentLogin = async (req, res) => {
  const { identifier, password } = req.body; // Identifier can be Email or Student ID
  try {
    let email = identifier;
    
    // Resolve Student ID to Email if necessary
    if (!identifier.includes('@')) {
      const { data } = await supabase
        .from('students')
        .select('email')
        .ilike('student_id_text', identifier.trim())
        .maybeSingle();
        
      if (!data) return res.status(404).json({ error: 'Student ID not found' });
      email = data.email;
    }

    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid Password' });

    // Fetch Profile
    const { data: profile, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (dbError) throw dbError;
    if (!profile) return res.status(500).json({ error: 'Student profile missing in database.' });

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: { ...profile, role: 'student' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. STAFF LOGIN ---
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
    
    if (!staffData) return res.status(403).json({ error: 'Access Denied: Not a Staff Account.' });

    res.json({ 
      user: { ...staffData, role: 'staff' }, 
      token: data.session.access_token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 6. PARENT LOGIN ---
exports.parentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Credentials' });

    const { data: parentData } = await supabase
      .from('parents')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (!parentData) return res.status(403).json({ error: 'Access Denied: Not a Parent Account.' });

    res.json({ 
      user: { ...parentData, role: 'parent' }, 
      token: data.session.access_token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
