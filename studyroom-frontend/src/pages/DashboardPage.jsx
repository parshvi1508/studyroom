import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/users.js';
import ErrorMessage from '../components/shared/ErrorMessage.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function formatDuration(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDashboard(token)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-bg-border bg-bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/rooms" className="text-accent font-semibold text-sm hover:text-accent-hover transition-colors">
              StudyRoom
            </Link>
            <span className="text-text-muted text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/rooms"
              className="text-text-muted hover:text-text-primary text-sm transition-colors"
            >
              Rooms
            </Link>
            <span className="hidden sm:block text-text-secondary text-sm">{user?.display_name}</span>
            <button
              type="button"
              onClick={logout}
              className="text-text-muted hover:text-danger text-sm transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-6">Your Stats</h1>

        {error && <ErrorMessage message={error} />}

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-surface border border-bg-border border-b-2 border-b-accent/40 rounded-lg p-5 transition-colors hover:border-l-2 hover:border-l-accent">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Study Time
                </p>
                <p className="text-3xl font-semibold text-text-primary">{formatDuration(data.total_study_seconds)}</p>
              </div>
              <div className="bg-bg-surface border border-bg-border border-b-2 border-b-accent/40 rounded-lg p-5 transition-colors hover:border-l-2 hover:border-l-accent">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Sessions
                </p>
                <p className="text-3xl font-semibold text-text-primary">{data.session_count}</p>
              </div>
              <div className="bg-bg-surface border border-bg-border border-b-2 border-b-accent/40 rounded-lg p-5 transition-colors hover:border-l-2 hover:border-l-accent">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Rooms Created
                </p>
                <p className="text-3xl font-semibold text-text-primary">{data.rooms_created}</p>
              </div>
            </div>

            <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-bg-border">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Session History</h2>
              </div>
              {data.session_history.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-10">No sessions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-bg-border">
                        <th className="text-left px-5 py-3 text-text-muted font-medium">Room</th>
                        <th className="text-left px-5 py-3 text-text-muted font-medium">Date</th>
                        <th className="text-left px-5 py-3 text-text-muted font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.session_history.map((s) => (
                        <tr key={s.session_id} className="border-b border-bg-border last:border-0 hover:bg-bg-elevated transition-colors">
                          <td className="px-5 py-3">
                            <span className="text-text-primary">{s.room_name}</span>
                            <span className="ml-2 font-mono text-xs text-text-muted">{s.room_code}</span>
                          </td>
                          <td className="px-5 py-3 text-text-secondary">{formatDate(s.start_time)}</td>
                          <td className="px-5 py-3 text-text-secondary">{formatDuration(s.duration_seconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
