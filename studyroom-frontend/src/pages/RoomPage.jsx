import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getActiveSession, getRoom, getRoomMessages } from '../api/rooms.js';
import ChatPanel from '../components/room/ChatPanel.jsx';
import PresenceList from '../components/room/PresenceList.jsx';
import RoomHeader from '../components/room/RoomHeader.jsx';
import ErrorMessage from '../components/shared/ErrorMessage.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';

export default function RoomPage() {
  const { code } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [wsError, setWsError] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const { sendMessage, lastMessage, connectionStatus, closeCode } = useWebSocket(code, token);

  const closeCodeHandled = useRef(false);

  // Initial data fetch
  useEffect(() => {
    if (!code || !token) return;

    async function init() {
      setPageLoading(true);
      setPageError('');
      try {
        const [roomData, msgs, activeSession] = await Promise.all([
          getRoom(code, token),
          getRoomMessages(code, token),
          getActiveSession(code, token),
        ]);
        setRoom(roomData);
        setMessages(msgs);
        if (activeSession) {
          setSessionStartTime(activeSession.start_time);
        }
      } catch (err) {
        setPageError(err.message);
      } finally {
        setPageLoading(false);
      }
    }

    init();
  }, [code, token]);

  // Handle WS close codes
  useEffect(() => {
    if (closeCode === null || closeCodeHandled.current) return;

    if (closeCode === 4001) {
      closeCodeHandled.current = true;
      navigate('/login');
    } else if (closeCode === 4003) {
      closeCodeHandled.current = true;
      navigate('/rooms', { state: { message: 'Room has been archived' } });
    } else if (closeCode === 4004) {
      closeCodeHandled.current = true;
      navigate('/rooms');
    } else if (closeCode === 4009) {
      setWsError('Already connected from another tab or device');
    }
  }, [closeCode, navigate]);

  // Handle incoming WS messages
  useEffect(() => {
    if (!lastMessage) return;

    const msg = lastMessage;

    switch (msg.type) {
      case 'user_joined':
        setParticipants(msg.participants);
        break;

      case 'user_left':
        setParticipants(msg.participants);
        break;

      case 'chat_message':
        setMessages((prev) => [...prev, {
          id: msg.message_id,
          user_id: msg.user_id,
          display_name: msg.display_name,
          content: msg.content,
          sent_at: msg.sent_at,
        }]);
        break;

      case 'session_started':
        setSessionStartTime(msg.start_time);
        setSessionLoading(false);
        break;

      case 'session_ended':
        setSessionStartTime(null);
        setSessionLoading(false);
        break;

      case 'error':
        setWsError(msg.message);
        setSessionLoading(false);
        break;

      default:
        break;
    }
  }, [lastMessage]);

  function handleSendMessage(content) {
    sendMessage({ type: 'chat_message', content });
  }

  function handleStartSession() {
    setSessionLoading(true);
    setWsError('');
    sendMessage({ type: 'start_session' });
  }

  function handleEndSession() {
    setSessionLoading(true);
    setWsError('');
    sendMessage({ type: 'end_session' });
  }

  const isCreator = room && user && room.creator_id === user.id;
  const sessionActive = sessionStartTime !== null;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <ErrorMessage message={pageError} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-base flex flex-col">
      <RoomHeader
        room={room}
        isCreator={isCreator}
        sessionActive={sessionActive}
        sessionStartTime={sessionStartTime}
        onStart={handleStartSession}
        onEnd={handleEndSession}
        sessionLoading={sessionLoading}
        connectionStatus={connectionStatus}
        onToggleParticipants={() => setShowParticipants((v) => !v)}
        showParticipants={showParticipants}
      />

      {wsError && (
        <div className="px-4 pt-2">
          <ErrorMessage message={wsError} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel messages={messages} onSend={handleSendMessage} />
        </div>

        <aside
          className={`w-64 border-l border-bg-border bg-bg-surface flex-shrink-0 overflow-hidden flex-col ${
            showParticipants ? 'flex' : 'hidden'
          } md:flex`}
        >
          <PresenceList participants={participants} />
        </aside>
      </div>
    </div>
  );
}
