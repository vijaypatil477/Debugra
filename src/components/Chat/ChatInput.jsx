import { forwardRef } from 'react';

const ChatInput = forwardRef(({ input, setInput, handleSend }, ref) => {
  return (
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
          ref={ref}
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
  );
});

export default ChatInput;
