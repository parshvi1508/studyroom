import { useSessionTimer } from '../../hooks/useSessionTimer.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function SessionTimer({ startTimeISO }) {
  const elapsed = useSessionTimer(startTimeISO);

  if (!startTimeISO) {
    return (
      <div className="text-center">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Session</p>
        <span className="font-mono text-2xl text-text-muted">--:--:--</span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Session Active</p>
      <span className="font-mono text-2xl text-success">{formatElapsed(elapsed)}</span>
    </div>
  );
}
