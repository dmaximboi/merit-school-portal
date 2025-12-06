const supabase = require('../config/supabaseClient');

// Helper to calculate Grade
const calculateGrade = (total) => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

// --- STAFF/ADMIN: UPLOAD RESULT ---
exports.uploadResult = async (req, res) => {
  const { student_id, subject, ca, exam, term, session } = req.body;
  
  try {
    const total = Number(ca) + Number(exam);
    const grade = calculateGrade(total);

    // Upsert (Insert or Update if exists)
    const { error } = await supabase
      .from('results')
      .upsert({
        student_id,
        subject,
        ca_score: ca,
        exam_score: exam,
        grade,
        term,
        session
      }, { onConflict: 'student_id, subject, term, session' });

    if (error) throw error;
    res.json({ message: 'Result Saved Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PUBLIC: GET STUDENT RESULTS ---
exports.getStudentResults = async (req, res) => {
  const { studentId } = req.params;
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId)
      .order('subject');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};