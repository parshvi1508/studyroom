import { useCallback, useEffect, useRef, useState } from 'react';

const WS_BASE = import.meta.env.VITE_WS_URL;

export function useWebSocket(roomCode, token) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [closeCode, setCloseCode] = useState(null);
  const wsRef = useRef(null);

  const sendMessage = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !token) return;

    const url = `${WS_BASE}/ws/${roomCode}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setConnectionStatus('connecting');
    setCloseCode(null);

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (parsed.type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      }
      setLastMessage(parsed);
    };

    ws.onclose = (event) => {
      setCloseCode(event.code);
      setConnectionStatus('disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };

    return () => {
      ws.close();
    };
  }, [roomCode, token]);

  return { sendMessage, lastMessage, connectionStatus, closeCode };
}
