import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (!user?.username || !token) {
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
      }
      return;
    }

    // Determine WebSocket URL based on API_BASE
    const API_BASE = import.meta.env.VITE_API_BASE || '/api';
    const WS_URL = API_BASE.replace('/api', '') + '/ws';
    // Use absolute URL if missing origin for SockJS
    const finalWsUrl = WS_URL.startsWith('http') ? WS_URL : window.location.origin + WS_URL;

    const client = new Client({
      webSocketFactory: () => new SockJS(finalWsUrl),
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}` // If backend requires token
      },
      onConnect: () => {
        console.log('Connected to WebSocket for notifications!');
        client.subscribe(`/user/${user.username}/queue/notifications`, (message) => {
          if (message.body) {
            const notification = JSON.parse(message.body);
            toast(`🔔 ${notification.content}`, {
              duration: 5000,
              position: 'top-right',
              style: { 
                background: 'var(--bg-card)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontWeight: 500
              }
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [user, token]);

  return (
    <NotificationContext.Provider value={{ stompClient }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
