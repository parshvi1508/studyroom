import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ messages, onSend }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const content = inputRef.current?.value.trim();
      if (!content) return;
      onSend(content);
      inputRef.current.value = '';
    }
  }

  function handleSendClick() {
    const content = inputRef.current?.value.trim();
    if (!content) return;
    onSend(content);
    inputRef.current.value = '';
  }

  const isOwnMessage = (msg) => msg.user_id === user?.id;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-text-muted text-sm text-center mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={msg.id || msg.message_id || i}
            className={`rounded px-3 py-2 max-w-[85%] ${
              isOwnMessage(msg)
                ? 'bg-accent/10 border border-accent/20 self-end'
                : 'bg-bg-elevated self-start'
            }`}
          >
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xs font-medium text-accent">{msg.display_name}</span>
              <span className="text-xs text-text-muted">{formatTime(msg.sent_at)}</span>
            </div>
            <p className="text-sm text-text-primary break-words">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-bg-border px-4 py-3 flex flex-col sm:flex-row gap-2">
        <input
          ref={inputRef}
          type="text"
          maxLength={1000}
          placeholder="Send a message..."
          onKeyDown={handleKeyDown}
          className="flex-1 bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
        />
        <button
          type="button"
          onClick={handleSendClick}
          className="bg-accent hover:bg-accent-hover cursor-pointer text-white text-sm font-medium px-4 py-2 rounded transition-colors w-full sm:w-auto"
        >
          Send
        </button>
      </div>
    </div>
  );
}
