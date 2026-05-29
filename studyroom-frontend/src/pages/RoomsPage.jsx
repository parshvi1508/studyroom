import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRoom, listRooms, archiveRoom } from '../api/rooms.js';
import ErrorMessage from '../components/shared/ErrorMessage.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoomsPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    fetchRooms();
  }, [token]);

  async function fetchRooms() {
    setLoading(true);
    setError('');
    try {
      const data = await listRooms(token);
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const room = await createRoom(newRoomName.trim(), token);
      setRooms((prev) => [room, ...prev]);
      setNewRoomName('');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    navigate(`/rooms/${trimmed}`);
  }

  async function handleArchive(code) {
    if (!window.confirm('Archive this room? This cannot be undone.')) return;
    try {
      const updated = await archiveRoom(code, token);
      setRooms((prev) => prev.map((r) => (r.code === code ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCopy(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 1500);
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-bg-border bg-bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-accent font-semibold text-sm" style={{fontFamily:"'DM Mono', monospace"}}>Syncora</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/dashboard" className="hidden sm:block text-text-muted hover:text-text-primary text-sm transition-colors">
              Dashboard
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            {(() => {
              const h = new Date().getHours();
              const prefix = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
              return `${prefix}, ${user?.display_name || 'there'}.`;
            })()}
          </h1>
          <p className="text-text-secondary text-sm mt-1">Your study spaces. Pick one or create a new one.</p>
        </div>

        <div className="bg-bg-elevated border border-bg-border rounded-lg mb-6 overflow-hidden">
          <div className="flex border-b border-bg-border">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 text-sm font-medium px-4 py-3 transition-colors cursor-pointer ${
                activeTab === 'create'
                  ? 'text-text-primary border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 text-sm font-medium px-4 py-3 transition-colors cursor-pointer ${
                activeTab === 'join'
                  ? 'text-text-primary border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Join
            </button>
          </div>
          <div className="p-4">
            {activeTab === 'create' ? (
              <form onSubmit={handleCreate} className="flex gap-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room name..."
                  maxLength={100}
                  className="flex-1 bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
                />
                <button
                  type="submit"
                  disabled={creating || !newRoomName.trim()}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  {creating && <LoadingSpinner size="sm" />}
                  Create Room
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter 6-character room code..."
                  className="flex-1 bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {createError && (
          <div className="mb-4">
            <ErrorMessage message={createError} />
          </div>
        )}

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && rooms.length === 0 && !error && (
          <div className="text-center py-16 flex flex-col items-center">
            <svg className="w-16 h-16 text-text-muted opacity-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
            <p className="text-text-secondary text-base font-medium">No rooms yet</p>
            <p className="text-text-muted text-sm max-w-xs mx-auto text-center mt-2">Create your first room above and share the 6-character code with your study group</p>
          </div>
        )}

        {!loading && rooms.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">Your rooms</span>
            <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">{rooms.filter((r) => r.is_active).length} active</span>
          </div>
        )}

        <div className="grid gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`bg-bg-elevated border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                room.is_active
                  ? 'border-bg-border border-l-4 border-l-accent hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200'
                  : 'border-bg-border border-l-4 border-l-bg-border transition-colors'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className={`font-medium text-text-primary truncate ${!room.is_active ? 'opacity-40' : ''}`}>{room.name}</h2>
                  {!room.is_active && (
                    <span className="text-xs bg-bg-elevated text-text-muted border border-bg-border px-2 py-0.5 rounded flex-shrink-0">
                      Archived
                    </span>
                  )}
                  {room.is_active && (
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-xs text-success font-mono">Ready</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs text-text-secondary bg-bg-elevated border border-bg-border px-2 py-0.5 rounded ${!room.is_active ? 'opacity-40' : ''}`}>
                    {room.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(room.code)}
                    className="text-text-muted hover:text-accent transition-colors cursor-pointer relative"
                    title="Copy room code"
                  >
                    {copiedCode === room.code ? (
                      <span className="text-xs text-accent font-medium">Copied!</span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                {room.created_at && (
                  <p className={`text-text-secondary text-xs font-mono mt-1 ${!room.is_active ? 'opacity-40' : ''}`}>
                    Created {new Date(room.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-0 sm:ml-auto flex-shrink-0">
                {room.is_active && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/rooms/${room.code}`)}
                      className="bg-accent hover:bg-accent-hover cursor-pointer text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
                    >
                      Join
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(room.code)}
                      className="text-text-muted hover:text-danger text-sm transition-colors cursor-pointer px-2"
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
