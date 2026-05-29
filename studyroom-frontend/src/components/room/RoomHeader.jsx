import { Link } from 'react-router-dom';
import SessionControls from './SessionControls.jsx';
import SessionTimer from './SessionTimer.jsx';

export default function RoomHeader({ room, isCreator, sessionActive, sessionStartTime, onStart, onEnd, sessionLoading, connectionStatus, onToggleParticipants, showParticipants }) {
  const statusColor = {
    connected: 'bg-success',
    connecting: 'bg-warning',
    disconnected: 'bg-danger',
    error: 'bg-danger',
  }[connectionStatus] || 'bg-text-muted';

  return (
    <header className="h-14 border-b border-bg-border bg-bg-surface flex items-center px-4 gap-4 flex-shrink-0">
      <Link
        to="/rooms"
        className="text-text-muted hover:text-text-primary transition-colors text-sm"
      >
        Back
      </Link>

      <div className="w-px h-5 bg-bg-border" />

      <div className="flex items-center gap-2 min-w-0">
        <h1 className="font-semibold text-text-primary truncate">{room?.name}</h1>
        {room?.code && (
          <span className="font-mono text-xs bg-bg-elevated border border-bg-border text-text-secondary px-2 py-0.5 rounded flex-shrink-0">
            {room.code}
          </span>
        )}
      </div>

      <div className="flex-1" />

      <SessionTimer startTimeISO={sessionStartTime} />

      <div className="w-px h-5 bg-bg-border" />

      <SessionControls
        isCreator={isCreator}
        sessionActive={sessionActive}
        onStart={onStart}
        onEnd={onEnd}
        loading={sessionLoading}
      />

      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs text-text-muted capitalize">{connectionStatus}</span>
      </div>

      <button
        type="button"
        onClick={onToggleParticipants}
        className="md:hidden text-text-muted hover:text-text-primary text-sm transition-colors cursor-pointer"
      >
        {showParticipants ? 'Hide' : 'People'}
      </button>
    </header>
  );
}
