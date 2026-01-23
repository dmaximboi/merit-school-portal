const supabase = require('../config/supabaseClient');
const { uploadToCloudinary, getThumbnailUrl } = require('../utils/imageUpload');

exports.getMessages = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        // Fetch messages with sender info if needed, or rely on raw fields
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Return in chronological order (Oldest -> Newest)
        res.json(data.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendMessage = async (req, res) => {
    const { message } = req.body;

    // Require message text (image upload disabled until DB column exists)
    if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // Get user name based on role
        let senderName = 'User';
        if (req.role === 'student') {
            senderName = `${req.user.surname || ''} ${req.user.first_name || ''}`.trim() || 'Student';
        } else if (req.role === 'staff') {
            senderName = req.user.staff_name || req.user.email || 'Staff';
        } else if (req.role === 'admin') {
            senderName = 'Admin';
        } else if (req.role === 'parent') {
            senderName = req.user.parent_name || 'Parent';
        }

        // Only insert basic text message (no image_url column in current DB)
        const { error } = await supabase.from('chat_messages').insert([{
            sender_id: req.user.id,
            sender_name: senderName,
            sender_role: req.role || 'student',
            message: message.trim()
        }]);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create quiz from chat
exports.createQuizFromChat = async (req, res) => {
    const { title, questions } = req.body;

    if (!title || !questions || questions.length < 3) {
        return res.status(400).json({ error: "Title and at least 3 questions required" });
    }

    try {
        let creatorName = 'User';
        if (req.role === 'student') {
            creatorName = `${req.user.surname || ''} ${req.user.first_name || ''}`.trim();
        } else if (req.role === 'staff') {
            creatorName = req.user.staff_name || 'Staff';
        } else if (req.role === 'admin') {
            creatorName = 'Admin';
        }

        const { data, error } = await supabase
            .from('quizzes')
            .insert([{
                creator_id: req.role === 'student' ? req.user.id : null,
                creator_name: creatorName,
                creator_role: req.role,
                title,
                subject: 'General',
                questions,
                is_public: true,
                access_code: null
            }])
            .select()
            .single();

        if (error) throw error;

        // Announce quiz in chat
        await supabase.from('chat_messages').insert([{
            sender_id: req.user.id,
            sender_name: creatorName,
            sender_role: req.role,
            message: `📝 New Quiz Created: "${title}" - ${questions.length} questions! Anyone can participate.`,
            is_system: true
        }]);

        res.json({ success: true, quiz: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Edit a message (only own messages within 15 minutes)
 */
exports.editMessage = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }

    try {
        // Get the message first
        const { data: existingMsg, error: fetchError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check ownership
        if (existingMsg.sender_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }

        // Check time limit (15 minutes)
        const msgTime = new Date(existingMsg.created_at);
        const now = new Date();
        const diffMinutes = (now - msgTime) / (1000 * 60);

        if (diffMinutes > 15) {
            return res.status(403).json({ error: 'Messages can only be edited within 15 minutes' });
        }

        // Update message
        const { error: updateError } = await supabase
            .from('chat_messages')
            .update({
                message: message.trim(),
                is_edited: true,
                edited_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Delete a message (only own messages)
 */
exports.deleteMessage = async (req, res) => {
    const { id } = req.params;

    try {
        // Get the message first
        const { data: existingMsg, error: fetchError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check ownership (admins can delete any message)
        if (existingMsg.sender_id !== req.user.id && req.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        // Soft delete - replace content
        const { error: updateError } = await supabase
            .from('chat_messages')
            .update({
                message: 'This message was deleted',
                is_deleted: true,
                image_url: null
            })
            .eq('id', id);

        if (updateError) throw updateError;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

