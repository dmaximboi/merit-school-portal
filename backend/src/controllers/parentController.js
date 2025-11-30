const supabase = require('../config/supabaseClient');

exports.parentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    // Clean the input (Remove spaces)
    const cleanId = studentId.trim();

    // 1. Find student using 'ilike' (Case Insensitive)
    const { data: student, error } = await supabase
      .from('students')
      .select('*, profiles:id(full_name)')
      .ilike('student_id_text', cleanId) // <--- FIX: ilike ignores case
      .single();

    if (error || !student) {
      console.log(`Parent Login Failed: ID '${cleanId}' not found.`);
      return res.status(404).json({ error: 'Student ID not found. Check spelling carefully.' });
    }

    // 2. Check Password
    const surname = student.surname || "";
    const cleanPass = password.trim().toLowerCase();
    const cleanSurname = surname.trim().toLowerCase();

    // Check custom hash OR surname
    const isSurnameMatch = cleanSurname === cleanPass;
    const isHashMatch = student.parent_password_hash === password;

    if (!isSurnameMatch && !isHashMatch) {
      return res.status(401).json({ error: `Invalid Password. Try using the surname: ${surname}` });
    }

    // 3. Success
    res.json({
      message: 'Parent Access Granted',
      student: {
        id: student.id,
        full_name: student.profiles?.full_name || student.surname,
        student_id: student.student_id_text,
        department: student.department
      }
    });

  } catch (err) {
    console.error('Parent Login Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};