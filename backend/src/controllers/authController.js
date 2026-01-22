const supabase = require('../config/supabaseClient');
const { checkAccountSuspension, recordFailedLogin, clearLoginAttempts, logSecurityEvent } = require('../utils/securityHelpers');

/**
 * HELPER: Upload Base64 Photo to Supabase Storage
 * Ensures student photos are stored in the 'photos' bucket and returns a public URL.
 */
async function uploadPhoto(base64Data, userId) {
  if (!base64Data) return null;
  try {
    // Remove Base64 header prefix (e.g., data:image/jpeg;base64,)
    const base64File = base64Data.split(';base64,').pop();
    const buffer = Buffer.from(base64File, 'base64');
    const path = `students/${userId}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Photo Upload Error:", err.message);
    return null; // Continue registration even if photo fails to prevent blocking user
  }
}

/**
 * HELPER: Password Integrity Check
 * Enforces a minimum of 6 characters and at least one digit.
 */
const validatePasswordStrength = (password) => {
  const regex = /^(?=.*\d).{6,}$/;
  return regex.test(password);
};

// --- 1. EMAIL VALIDATION (SUPABASE CHECK) ---
// Used by the registration form to check if a Gmail exists before submission.
exports.checkEmailExists = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required for validation." });

  try {
    // Check 'profiles' table which maps 1:1 with Auth Users
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return res.json({ exists: true, message: "This email address is already registered in our system." });
    }

    return res.json({ exists: false });
  } catch (err) {
    console.error("Email Integrity Check Error:", err);
    res.status(500).json({ error: "Unable to verify email availability at this time." });
  }
};

// --- 2. ADMIN LOGIN ---
// Authenticates administrators and verifies they are in the 'admin_allowlist'.
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check account suspension
    await checkAccountSuspension(email);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await recordFailedLogin(email);
      await logSecurityEvent({
        type: 'LOGIN_FAILED',
        userId: email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: 'Invalid credentials', role: 'admin' },
        severity: 'HIGH'
      });
      return res.status(401).json({ error: 'Invalid Administrator Credentials' });
    }

    // SECURITY: Verification against manual Allowlist
    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (!adminEntry) {
      await supabase.auth.signOut();
      await logSecurityEvent({
        type: 'UNAUTHORIZED_ADMIN_ACCESS',
        userId: email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: 'Not in admin allowlist' },
        severity: 'CRITICAL'
      });
      return res.status(403).json({ error: 'Access Denied: Your email is not authorized for Admin access.' });
    }

    // Clear login attempts on success
    await clearLoginAttempts(email);
    await logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      userId: data.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { role: 'admin' },
      severity: 'MEDIUM'
    });

    res.json({
      message: 'Admin Login Successful',
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email, role: 'admin' }
    });
  } catch (err) {
    console.error("Admin Auth Error:", err);
    res.status(500).json({ error: err.message || 'Internal Server Security Error' });
  }
};

// --- 3. STUDENT LOGIN ---
// Allows login via Email or Alphanumeric Student ID.
exports.studentLogin = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    let email = identifier;

    // Resolve Student ID to Email
    if (!identifier.includes('@')) {
      const { data } = await supabase
        .from('students')
        .select('email')
        .ilike('student_id_text', identifier.trim())
        .maybeSingle();

      if (!data) return res.status(404).json({ error: 'The provided Student ID was not found.' });
      email = data.email;
    }

    // Check account suspension
    await checkAccountSuspension(email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      // Record failed login attempt
      await recordFailedLogin(email);
      await logSecurityEvent({
        type: 'LOGIN_FAILED',
        userId: email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: 'Invalid password', role: 'student' },
        severity: 'MEDIUM'
      });
      return res.status(401).json({ error: 'Invalid Password. Access Denied.' });
    }

    // Clear login attempts on success
    await clearLoginAttempts(email);

    const { data: profile, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (dbError) throw dbError;
    if (!profile) return res.status(500).json({ error: 'Student profile record missing.' });

    // Log successful login
    await logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      userId: authData.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { role: 'student' },
      severity: 'LOW'
    });

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: { ...profile, role: 'student' }
    });
  } catch (error) {
    console.error("Student Auth Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 4. REGISTER STUDENT (SECURE VERSION) ---
// Prevents Admin/Staff overlaps and enforces the MCAS/DEPT/YEAR/4RAND format.
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
    // A. PASSWORD SECURITY
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({ error: "Password is too weak. Must be 6+ chars with a number." });
    }

    // B. ROLE INTEGRITY: Prevent Admins/Staff from being Students
    const { data: isAdmin } = await supabase.from('admin_allowlist').select('email').ilike('email', email).maybeSingle();
    if (isAdmin) return res.status(403).json({ error: "Admin accounts cannot register as students." });

    const { data: isStaff } = await supabase.from('staff').select('email').ilike('email', email).maybeSingle();
    if (isStaff) return res.status(403).json({ error: "Staff accounts cannot register as students." });

    // C. CREATE AUTH USER
    const fullName = `${surname} ${middleName} ${lastName}`.trim();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;
    userId = authData.user.id;

    // D. GENERATE ID (Format: MCAS/DEPT/YEAR/4RAND)
    const year = new Date().getFullYear().toString().slice(-2);
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const deptMap = { 'Science': 'SCI', 'Art': 'ART', 'Commercial': 'BUS' };
    const deptCode = deptMap[department] || 'GEN';
    const studentIdText = `MCAS/${deptCode}/${year}/${randDigits}`;

    // E. PHOTO UPLOAD
    const photoUrl = await uploadPhoto(photoPreview, userId);

    // F. DATABASE ENTRIES
    await supabase.from('profiles').upsert({ id: userId, email, role: 'student', full_name: fullName });

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

    // G. TRUSTED LOGGING (IP from Headers)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
    await supabase.from('activity_logs').insert([{
      student_id: userId,
      student_name: fullName,
      student_id_text: studentIdText,
      action: 'ACCOUNT_REGISTERED',
      ip_address: ip,
      device_info: req.headers['user-agent'] || 'Unknown'
    }]);

    res.status(201).json({ message: 'Success', studentId: studentIdText });

  } catch (error) {
    console.error("Critical Registration Error:", error);
    if (userId && error.message.includes("Database")) {
      await supabase.auth.admin.deleteUser(userId);
    }
    res.status(400).json({ error: error.message });
  }
};

// --- 5. STAFF LOGIN ---
exports.staffLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Staff Credentials' });

    const { data: staffData } = await supabase.from('staff').select('*').eq('id', data.user.id).single();
    if (!staffData) return res.status(403).json({ error: 'Access Denied: Not a Staff account.' });

    res.json({ user: { ...staffData, role: 'staff' }, token: data.session.access_token });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- 6. PARENT LOGIN ---
exports.parentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Parent Credentials' });

    const { data: parentData } = await supabase.from('parents').select('*').eq('id', data.user.id).single();
    if (!parentData) return res.status(403).json({ error: 'Access Denied: Not a Parent account.' });

    res.json({ user: { ...parentData, role: 'parent' }, token: data.session.access_token });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- 7. FORGOT PASSWORD (MAGIC LINK) ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@gmail.com')) {
    return res.status(400).json({ error: 'Please provide a valid Gmail address.' });
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (!profile) return res.status(404).json({ error: 'No account found with this email.' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/auth/reset-password',
    });

    if (error) throw error;
    res.json({ message: 'Password reset link sent! Check your Gmail inbox.' });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    res.status(500).json({ error: 'Failed to send reset email.' });
  }
};
