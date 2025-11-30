const supabase = require('../config/supabaseClient');

// LOGIN
exports.studentLogin = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    let email = identifier;

    // 1. Resolve Student ID to Email
    if (!identifier.includes('@')) {
      const { data } = await supabase.from('students').select('email').eq('student_id_text', identifier).single();
      if (!data) return res.status(404).json({ error: 'Student ID not found' });
      email = data.email;
    }

    // 2. Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid Password' });

    console.log("✅ Auth Success. User ID:", authData.user.id);

    // 3. Get Profile (WITH ERROR LOGGING)
    const { data: profile, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (dbError) {
        console.error("❌ DATABASE ERROR:", dbError);
        return res.status(500).json({ error: "DB Error: " + dbError.message });
    }

    if (!profile) {
        console.error("❌ Profile is NULL. ID searched:", authData.user.id);
        return res.status(500).json({ error: 'Profile row is missing in table.' });
    }

    // Manual fetch of full name since we removed the join above
    const { data: profileName } = await supabase.from('profiles').select('full_name').eq('id', authData.user.id).single();
    profile.profiles = profileName;

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: profile
    });
  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// REGISTRATION
exports.registerStudent = async (req, res) => {
  // 1. Clean Inputs
  const clean = (val) => (val && val.trim() !== "" ? val : null);

  const { 
    email, password, surname, middleName, lastName, 
    programme, department, subjects, photoPreview 
  } = req.body;

  try {
    const fullName = `${surname} ${middleName} ${lastName}`.trim();

    // 2. Create Login
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || 'password123',
      email_confirm: true,
      user_metadata: { full_name: fullName } 
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 3. Generate Student ID based on Department
    const year = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(100 + Math.random() * 900);
    
    // Map Department to Code
    const deptMap = { 
      'Science': 'SCI', 
      'Art': 'ART', 
      'Commercial': 'BUS' 
    };
    const deptCode = deptMap[department] || 'GEN';
    
    const studentIdText = `MCAS/${deptCode}/${year}/${rand}`; 

    // 4. UPDATE the profile
    const { error: updateError } = await supabase
      .from('students')
      .update({
        student_id_text: studentIdText,
        department: clean(department), // SAVE THE DEPARTMENT
        surname: clean(surname),
        first_name: clean(middleName),
        last_name: clean(lastName),
        gender: clean(req.body.gender),
        dob: clean(req.body.dateOfBirth),
        state_of_origin: clean(req.body.stateOfOrigin),
        lga: clean(req.body.lga),
        address: clean(req.body.permanentAddress),
        parents_phone: clean(req.body.parentsPhone),
        phone_number: clean(req.body.studentPhone),
        program_type: programme,
        subjects: subjects,
        university_choice: clean(req.body.university),
        course_choice: clean(req.body.course),
        photo_url: photoPreview
      })
      .eq('id', userId);

    if (updateError) {
       console.error("Profile Update Failed:", updateError);
       return res.status(201).json({ 
         message: 'Account Created but Profile incomplete. Please Login to finish.', 
         studentId: 'PENDING' 
       });
    }

    res.status(201).json({ message: 'Success', studentId: studentIdText });

  } catch (error) {
    console.error("Reg Error:", error);
    res.status(400).json({ error: error.message });
  }
};