import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import ChatMessage from './ChatMessage';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';

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

export default function ChatPanel({ roomId, user, isOpen, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevCountRef = useRef(0);

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
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: msg,
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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
          aria-label="Toggle Team Chat"
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
          <ChatHeader roomId={roomId} onDownloadReport={handleDownloadReport} onToggle={onToggle} />

          {/* Messages */}
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
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  avatarColor={avatarColor}
                  initial={initial}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
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
                aria-label="Send Message"
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
        </div>
      )}
    </>
  );
}
