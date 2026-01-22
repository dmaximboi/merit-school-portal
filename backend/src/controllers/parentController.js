const supabase = require('../config/supabaseClient');

// 1. PARENT LOGIN
exports.parentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    const cleanId = studentId ? studentId.trim() : "";

    // Find student directly
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .ilike('student_id_text', cleanId)
      .maybeSingle();

    if (error) {
      console.error("DB Error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (!student) {
      return res.status(404).json({ error: `Student ID "${cleanId}" not found.` });
    }

    // Check Password - PRIORITY: Custom Password > Surname (Default)
    const surname = student.surname || "";
    const cleanPass = password.trim();
    const cleanSurname = surname.trim().toLowerCase();

    // If custom password is set, ONLY accept the custom password (disable surname login)
    if (student.parent_password_hash) {
      if (student.parent_password_hash !== cleanPass) {
        return res.status(401).json({ error: `Invalid Password. Please use your custom password.` });
      }
    } else {
      // No custom password set - use surname as default
      if (cleanSurname !== cleanPass.toLowerCase()) {
        return res.status(401).json({ error: `Invalid Password. Try using the surname: ${surname}` });
      }
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'merit-college-parent-secret-key';

    // Generate Token
    const token = jwt.sign({ studentId: student.id, role: 'parent' }, JWT_SECRET, { expiresIn: '24h' });

    // Success
    res.json({
      message: 'Parent Access Granted',
      token,
      student: {
        id: student.id,
        full_name: `${student.surname} ${student.first_name}`,
        student_id: student.student_id_text,
        department: student.department,
        program_type: student.program_type,
        payment_status: student.payment_status // Send payment status to frontend
      }
    });

  } catch (err) {
    console.error('Parent Login Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// 2. CHANGE PASSWORD
exports.updatePassword = async (req, res) => {
  const { studentId, newPassword } = req.body;

  if (!studentId || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { error } = await supabase
      .from('students')
      .update({ parent_password_hash: newPassword })
      .eq('id', studentId);

    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Update Password Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. GET ANNOUNCEMENTS
exports.getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .or('target_audience.eq.all,target_audience.eq.parents,target_audience.eq.students')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. GET ASSESSMENT HISTORY (Quiz + CBT)
exports.getAssessmentHistory = async (req, res) => {
  try {
    // Start with Quiz Attempts
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(title, subject)')
      .eq('student_id', req.user.id) // req.user.id is studentId from verifyParent token
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. GET LIBRARY
exports.getLibrary = async (req, res) => {
  try {
    // Simplified fetch for parents viewing child's potential library
    const { data, error } = await supabase
      .from('library_books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
