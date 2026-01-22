import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Send, User, Loader2, Shield, Briefcase, GraduationCap, Image as ImageIcon, X, PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';

// --- SECURITY: Content Sanitization ---
const sanitizeInput = (text) => {
    if (!text) return '';
    // Remove script tags and dangerous patterns
    return text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '') // Remove all HTML tags
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '')
        .trim();
};

// Validate message content
const validateMessage = (text) => {
    if (!text || text.trim().length === 0) return { valid: false, error: 'Message cannot be empty' };
    if (text.length > 500) return { valid: false, error: 'Message too long (max 500 characters)' };
    if (text.length < 2) return { valid: false, error: 'Message too short' };

    // Check for spam patterns
    const spamPatterns = [
        /(.)\1{10,}/i, // Repeated characters
        /^[^a-zA-Z0-9]+$/i, // Only special characters
    ];

    for (const pattern of spamPatterns) {
        if (pattern.test(text)) {
            return { valid: false, error: 'Invalid message format' };
        }
    }

    return { valid: true };
};

const ChatInterface = ({ user, token, role }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Rate Limiting State
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [showProcessing, setShowProcessing] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const lastSendTimeRef = useRef(0);
    const RATE_LIMIT_MS = 1000; // 1 second between messages

    // Image Upload State
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Quiz Creation State
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState([
        { question: '', options: ['', '', '', ''], correct: 0 }
    ]);
    const [creatingQuiz, setCreatingQuiz] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldownRemaining > 0) {
            const timer = setTimeout(() => {
                setCooldownRemaining(prev => prev - 100);
            }, 100);
            return () => clearTimeout(timer);
        } else if (cooldownRemaining <= 0 && isRateLimited) {
            setIsRateLimited(false);
        }
    }, [cooldownRemaining, isRateLimited]);

    const fetchMessages = async () => {
        try {
            const data = await api.get('/chat?limit=50', token);
            setMessages(data || []);
            setLoading(false);
        } catch (err) {
            console.error("Chat Error:", err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();

        // Sanitize input
        const sanitizedText = sanitizeInput(inputText);

        // Validate message
        if (!selectedImage) {
            const validation = validateMessage(sanitizedText);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
        }

        // Rate limiting check
        const now = Date.now();
        const timeSinceLastSend = now - lastSendTimeRef.current;

        if (timeSinceLastSend < RATE_LIMIT_MS) {
            setIsRateLimited(true);
            setCooldownRemaining(RATE_LIMIT_MS - timeSinceLastSend);
            return;
        }

        if ((!sanitizedText && !selectedImage) || sending) return;

        // Show processing bar
        setShowProcessing(true);
        setSending(true);
        lastSendTimeRef.current = now;

        try {
            await api.post('/chat', {
                message: sanitizedText,
                image: selectedImage
            }, token);

            setInputText('');
            setSelectedImage(null);

            // Hide processing bar after 0.5 seconds
            setTimeout(() => {
                setShowProcessing(false);
            }, 500);

            fetchMessages();

            // Start rate limit cooldown
            setIsRateLimited(true);
            setCooldownRemaining(RATE_LIMIT_MS);

        } catch (err) {
            setShowProcessing(false);
            alert("Failed to send: " + (err.response?.data?.error || err.message));
        } finally {
            setSending(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Validate File Type
        if (!file.type.startsWith('image/')) {
            alert("Only image files are allowed.");
            return;
        }

        // 2. Validate File Size (50KB limit)
        if (file.size > 50 * 1024) {
            alert("File is too large. Max size is 50KB.");
            return;
        }

        setIsImageLoading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result);
            setIsImageLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0 }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleCreateQuiz = async () => {
        if (!quizTitle || questions.some(q => !q.question || q.options.some(o => !o))) {
            alert("Please fill in all fields");
            return;
        }
        if (questions.length < 3) {
            alert("Minimum 3 questions required");
            return;
        }

        setCreatingQuiz(true);
        try {
            await api.post('/chat/create-quiz', {
                title: sanitizeInput(quizTitle),
                questions: questions.map(q => ({
                    ...q,
                    question: sanitizeInput(q.question),
                    options: q.options.map(o => sanitizeInput(o))
                }))
            }, token);

            setShowQuizModal(false);
            setQuizTitle('');
            setQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
            alert("Quiz created successfully!");
            fetchMessages(); // Refresh to see announcement
        } catch (err) {
            alert("Failed to create quiz: " + err.message);
        } finally {
            setCreatingQuiz(false);
        }
    };

    const getRoleIcon = (r) => {
        if (r === 'admin') return <Shield size={12} className="text-red-500" />;
        if (r === 'staff') return <Briefcase size={12} className="text-purple-500" />;
        return <GraduationCap size={12} className="text-blue-500" />;
    };

    const currentUserId = user?.id; // Standardize user ID check

    const isButtonDisabled = sending || isImageLoading || isRateLimited;

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Chat
                </h3>
                <div className="flex gap-3 text-xs">
                    <button
                        onClick={() => setShowQuizModal(true)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium hover:bg-purple-200 transition flex items-center gap-1"
                    >
                        <PlusCircle size={14} /> Create Quiz
                    </button>
                    <span className="text-slate-400 py-1">Updates every 5s</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                {loading ? (
                    <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-slate-400 mt-10">No messages yet. Say hello!</p>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.sender_id === currentUserId;
                        const isSystem = msg.is_system;

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-4">
                                    <span className="px-4 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200 font-medium">
                                        {msg.message}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMe ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {msg.sender_name?.[0] || 'U'}
                                </div>
                                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-600">{msg.sender_name}</span>
                                        {getRoleIcon(msg.sender_role)}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed overflow-hidden ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                        {msg.image_url && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                                <img src={msg.image_url} alt="Attachment" className="max-w-full h-auto object-cover" />
                                            </div>
                                        )}
                                        {msg.message}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Processing Bar */}
            {showProcessing && (
                <div className="absolute bottom-[76px] left-0 right-0 bg-purple-600/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2 animate-pulse">
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span className="text-white text-sm font-medium">Processing...</span>
                </div>
            )}

            {/* Image Preview */}
            {selectedImage && (
                <div className="p-2 px-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-300">
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-slate-500">Image attached</span>
                    </div>
                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-500">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center relative">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isButtonDisabled}
                    className="p-2 text-slate-400 hover:text-purple-600 transition rounded-full hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload Image (Max 50KB)"
                >
                    <ImageIcon size={20} />
                </button>
                <input
                    className="flex-1 input-field rounded-full px-6"
                    placeholder={isRateLimited ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s...` : "Type a message..."}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    maxLength={500}
                    disabled={isRateLimited}
                />
                <button
                    disabled={isButtonDisabled}
                    type="submit"
                    className={`p-3 text-white rounded-full transition ${isRateLimited
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                        } disabled:opacity-50`}
                    title={isRateLimited ? 'Please wait before sending another message' : 'Send message'}
                >
                    {(sending || isImageLoading) ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : isRateLimited ? (
                        <AlertTriangle size={20} />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </form>

            {/* Quiz Creation Modal */}
            {showQuizModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90%] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PlusCircle className="text-purple-600" /> Create New Quiz
                            </h3>
                            <button onClick={() => setShowQuizModal(false)} className="text-slate-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                                <input
                                    className="input-field w-full"
                                    placeholder="e.g., Mathematics Pop Quiz"
                                    value={quizTitle}
                                    onChange={e => setQuizTitle(e.target.value)}
                                    maxLength={100}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-slate-600">Questions ({questions.length})</h4>
                                    <button onClick={handleAddQuestion} className="text-xs text-purple-600 font-bold hover:underline">
                                        + Add Question
                                    </button>
                                </div>

                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-500">Q{qIdx + 1}</span>
                                            {questions.length > 3 && (
                                                <button
                                                    onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            className="input-field w-full text-sm"
                                            placeholder="Question text..."
                                            value={q.question}
                                            onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                                            maxLength={300}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-1">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qIdx}`}
                                                        checked={q.correct === oIdx}
                                                        onChange={() => handleQuestionChange(qIdx, 'correct', oIdx)}
                                                        className="accent-purple-600"
                                                    />
                                                    <input
                                                        className="input-field w-full text-xs py-1"
                                                        placeholder={`Option ${oIdx + 1}`}
                                                        value={opt}
                                                        onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                                                        maxLength={150}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-2">
                            <button
                                onClick={() => setShowQuizModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateQuiz}
                                disabled={creatingQuiz}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {creatingQuiz ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                Create & Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
