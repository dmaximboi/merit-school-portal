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
    const { message, image } = req.body;

    // Require either message or image
    if ((!message || message.trim() === "") && !image) {
        return res.status(400).json({ error: "Message or image required" });
    }

    try {
        let imageUrl = null;
        let imageThumbnail = null;

        // Upload image if provided
        if (image) {
            const uploadResult = await uploadToCloudinary(image, 'chat');
            if (uploadResult.success) {
                imageUrl = uploadResult.url;
                imageThumbnail = getThumbnailUrl(uploadResult.publicId);
            } else {
                console.error('Image upload failed:', uploadResult.error);
            }
        }

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

        const { error } = await supabase.from('chat_messages').insert([{
            sender_id: req.user.id,
            sender_name: senderName,
            sender_role: req.role || 'student',
            message: message?.trim() || '',
            image_url: imageUrl,
            image_thumbnail: imageThumbnail
        }]);

        if (error) throw error;
        res.json({ success: true, imageUrl });
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

