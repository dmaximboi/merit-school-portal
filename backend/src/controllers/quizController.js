const supabase = require('../config/supabaseClient');

// 1. CREATE QUIZ
exports.createQuiz = async (req, res) => {
    const { title, subject, questions, is_public, description } = req.body;
    const user = req.user; // From verifyAny middleware
    const role = req.role; // 'admin', 'staff', 'student', 'parent'

    try {
        // Determine creator info based on role
        let creatorName = 'Anonymous';
        let creatorId = null;

        if (role === 'admin') {
            creatorName = user.email || 'Admin';
            creatorId = null; // Admin not in students table
        } else if (role === 'staff') {
            creatorName = user.staff_name || user.email || 'Staff';
            creatorId = null; // Staff not in students table
        } else if (role === 'student') {
            creatorName = `${user.surname || ''} ${user.first_name || ''}`.trim() || 'Student';
            creatorId = user.id; // Student ID for foreign key
        } else if (role === 'parent') {
            creatorName = user.parent_name || 'Parent';
            creatorId = null; // Parent not in students table
        }

        const { data, error } = await supabase
            .from('quizzes')
            .insert([{
                creator_id: creatorId,
                creator_name: creatorName,
                creator_role: role,
                title,
                subject,
                description: description || '',
                questions, // JSONB
                is_public: is_public !== false,
                access_code: !is_public ? Math.random().toString(36).substring(7).toUpperCase() : null
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Quiz creation error:', err);
        res.status(500).json({ error: err.message });
    }
};

// 2. GET ALL PUBLIC QUIZZES
exports.getPublicQuizzes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. SUBMIT ATTEMPT
exports.submitAttempt = async (req, res) => {
    const { quiz_id, score, total } = req.body;
    try {
        const { error } = await supabase
            .from('quiz_attempts')
            .insert([{
                quiz_id,
                student_id: req.user.id,
                score,
                total
            }]);

        if (error) throw error;
        res.json({ message: "Score recorded!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. GET MY QUIZ HISTORY
exports.getMyHistory = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select('*, quizzes(title, subject)')
            .eq('student_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. GET PUBLIC LEADERBOARD
exports.getLeaderboard = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select(`
                id,
                score,
                total,
                created_at,
                quizzes (id, title, subject),
                students (id, surname, first_name)
            `)
            .order('score', { ascending: false })
            .limit(100);

        if (error) throw error;

        // Transform data for frontend
        const leaderboard = (data || []).map(entry => ({
            id: entry.id,
            score: Math.round((entry.score / entry.total) * 100),
            correct: entry.score,
            total: entry.total,
            quiz_id: entry.quizzes?.id,
            quiz_title: entry.quizzes?.title || 'Unknown Quiz',
            quiz_subject: entry.quizzes?.subject,
            student_id: entry.students?.id,
            student_name: entry.students ? `${entry.students.surname} ${entry.students.first_name}` : 'Anonymous',
            created_at: entry.created_at
        }));

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
