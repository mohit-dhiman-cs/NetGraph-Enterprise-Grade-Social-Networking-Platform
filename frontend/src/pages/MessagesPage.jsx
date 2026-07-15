import { useEffect, useState, useRef } from 'react';
import { messageApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { Send } from 'lucide-react';

export default function MessagesPage() {
  const { user }  = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [targetId, setTargetId] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [typing, setTyping]     = useState(false);
  const stompRef = useRef(null);
  const bottomRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => {
        const wsBase = (import.meta.env.VITE_API_BASE || '/api').replace('/api', '/ws');
        return new SockJS(wsBase);
      },
      onConnect: () => {
        client.subscribe(`/user/${user.userId}/queue/messages`, (msg) => {
          const body = JSON.parse(msg.body);
          setMessages(prev => [...prev, body]);
        });
        client.subscribe(`/user/${user.userId}/queue/typing`, (msg) => {
          const body = JSON.parse(msg.body);
          if (body.from !== user.userId) setTyping(body.typing === 'true');
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => client.deactivate();
  }, [user.userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openChat = async (uid) => {
    setActiveChat(uid);
    try { const r = await messageApi.getConversation(uid); setMessages(r.data); }
    catch { setMessages([]); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ senderId: user.userId, receiverId: activeChat, content: input }),
    });
    setInput('');
  };

  const sendTyping = (isTyping) => {
    stompRef.current?.connected && stompRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ senderId: user.userId, receiverId: activeChat, typing: String(isTyping) }),
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar: conversations */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Messages</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="User ID to chat…" value={targetId}
            onChange={e => setTargetId(e.target.value)} style={{ flex: 1, fontSize: '0.8rem' }} />
          <button className="btn btn-primary btn-sm" onClick={() => openChat(targetId)} disabled={!targetId.trim()}>Chat</button>
        </div>
      </div>

      {/* Chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{ position: 'relative' }}>
                {activeChat[0]?.toUpperCase()}
                <div className="online-dot" />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>User · {activeChat.slice(0, 12)}…</div>
                {typing ? <div style={{ fontSize: '0.78rem', color: 'var(--success)' }}>typing…</div>
                         : <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Online</div>}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((m, i) => {
                const isMine = m.sender?.id === user.userId || m.sender === user.userId;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }} className="fade-in">
                    <div className={`msg-bubble ${isMine ? 'sent' : 'received'}`}>{m.content}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Type a message…" value={input}
                onChange={e => { setInput(e.target.value); sendTyping(!!e.target.value); }}
                onBlur={() => sendTyping(false)} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-icon" type="submit"><Send size={16} /></button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <h3>Select a conversation</h3>
            <p>Enter a User ID on the left to start a real-time chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
