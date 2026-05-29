import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const hashColor = (str) => {
  const colors = [
    '#6b7280',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#22c55e',
    '#64748b',
    '#0ea5e9',
    '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (timestamp) => {
  if (!timestamp?.toDate) return '';
  const d = timestamp.toDate();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatPanel({ roomId, user, isOpen, onToggle, isAuthor, onInsertSnippet }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevCountRef = useRef(0);

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'snippets'
  const [snippets, setSnippets] = useState([]);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetCode, setSnippetCode] = useState('');
  const [snippetLang, setSnippetLang] = useState('javascript');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, 'rooms', roomId, 'snippets'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const snips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSnippets(snips);
    });
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      if (!isOpen && msgs.length > prevCountRef.current) {
        setUnreadCount((prev) => prev + (msgs.length - prevCountRef.current));
      }
      prevCountRef.current = msgs.length;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [roomId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !roomId || !user) return;
    const msg = input.trim();
    setInput('');
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      text: msg,
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      createdAt: serverTimestamp(),
    });
  };

  const handleAddSnippet = async (e) => {
    e.preventDefault();
    if (!snippetTitle.trim() || !snippetCode.trim() || !roomId || !user) return;
    try {
      await addDoc(collection(db, 'rooms', roomId, 'snippets'), {
        title: snippetTitle.trim(),
        code: snippetCode.trim(),
        language: snippetLang,
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: serverTimestamp(),
      });
      setSnippetTitle('');
      setSnippetCode('');
      setShowAddForm(false);
      toast.success('Snippet posted successfully! ✦');
    } catch (err) {
      toast.error('Failed to post snippet');
    }
  };

  const handleDeleteSnippet = async (e, snippetId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this snippet?')) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId, 'snippets', snippetId));
      toast.success('Snippet deleted');
    } catch (err) {
      toast.error('Failed to delete snippet');
    }
  };

  const handleCopySnippet = (e, codeText) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText)
      .then(() => {
        toast.success('Copied snippet to clipboard! ✦');
      })
      .catch(() => {
        toast.error('Copy failed');
      });
  };

  const handleDownloadReport = () => {
    if (!messages || messages.length === 0) {
      alert('No logs available to download!');
      return;
    }

    let markdownContent = '# AI Explanation & Debug Report\n\n';

    messages.forEach((msg) => {
      const sender = msg.uid === user?.uid ? 'You' : 'AI Assistant';
      markdownContent += `### **${sender}**:\n${msg.text}\n\n---\n\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });

    const downloadUrl = URL.createObjectURL(blob);

    const hiddenAnchor = document.createElement('a');
    hiddenAnchor.href = downloadUrl;
    hiddenAnchor.download = `debug-report-${roomId || 'session'}.md`;

    document.body.appendChild(hiddenAnchor);
    hiddenAnchor.click();
    document.body.removeChild(hiddenAnchor);

    URL.revokeObjectURL(downloadUrl);
  };
  if (!roomId) return null;

  const groupedMessages = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    groupedMessages.push({ ...msg, showHeader: !prev || prev.uid !== msg.uid });
  });

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Team Chat"
          className="chat-fab"
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#252526',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
            zIndex: 30,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #1e1e1e',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="chat-panel"
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            width: '340px',
            maxHeight: '480px',
            height: '480px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            zIndex: 30,
            overflow: 'hidden',
            animation: 'slide-up 0.2s ease',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: '#252526',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Team Chat
                </div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{roomId}</div>
              </div>
            </div>
            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              title="Download Report as Markdown"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                color: '#94a3b8',
                transition: 'color 0.2s',
                marginRight: 'auto',
                marginLeft: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.55rem',
                  color: '#10b981',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                Live
              </span>
              <button
                onClick={onToggle}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#e2e8f0',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div
            style={{
              display: 'flex',
              background: '#181818',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '4px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                background: activeTab === 'chat' ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none',
                color: activeTab === 'chat' ? '#e2e8f0' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'chat' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat
            </button>
            <button
              onClick={() => setActiveTab('snippets')}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                background: activeTab === 'snippets' ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none',
                color: activeTab === 'snippets' ? '#e2e8f0' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'snippets' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Snippets
              {snippets.length > 0 && (
                <span
                  style={{
                    background: '#f97316',
                    color: '#0a0a0f',
                    borderRadius: '8px',
                    padding: '1px 6px',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                  }}
                >
                  {snippets.length}
                </span>
              )}
            </button>
          </div>

          {/* Messages */}
          {activeTab === 'chat' && (
            <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: '8px',
                  padding: '40px 0',
                }}
              >
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                  No messages yet
                </p>
                <p
                  style={{
                    fontSize: '0.68rem',
                    color: '#475569',
                    lineHeight: 1.4,
                    textAlign: 'center',
                  }}
                >
                  Send a message to your team.
                </p>
              </div>
            )}

            {groupedMessages.map((msg) => {
              const isMe = msg.uid === user?.uid;
              const avatarColor = hashColor(msg.uid);
              const initial = (msg.displayName?.[0] || '?').toUpperCase();

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    marginTop: msg.showHeader ? '10px' : '2px',
                  }}
                >
                  {msg.showHeader && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '3px',
                        padding: '0 2px',
                        flexDirection: isMe ? 'row-reverse' : 'row',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          background: isMe ? '#374151' : avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5rem',
                          fontWeight: 700,
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                      <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>
                        {isMe ? 'You' : msg.displayName}
                      </span>
                      <span style={{ fontSize: '0.5rem', color: '#334155' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      borderTopLeftRadius: !isMe && msg.showHeader ? '2px' : '8px',
                      borderTopRightRadius: isMe && msg.showHeader ? '2px' : '8px',
                      background: isMe ? '#2d2d2d' : 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#cbd5e1',
                      fontSize: '0.76rem',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          )}

          {/* Input */}
          {activeTab === 'chat' && (
            <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '3px 3px 3px 12px',
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.78rem',
                  fontFamily: "'Inter', sans-serif",
                  padding: '5px 0',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: input.trim() ? '#f97316' : 'rgba(255,255,255,0.03)',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={input.trim() ? '#0a0a0f' : '#475569'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
          )}

          {/* Snippet Repository */}
          {activeTab === 'snippets' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header inside panel to toggle Add Snippet form */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Shared Snippets</span>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{
                    background: showAddForm ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                    color: showAddForm ? '#ef4444' : '#f97316',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {showAddForm ? 'Cancel' : '+ Share Snippet'}
                </button>
              </div>

              {/* Collapsible Add Snippet Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddSnippet}
                  style={{
                    padding: '12px',
                    background: '#1a1a1a',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    animation: 'slide-up 0.2s ease',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                      Snippet Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DFS Algorithm, Fetch API helper"
                      value={snippetTitle}
                      onChange={(e) => setSnippetTitle(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.75rem',
                        padding: '6px 8px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                        Language
                      </label>
                      <select
                        value={snippetLang}
                        onChange={(e) => setSnippetLang(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#222',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          fontSize: '0.75rem',
                          padding: '5px 8px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                        <option value="csharp">C#</option>
                        <option value="java">Java</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="sql">SQL</option>
                        <option value="bash">Bash / Shell</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                      Code Content
                    </label>
                    <textarea
                      required
                      placeholder="Paste your code snippet here..."
                      value={snippetCode}
                      onChange={(e) => setSnippetCode(e.target.value)}
                      rows={5}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: '0.72rem',
                        padding: '8px',
                        resize: 'vertical',
                        outline: 'none',
                        lineHeight: 1.4,
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#f97316',
                      color: '#0a0a0f',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    Post Snippet
                  </button>
                </form>
              )}

              {/* Snippets Feed */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {snippets.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      gap: '8px',
                      padding: '40px 0',
                      opacity: 0.6,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>
                      No snippets yet
                    </p>
                    <p
                      style={{
                        fontSize: '0.65rem',
                        color: '#475569',
                        lineHeight: 1.4,
                        textAlign: 'center',
                        margin: 0,
                        maxWidth: '200px',
                      }}
                    >
                      Post high-frequency code chunks to copy and paste easily!
                    </p>
                  </div>
                ) : (
                  snippets.map((snip) => {
                    const isMySnippet = snip.uid === user?.uid;
                    const avatarColor = hashColor(snip.uid);
                    const initial = (snip.displayName?.[0] || '?').toUpperCase();
                    const langBadge = snip.language ? snip.language.toUpperCase() : 'CODE';

                    return (
                      <div
                        key={snip.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                      >
                        {/* Header: User & Meta info */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                background: isMySnippet ? '#374151' : avatarColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.5rem',
                                fontWeight: 700,
                                color: 'white',
                              }}
                            >
                              {initial}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 600 }}>
                                {snip.title}
                              </span>
                              <span style={{ fontSize: '0.55rem', color: '#64748b' }}>
                                by {isMySnippet ? 'You' : snip.displayName}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: '#38bdf8',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontSize: '0.55rem',
                                fontWeight: 700,
                                border: '1px solid rgba(56, 189, 248, 0.15)',
                              }}
                            >
                              {langBadge}
                            </span>
                            {(isMySnippet || isAuthor) && (
                              <button
                                onClick={(e) => handleDeleteSnippet(e, snip.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  opacity: 0.6,
                                  transition: 'opacity 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                                title="Delete Snippet"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Code Monospace preview */}
                        <div style={{ position: 'relative' }}>
                          <pre
                            className="custom-scrollbar"
                            style={{
                              margin: 0,
                              background: '#0d0d0f',
                              border: '1px solid rgba(255,255,255,0.04)',
                              borderRadius: '6px',
                              padding: '8px',
                              color: '#a9b1d6',
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              fontSize: '0.68rem',
                              lineHeight: 1.45,
                              maxHeight: '120px',
                              overflowY: 'auto',
                              whiteSpace: 'pre',
                              overflowX: 'auto',
                            }}
                          >
                            {snip.code}
                          </pre>
                        </div>

                        {/* Actions: Copy & Insert */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <button
                            onClick={(e) => handleCopySnippet(e, snip.code)}
                            style={{
                              flex: 1,
                              background: '#252526',
                              border: '1px solid rgba(255,255,255,0.06)',
                              color: '#e2e8f0',
                              borderRadius: '4px',
                              padding: '4px 0',
                              fontSize: '0.62rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#2d2d2e';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#252526';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy
                          </button>
                          {onInsertSnippet && (
                            <button
                              onClick={() => onInsertSnippet(snip.code)}
                              style={{
                                flex: 1,
                                background: 'rgba(249, 115, 22, 0.08)',
                                border: '1px solid rgba(249, 115, 22, 0.25)',
                                color: '#f97316',
                                borderRadius: '4px',
                                padding: '4px 0',
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Insert
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
