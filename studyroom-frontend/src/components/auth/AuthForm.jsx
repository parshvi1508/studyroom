import { useState } from 'react';
import ErrorMessage from '../shared/ErrorMessage.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';

export default function AuthForm({ mode, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({ email, password, display_name: displayName });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />

      {mode === 'register' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="display-name" className="text-sm text-text-secondary">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={1}
            maxLength={100}
            placeholder="Your name"
            className="bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-text-secondary">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-text-secondary">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Min 8 characters"
          className="bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white font-medium rounded px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
      >
        {loading && <LoadingSpinner size="sm" />}
        {mode === 'register' ? 'Create Account' : 'Sign In'}
      </button>
    </form>
  );
}
