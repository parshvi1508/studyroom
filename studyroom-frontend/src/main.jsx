import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// StrictMode removed: double-mount causes WS connect/close race in dev.
// useWebSocket opens a connection on mount; StrictMode cleanup closes it
// before the server finishes processing, triggering close code 4009.
// Production builds are unaffected. Re-enable StrictMode only after
// adding reconnect logic to useWebSocket.js with a proper ADR entry.
createRoot(document.getElementById('root')).render(
  <App />,
);
