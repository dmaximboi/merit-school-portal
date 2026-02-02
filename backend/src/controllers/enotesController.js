/**
 * E-Notes Controller
 * Manages digital notes/study materials for students
 * Similar to library but for downloadable study notes
 */

const supabase = require('../config/supabaseClient');

/**
 * Get all E-Notes (public)
 */
exports.getENotes = async (req, res) => {
    try {
        const { subject, class_level } = req.query;

        let query = supabase
            .from('e_notes')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (subject) {
            query = query.eq('subject', subject);
        }
        if (class_level) {
            query = query.eq('class_level', class_level);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get single E-Note by ID
 */
exports.getENote = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('e_notes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'E-Note not found' });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Add new E-Note (Admin & Staff)
 */
exports.addENote = async (req, res) => {
    try {
        const { title, subject, class_level, description, file_url, file_type, file_size, thumbnail_url } = req.body;

        if (!title || !subject || !file_url) {
            return res.status(400).json({ error: 'Title, subject, and file URL are required' });
        }

        // Auto-approve if Admin, pending if Staff
        const isActive = req.role === 'admin';

        const { data, error } = await supabase
            .from('e_notes')
            .insert([{
                title,
                subject,
                class_level: class_level || 'All',
                description: description || '',
                file_url,
                file_type: file_type || 'pdf',
                file_size: file_size || 0,
                thumbnail_url: thumbnail_url || null,
                downloads: 0,
                is_active: isActive,
                uploaded_by: req.user?.id || null,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            note: data,
            message: isActive ? 'E-Note Added Successfully' : 'E-Note Submitted for Approval'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Approve E-Note (Admin only)
 */
exports.approveENote = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('e_notes')
            .update({ is_active: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, note: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get Pending E-Notes (Admin only)
 */
exports.getPendingENotes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('e_notes')
            .select('*')
            .eq('is_active', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get My Uploads (Staff)
 */
exports.getMyENotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data, error } = await supabase
            .from('e_notes')
            .select('*')
            .eq('uploaded_by', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update E-Note (Admin only)
 */
exports.updateENote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subject, class_level, description, file_url, is_active } = req.body;

        const { data, error } = await supabase
            .from('e_notes')
            .update({
                title,
                subject,
                class_level,
                description,
                file_url,
                is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, note: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Delete E-Note (Admin only)
 */
exports.deleteENote = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('e_notes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'E-Note deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Track download (increment counter)
 */
exports.trackDownload = async (req, res) => {
    try {
        const { id } = req.params;

        // Get current downloads
        const { data: note } = await supabase
            .from('e_notes')
            .select('downloads')
            .eq('id', id)
            .single();

        if (note) {
            await supabase
                .from('e_notes')
                .update({ downloads: (note.downloads || 0) + 1 })
                .eq('id', id);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get subjects with note counts
 */
exports.getSubjects = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('e_notes')
            .select('subject')
            .eq('is_active', true);

        if (error) throw error;

        // Count notes per subject
        const subjectCounts = {};
        (data || []).forEach(note => {
            subjectCounts[note.subject] = (subjectCounts[note.subject] || 0) + 1;
        });

        const subjects = Object.entries(subjectCounts).map(([name, count]) => ({
            name,
            count
        }));

        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
