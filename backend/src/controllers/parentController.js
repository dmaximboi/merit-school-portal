const supabase = require('../config/supabaseClient');

exports.parentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    // 1. Sanitize Input
    const cleanId = studentId ? studentId.trim() : "";

    console.log(`Parent trying to login with ID: "${cleanId}"`);

    // 2. Simple, Direct Lookup (Removed the complex 'profiles' join)
    const { data: student, error } = await supabase
      .from('students')
      .select('*') // Just get student data directly
      .ilike('student_id_text', cleanId)
      .maybeSingle();

    if (error) {
        console.error("Parent Login DB Error:", error);
        // Return 500 but with a clearer message
        return res.status(500).json({ error: "System Error: Could not search student records." });
    }

    if (!student) {
      return res.status(404).json({ error: `Student ID "${cleanId}" not found. Please check the admission letter.` });
    }

    // 3. Password Validation (Surname or Custom Password)
    const surname = student.surname || "";
    const cleanPass = password ? password.trim().toLowerCase() : "";
    const cleanSurname = surname.trim().toLowerCase();

    // Check 1: Does password match Surname? (Case-insensitive)
    const isSurnameMatch = cleanSurname === cleanPass;
    
    // Check 2: Does password match custom parent password? (If set)
    const isHashMatch = student.parent_password_hash && student.parent_password_hash === password;

    if (!isSurnameMatch && !isHashMatch) {
      return res.status(401).json({ error: `Invalid Password. Please use the Student's Surname (e.g., "${surname}").` });
    }

    // 4. Successful Login Response
    res.json({
      message: 'Parent Access Granted',
      student: {
        id: student.id,
        // Use local names since we didn't join profiles
        full_name: `${student.surname} ${student.first_name}`, 
        student_id: student.student_id_text,
        department: student.department,
        program_type: student.program_type
      }
    });

  } catch (err) {
    console.error('Parent Login Critical Error:', err);
    res.status(500).json({ error: 'Server Connection Failed' });
  }
};
