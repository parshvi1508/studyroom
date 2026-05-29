import { Link } from 'react-router-dom';
import SessionControls from './SessionControls.jsx';
import SessionTimer from './SessionTimer.jsx';

export default function RoomHeader({
  room,
  isCreator,
  sessionActive,
  sessionStartTime,
  onStart,
  onEnd,
  sessionLoading,
  connectionStatus,
  onToggleParticipants,
  showParticipants,
}) {
  const statusColor = {
    connected: 'bg-success',
    connecting: 'bg-warning',
    disconnected: 'bg-danger',
    error: 'bg-danger',
  }[connectionStatus] || 'bg-text-muted';

  return (
    <header className="h-14 border-b border-bg-border bg-bg-surface flex items-center px-4 gap-3 flex-shrink-0">
      {/* Back - icon-only when session active to reclaim space */}
      <Link
        to="/rooms"
        className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        title="Back to rooms"
      >
        {sessionActive ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        ) : (
          <span className="text-sm">Back</span>
        )}
      </Link>

      <div className="w-px h-5 bg-bg-border flex-shrink-0" />

      {/* Room name + code - de-emphasized when session active */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        <h1
          className={`truncate transition-all ${
            sessionActive
              ? 'text-xs text-text-muted font-normal'
              : 'text-sm font-semibold text-text-primary'
          }`}
        >
          {room?.name}
        </h1>
        {room?.code && (
          <span
            className="font-mono text-xs bg-bg-elevated border border-bg-border text-text-muted px-2 py-0.5 rounded flex-shrink-0"
            style={{ fontSize: '11px' }}
          >
            {room.code}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Timer - dominant element */}
      <SessionTimer startTimeISO={sessionStartTime} />

      <div className="w-px h-5 bg-bg-border flex-shrink-0" />

      <SessionControls
        isCreator={isCreator}
        sessionActive={sessionActive}
        onStart={onStart}
        onEnd={onEnd}
        loading={sessionLoading}
      />

      {/* Connection status - minimal, tucked right */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
        <span className="text-[10px] text-text-muted capitalize hidden sm:block">{connectionStatus}</span>
      </div>

      <button
        type="button"
        onClick={onToggleParticipants}
        className="md:hidden text-text-muted hover:text-text-primary text-sm transition-colors cursor-pointer flex-shrink-0"
      >
        {showParticipants ? 'Hide' : 'People'}
      </button>
    </header>
  );
}
