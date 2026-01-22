import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { MessageCircle, Send, User, Shield, RefreshCw, Image, X, Loader2, AlertTriangle } from 'lucide-react';

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

const StudentChat = () => {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  // Rate Limiting State
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSendTimeRef = useRef(0);
  const RATE_LIMIT_MS = 1000; // 1 second between messages

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initial Load & Polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
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

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat', token);
      setMessages(res || []);
      setError(null);
    } catch (err) {
      console.error("Chat Error:", err);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50KB for security)
    if (file.size > 50 * 1024) {
      alert('Image must be less than 50KB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // Sanitize input
    const sanitizedText = sanitizeInput(inputText);

    // Validate message if no image
    if (!imageBase64) {
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

    // Require either text or image
    if (!sanitizedText && !imageBase64) return;

    // Show processing bar
    setShowProcessing(true);
    setSending(true);
    setInputText(""); // Optimistic clear
    lastSendTimeRef.current = now;

    try {
      await api.post('/chat', {
        message: sanitizedText,
        image: imageBase64
      }, token);

      // Clear image after sending
      removeImage();

      // Hide processing bar after 0.5 seconds
      setTimeout(() => {
        setShowProcessing(false);
      }, 500);

      fetchMessages(); // Refresh immediately

      // Start rate limit cooldown
      setIsRateLimited(true);
      setCooldownRemaining(RATE_LIMIT_MS);

    } catch (err) {
      alert("Failed to send message");
      setInputText(sanitizedText); // Restore on fail
      setShowProcessing(false);
    } finally {
      setSending(false);
    }
  };

  const isButtonDisabled = (!inputText.trim() && !imageBase64) || sending || isRateLimited;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm border-b border-slate-200 flex justify-between items-center fixed top-0 w-full z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full text-green-600">
            <MessageCircle size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Student Community</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <button onClick={fetchMessages} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><RefreshCw size={20} /></button>
      </header>

      {/* MESSAGES AREA */}
      <main className="flex-1 mt-20 mb-24 p-4 space-y-4 overflow-y-auto">
        <div className="text-center text-xs text-slate-400 py-4">
          Messages are monitored by Administration. Be respectful.
        </div>
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const name = msg.sender_name || 'Unknown';

          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl p-4 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}>
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      {msg.sender_role === 'admin' ? <Shield size={10} className="text-red-500" /> : <User size={10} />}
                      {name}
                    </span>
                  </div>
                )}

                {/* Image Display */}
                {msg.image_url && (
                  <div className="mb-2">
                    <img
                      src={msg.image_url}
                      alt="Shared image"
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(msg.image_url, '_blank')}
                    />
                  </div>
                )}

                {/* Message Text */}
                {msg.message && (
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                )}

                <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* PROCESSING BAR */}
      {showProcessing && (
        <div className="fixed bottom-20 left-0 right-0 bg-blue-600/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2 animate-pulse z-20">
          <Loader2 size={16} className="animate-spin text-white" />
          <span className="text-white text-sm font-medium">Processing...</span>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="fixed bottom-20 left-4 right-4 bg-white border border-slate-200 rounded-xl p-3 shadow-lg max-w-md mx-auto z-10">
          <div className="flex items-start gap-3">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-700">Image ready to send</p>
              <p className="text-xs text-slate-500 mt-1">Add a message or send as is</p>
            </div>
            <button
              onClick={removeImage}
              className="p-1 text-red-500 hover:bg-red-50 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      <footer className="fixed bottom-0 w-full bg-white p-4 border-t border-slate-200">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 items-end">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRateLimited || sending}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach Image (Max 50KB)"
          >
            <Image size={20} />
          </button>

          {/* Text input */}
          <input
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isRateLimited ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s...` : (imagePreview ? "Add a caption..." : "Type a message...")}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            maxLength={500}
            disabled={isRateLimited}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`p-4 text-white rounded-2xl transition shadow-lg disabled:opacity-50 ${isRateLimited
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-800'
              }`}
            title={isRateLimited ? 'Please wait before sending another message' : 'Send message'}
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isRateLimited ? (
              <AlertTriangle size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default StudentChat;
