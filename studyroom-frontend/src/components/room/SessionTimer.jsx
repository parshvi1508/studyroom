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
        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Session</p>
        <span
          className="font-mono text-text-muted"
          style={{ fontSize: '22px', fontWeight: '400', letterSpacing: '0.05em' }}
        >
          --:--:--
        </span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-[10px] text-accent/70 uppercase tracking-widest mb-0.5">Session Active</p>
      <span
        className="font-mono text-accent"
        style={{
          fontSize: '28px',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textShadow: '0 0 16px rgba(99,102,241,0.45)',
        }}
      >
        {formatElapsed(elapsed)}
      </span>
    </div>
  );
}
