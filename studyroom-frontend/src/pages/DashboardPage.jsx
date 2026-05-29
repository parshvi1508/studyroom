import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/users.js';
import ErrorMessage from '../components/shared/ErrorMessage.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '< 1m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
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
              Syncora
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
            {(() => {
              const dates = data.session_history
                .map((s) => new Date(s.start_time).toDateString())
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort((a, b) => new Date(b) - new Date(a));
              let streak = 0;
              const today = new Date();
              for (let i = 0; i < dates.length; i++) {
                const expected = new Date(today);
                expected.setDate(expected.getDate() - i);
                if (dates[i] === expected.toDateString()) {
                  streak++;
                } else {
                  break;
                }
              }
              return streak > 1 ? (
                <div className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-2 text-sm text-accent font-mono mb-4">
                  {streak}-day streak. Keep it going.
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-surface border border-bg-border border-b-4 border-b-accent/60 rounded-lg p-5 transition-colors hover:border-l-2 hover:border-l-accent">
                <p className="text-text-muted text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Study Time
                </p>
                <p className="text-5xl font-bold text-text-primary" style={{fontFamily:"'DM Serif Display', Georgia, serif"}}>{formatDuration(data.total_study_seconds)}</p>
                <svg className="w-full h-6 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <polyline points="0,18 15,16 30,14 45,12 55,10 70,7 85,5 100,2" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.4" />
                </svg>
                {data.total_study_seconds > 3600 && (
                  <p className="text-text-muted text-xs mt-1">Keep the streak going</p>
                )}
              </div>
              <div className="bg-bg-surface border border-bg-border border-b-4 border-b-accent/60 rounded-lg p-5 transition-colors hover:border-l-2 hover:border-l-accent">
                <p className="text-text-muted text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Sessions
                </p>
                <p className="text-5xl font-bold text-text-primary" style={{fontFamily:"'DM Mono', monospace"}}>{data.session_count}</p>
                <svg className="w-full h-6 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <polyline points="0,18 10,18 10,14 25,14 25,10 40,10 40,8 55,8 55,6 70,6 70,4 85,4 85,2 100,2" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.4" />
                </svg>
                {data.session_count > 0 && (
                  <p className="text-text-muted text-xs mt-1">{data.session_count} sessions completed</p>
                )}
              </div>
              <div className="bg-bg-surface border border-bg-border border-b-4 border-b-accent/60 rounded-lg p-5 transition-colors hover:border-l-2 hover:border-l-accent">
                <p className="text-text-muted text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Rooms Created
                </p>
                <p className="text-5xl font-bold text-text-primary" style={{fontFamily:"'DM Mono', monospace"}}>{data.rooms_created}</p>
                <svg className="w-full h-6 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <polyline points="0,16 20,16 35,15 50,14 60,12 70,10 80,6 100,3" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.4" />
                </svg>
                <p className="text-text-muted text-xs mt-1">rooms you own</p>
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
                      {(() => {
                        const maxDuration = Math.max(...data.session_history.map((s) => s.duration_seconds || 0));
                        return data.session_history.map((s) => {
                          const isLongest = maxDuration > 0 && s.duration_seconds === maxDuration;
                          return (
                            <tr
                              key={s.session_id}
                              className={`border-b border-bg-border last:border-0 hover:bg-bg-elevated transition-colors border-l-2 ${
                                isLongest
                                  ? 'bg-accent/5 border-l-accent/30'
                                  : 'border-l-transparent hover:border-l-accent/40'
                              }`}
                            >
                              <td className="px-5 py-3">
                                <span className="text-text-primary">{s.room_name}</span>
                                <span className="ml-2 font-mono text-xs text-text-muted">{s.room_code}</span>
                              </td>
                              <td className="px-5 py-3 text-text-secondary">{formatDate(s.start_time)}</td>
                              <td className="px-5 py-3">
                                <div className="relative">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-accent/8 rounded"
                                    style={{ width: `${(s.duration_seconds / maxDuration * 100).toFixed(1)}%` }}
                                  />
                                  <span className="relative text-text-secondary">
                                    {formatDuration(s.duration_seconds)}
                                    {isLongest && (
                                      <span className="ml-2 text-[10px] text-accent font-mono uppercase tracking-wider">best</span>
                                    )}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
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
