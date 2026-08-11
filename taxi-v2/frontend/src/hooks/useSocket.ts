import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SocketEvent {
  type: string;
  data: any;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new-post', (data: any) => {
      setLastEvent({ type: 'new-post', data });
    });

    socket.on('remove-post', (data: any) => {
      setLastEvent({ type: 'remove-post', data });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected, lastEvent };
}
