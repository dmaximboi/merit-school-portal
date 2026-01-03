import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import RichTextEditor from '../../components/shared/RichTextEditor';
import { Lock } from 'lucide-react';
import katex from 'katex'; // To render math in display

const StudentChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputHtml, setInputHtml] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // ... (Keep your useEffect for checking access) ...

  const sendMessage = async () => {
    if (!inputHtml || inputHtml === '<p></p>') return;
    
    // Optimistic UI update (optional)
    await api.post('/chat/send', { 
      message: inputHtml, // Sending HTML string
      type: 'html'        // Mark as HTML
    });
    
    setInputHtml('');
    fetchMessages();
  };

  // ... (Keep fetchMessages) ...

  // DISPLAY COMPONENT FOR MESSAGES
  const MessageBubble = ({ msg }) => {
    // This effect finds all $...$ in the HTML and renders them using KaTeX
    // This is a "Poor man's" Math render for stored HTML, but works great for Chat
    const contentRef = React.useRef(null);

    React.useEffect(() => {
      if (contentRef.current) {
        // Find text nodes with $...$
        // Simple regex replace for display
        const html = msg.message.replace(/\$([^$]+)\$/g, (match, tex) => {
          try {
            return katex.renderToString(tex, { throwOnError: false });
          } catch(e) { return match; }
        });
        contentRef.current.innerHTML = html;
      }
    }, [msg.message]);

    return (
      <div className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${msg.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {msg.sender_name[0]}
        </div>
        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.isMe ? 'bg-blue-50 text-slate-900 border border-blue-200' : 'bg-white border'}`}>
          <div className="font-bold text-xs opacity-70 mb-1 flex justify-between">
            <span>{msg.sender_name}</span>
            <span className="uppercase text-[10px] border px-1 rounded">{msg.sender_role}</span>
          </div>
          
          {/* THE MESSAGE CONTENT */}
          <div ref={contentRef} className="prose prose-sm max-w-none [&>img]:rounded-lg [&>img]:max-h-60" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
       {/* HEADER */}
       <div className="bg-white p-4 shadow-sm border-b"><h1 className="font-bold">Classroom Chat</h1></div>

       {/* MESSAGES LIST */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
       </div>

       {/* TIPTAP EDITOR INPUT */}
       <div className="p-4 bg-white border-t">
          <RichTextEditor 
            content={inputHtml} 
            onChange={setInputHtml} 
            onSend={sendMessage} 
          />
       </div>
    </div>
  );
};

export default StudentChat;
