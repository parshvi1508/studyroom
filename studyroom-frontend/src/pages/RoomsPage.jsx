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
    try {
      const updated = await archiveRoom(code, token);
      setRooms((prev) => prev.map((r) => (r.code === code ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-bg-border bg-bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-accent font-semibold text-sm">StudyRoom</span>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">Your Rooms</h1>
        </div>

        <form onSubmit={handleCreate} className="bg-bg-surface border border-bg-border rounded-lg p-4 mb-3 flex gap-3">
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

        <form onSubmit={handleJoin} className="bg-bg-surface border border-bg-border rounded-lg p-4 mb-6 flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Join a room by code..."
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
          <p className="text-text-muted text-center py-16 text-sm">No rooms yet. Create one above.</p>
        )}

        <div className="grid gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`bg-bg-surface border rounded-lg p-4 flex items-center gap-4 transition-colors ${
                room.is_active
                  ? 'border-bg-border hover:border-accent/40 hover:border-l-accent hover:border-l-2 hover:bg-accent/5'
                  : 'border-bg-border opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-medium text-text-primary truncate">{room.name}</h2>
                  {!room.is_active && (
                    <span className="text-xs bg-bg-elevated text-text-muted border border-bg-border px-2 py-0.5 rounded flex-shrink-0">
                      Archived
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-text-muted bg-bg-elevated border border-bg-border px-2 py-0.5 rounded">
                  {room.code}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
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
