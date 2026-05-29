import LoadingSpinner from '../shared/LoadingSpinner.jsx';

export default function SessionControls({ isCreator, sessionActive, onStart, onEnd, loading }) {
  if (!isCreator) return null;

  return (
    <div className="flex items-center gap-2">
      {sessionActive ? (
        <button
          type="button"
          onClick={onEnd}
          disabled={loading}
          className="flex items-center gap-2 bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-sm font-medium px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <LoadingSpinner size="sm" />}
          End Session
        </button>
      ) : (
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="flex items-center gap-2 bg-success/10 hover:bg-success/20 border border-success/30 text-success text-sm font-medium px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <LoadingSpinner size="sm" />}
          Start Session
        </button>
      )}
    </div>
  );
}
