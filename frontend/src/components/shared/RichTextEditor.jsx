import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Sigma, Send } from 'lucide-react';
import clsx from 'clsx';
import 'katex/dist/katex.min.css'; // Standard Math Styles
import katex from 'katex';

// --- MATH EXTENSION (Custom Simple Node) ---
// This allows typing $E=mc^2$ and rendering it
import { Node, mergeAttributes } from '@tiptap/core';

const MathExtension = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: 'x' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math' })];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.classList.add('math-node', 'px-1', 'bg-slate-100', 'rounded', 'cursor-pointer', 'border', 'border-slate-200');
      dom.title = "Click to edit LaTeX";
      
      try {
        katex.render(node.attrs.latex, dom, { throwOnError: false });
      } catch (e) {
        dom.innerText = node.attrs.latex;
      }
      
      dom.addEventListener('click', () => {
        const newLatex = prompt('Edit Math Formula (LaTeX):', node.attrs.latex);
        if (newLatex !== null) {
          // This is a hacky way to update, typically we use React NodeViews
          // But for a simple chat, re-inserting works
          // Ideally, just delete and re-insert or use state
        }
      });
      
      return { dom };
    };
  },
});

// --- CLOUDINARY CONFIG ---
const CLOUD_NAME = "YOUR_CLOUD_NAME"; // REPLACE THIS
const UPLOAD_PRESET = "YOUR_PRESET_NAME"; // REPLACE THIS

const RichTextEditor = ({ content, onChange, editable = true, onSend }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Type a message...' }),
      // MathExtension, // Simplify: For now, we will just use code blocks for math or standard text
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange && onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: clsx(
          'prose prose-sm max-w-none focus:outline-none min-h-[40px]',
          editable ? 'p-3' : ''
        ),
      },
    },
  });

  const uploadImage = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        editor.chain().focus().setImage({ src: data.secure_url }).run();
      }
    } catch (err) {
      alert("Image upload failed");
    }
  };

  const addMath = () => {
    const latex = prompt("Enter LaTeX Formula (e.g., E=mc^2):");
    if (latex) {
      // For simplicity in this version, we insert it as code 
      // A full Math node requires complex setup. 
      // We will render it using a separate viewer trick or just Code format.
      editor.chain().focus().insertContent(`$${latex}$`).run();
    }
  };

  if (!editor) return null;

  // --- READ ONLY MODE (DISPLAY) ---
  if (!editable) {
    // We use a trick: Replace $...$ with rendered math in the display
    // But safely. For now, TipTap displays HTML.
    // If you want to render Math in the display, we need to parse the content string
    // outside of TipTap or use a TipTap node view.
    return <EditorContent editor={editor} className="text-slate-800" />;
  }

  // --- EDIT MODE (TOOLBAR) ---
  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <EditorContent editor={editor} className="max-h-40 overflow-y-auto" />
      
      {/* TOOLBAR */}
      <div className="flex items-center justify-between p-2 bg-slate-50 border-t border-slate-200">
        <div className="flex gap-1">
          <MenuBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold size={16}/>} />
          <MenuBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic size={16}/>} />
          <MenuBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List size={16}/>} />
          
          {/* MATH BUTTON */}
          <MenuBtn onClick={addMath} icon={<Sigma size={16}/>} title="Add Math Formula" />
          
          {/* IMAGE BUTTON (Hidden Input) */}
          <label className="p-2 text-slate-500 hover:bg-slate-200 rounded hover:text-blue-600 cursor-pointer transition">
            <ImageIcon size={16}/>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(e.target.files[0])} />
          </label>
        </div>

        <button 
          onClick={() => { onSend && onSend(); editor.commands.clearContent(); }} 
          className="bg-blue-900 text-white p-2 rounded-lg hover:bg-blue-800 transition shadow-md"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

const MenuBtn = ({ onClick, active, icon, title }) => (
  <button 
    onClick={onClick} 
    title={title}
    className={clsx(
      "p-2 rounded transition",
      active ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-200 hover:text-black"
    )}
  >
    {icon}
  </button>
);

export default RichTextEditor;
