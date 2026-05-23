'use dom';

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

interface RichTextEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLocked?: boolean;
}

export default function RichTextEditor({
  initialValue,
  onChange,
  placeholder = "Start typing your premium thoughts... (Type '/' for commands)",
  isLocked = false
}: RichTextEditorProps) {
  const localContentRef = useRef<string>(initialValue);
  const debounceTimerRef = useRef<any>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyNodeClass: 'is-empty',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialValue,
    editable: !isLocked,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      localContentRef.current = html;

      // Handle Slash command popups
      const { selection } = editor.state;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, selection.from - 1),
        selection.from
      );

      if (textBefore === '/') {
        // Find cursor position coordinates to float the menu
        const view = editor.view;
        try {
          const startCoords = view.coordsAtPos(selection.from);
          // Position absolute inside editor container
          const editorBounds = view.dom.getBoundingClientRect();
          setMenuCoords({
            top: startCoords.bottom - editorBounds.top + 10,
            left: Math.min(
              editorBounds.width - 220,
              Math.max(10, startCoords.left - editorBounds.left)
            ),
          });
          setShowSlashMenu(true);
        } catch (e) {
          setShowSlashMenu(true);
        }
      } else if (showSlashMenu && textBefore !== '/') {
        setShowSlashMenu(false);
      }

      // Debounce Native Sync to keep typing fluid
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(html);
      }, 300);
    },
  });

  // Sync content when note changes from the outside
  useEffect(() => {
    if (editor && initialValue !== localContentRef.current) {
      localContentRef.current = initialValue;
      editor.commands.setContent(initialValue);
    }
  }, [initialValue, editor]);

  // Sync locked status
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked);
    }
  }, [isLocked, editor]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const executeCommand = (type: string) => {
    if (!editor) return;

    // Delete the slash char
    const { selection } = editor.state;
    editor.commands.deleteRange({ from: selection.from - 1, to: selection.from });

    // Apply formatting
    switch (type) {
      case 'h1':
        editor.commands.toggleHeading({ level: 1 });
        break;
      case 'h2':
        editor.commands.toggleHeading({ level: 2 });
        break;
      case 'h3':
        editor.commands.toggleHeading({ level: 3 });
        break;
      case 'bullet':
        editor.commands.toggleBulletList();
        break;
      case 'ordered':
        editor.commands.toggleOrderedList();
        break;
      case 'todo':
        editor.commands.toggleTaskList();
        break;
      case 'code':
        editor.commands.toggleCodeBlock();
        break;
      case 'quote':
        editor.commands.toggleBlockquote();
        break;
      default:
        break;
    }

    setShowSlashMenu(false);
    editor.commands.focus();
  };

  if (!editor) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Initializing Premium Editor...</span>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* ──────────────── STYLE SHEET (Premium CSS) ──────────────── */}
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: transparent;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          color: #f4f4f5;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative;
          background: transparent;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          color: #71717a;
          font-size: 14px;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #27272a;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Tiptap Core Styles */
        .ProseMirror {
          flex: 1;
          outline: none;
          padding: 16px 20px 80px 20px;
          min-height: 200px;
          overflow-y: auto;
          line-height: 1.6;
          font-size: 16px;
        }

        .ProseMirror p.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #3f3f46;
          pointer-events: none;
          height: 0;
        }

        /* Headers */
        .ProseMirror h1 {
          font-size: 28px;
          font-weight: 800;
          margin-top: 24px;
          margin-bottom: 8px;
          color: #ffffff;
          letter-spacing: -0.025em;
        }

        .ProseMirror h2 {
          font-size: 22px;
          font-weight: 700;
          margin-top: 20px;
          margin-bottom: 6px;
          color: #f4f4f5;
          letter-spacing: -0.02em;
        }

        .ProseMirror h3 {
          font-size: 18px;
          font-weight: 600;
          margin-top: 16px;
          margin-bottom: 4px;
          color: #e4e4e7;
        }

        /* Lists */
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 24px;
          margin: 8px 0;
        }

        .ProseMirror li {
          margin-bottom: 4px;
        }

        /* Task List Checklist */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 4px;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 10px;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          margin-top: 4px;
          user-select: none;
          cursor: pointer;
        }

        .ProseMirror ul[data-type="taskList"] li > label input {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1.5px solid #52525b;
          border-radius: 4px;
          outline: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ProseMirror ul[data-type="taskList"] li > label input:checked {
          background: #10b981;
          border-color: #10b981;
        }

        .ProseMirror ul[data-type="taskList"] li > label input:checked::after {
          content: '✓';
          font-size: 11px;
          color: #000000;
          font-weight: 900;
        }

        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #71717a;
        }

        /* Quotes */
        .ProseMirror blockquote {
          border-left: 4px solid #10b981;
          background: rgba(16, 185, 129, 0.05);
          padding: 8px 16px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #d4d4d8;
        }

        /* Code Blocks */
        .ProseMirror pre {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 12px 16px;
          overflow-x: auto;
          font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
          font-size: 14px;
          color: #34d399;
          margin: 14px 0;
        }

        .ProseMirror code {
          background: rgba(255, 255, 255, 0.08);
          font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
          font-size: 13px;
          padding: 2px 6px;
          border-radius: 4px;
          color: #fb7185;
        }

        /* ──────────────── Pinned Formatting Toolbar ──────────────── */
        .editor-toolbar {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px;
          background: rgba(18, 18, 20, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          z-index: 50;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          max-width: 90%;
          overflow-x: auto;
        }

        .toolbar-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .toolbar-btn.active {
          background: #10b981;
          color: #000000;
        }

        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 4px;
        }

        /* ──────────────── Slash Command Floating Menu ──────────────── */
        .slash-menu {
          position: absolute;
          width: 200px;
          max-height: 240px;
          overflow-y: auto;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 6px;
          z-index: 100;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
          animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .slash-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: transparent;
          color: #d4d4d8;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .slash-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .slash-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 11px;
          color: #a1a1aa;
        }

        .slash-item:hover .slash-item-icon {
          background: #10b981;
          color: #000000;
        }

        /* ──────────────── Bubble Menu Selected Text ──────────────── */
        .bubble-menu {
          display: flex;
          align-items: center;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          gap: 2px;
        }
      `}</style>

      {/* ──────────────── MAIN EDITOR CONTENT AREA ──────────────── */}
      <EditorContent editor={editor} style={{ flex: 1, overflowY: 'auto' }} />

      {/* ──────────────── FLOATING SLASH COMMAND MENU ──────────────── */}
      {showSlashMenu && (
        <div
          className="slash-menu"
          style={{ top: `${menuCoords.top}px`, left: `${menuCoords.left}px` }}
        >
          <div style={{ padding: '4px 8px', fontSize: '10px', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Basic Blocks
          </div>
          <button className="slash-item" onClick={() => executeCommand('h1')}>
            <span className="slash-item-icon">H1</span>
            <div>
              <div style={{ fontWeight: '600' }}>Heading 1</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Big section title</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('h2')}>
            <span className="slash-item-icon">H2</span>
            <div>
              <div style={{ fontWeight: '600' }}>Heading 2</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Medium section title</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('h3')}>
            <span className="slash-item-icon">H3</span>
            <div>
              <div style={{ fontWeight: '600' }}>Heading 3</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Small section title</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('bullet')}>
            <span className="slash-item-icon">•</span>
            <div>
              <div style={{ fontWeight: '600' }}>Bulleted List</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Simple bulleted list</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('ordered')}>
            <span className="slash-item-icon">1.</span>
            <div>
              <div style={{ fontWeight: '600' }}>Numbered List</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Sequential numbered list</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('todo')}>
            <span className="slash-item-icon">☑</span>
            <div>
              <div style={{ fontWeight: '600' }}>Checklist</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Track tasks with a todo list</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('code')}>
            <span className="slash-item-icon">&lt;&gt;</span>
            <div>
              <div style={{ fontWeight: '600' }}>Code Block</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Monospace code syntax</div>
            </div>
          </button>
          <button className="slash-item" onClick={() => executeCommand('quote')}>
            <span className="slash-item-icon">”</span>
            <div>
              <div style={{ fontWeight: '600' }}>Blockquote</div>
              <div style={{ fontSize: '10px', color: '#71717a' }}>Capture high-profile quotes</div>
            </div>
          </button>
        </div>
      )}

      {/* ──────────────── BUBBLE POPUP SELECTION MENU ──────────────── */}
      {editor && (
        <BubbleMenu className="bubble-menu" editor={editor}>
          <button
            className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <b>B</b>
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <i>I</i>
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <s>S</s>
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('code') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <code>c</code>
          </button>
        </BubbleMenu>
      )}

      {/* ──────────────── BOTTOM PERSISTENT FORMATTING TOOLBAR ──────────────── */}
      {!isLocked && (
        <div className="editor-toolbar">
          <button
            className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <b>B</b>
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <i>I</i>
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <div className="toolbar-divider" />
          <button
            className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            H1
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            H2
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            H3
          </button>
          <div className="toolbar-divider" />
          <button
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            •
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            1.
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('taskList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Checklist"
          >
            ☑
          </button>
          <div className="toolbar-divider" />
          <button
            className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            &lt;&gt;
          </button>
          <button
            className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            ”
          </button>
          <div className="toolbar-divider" />
          <button
            className="toolbar-btn"
            onClick={() => {
              editor.chain().focus().unsetAllMarks().clearNodes().run();
            }}
            title="Clear Formatting"
            style={{ color: '#ef4444' }}
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
}
