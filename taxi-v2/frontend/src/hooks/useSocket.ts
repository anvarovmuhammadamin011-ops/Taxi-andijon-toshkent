import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Post } from '../lib/types';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [newPost, setNewPost] = useState<Post | null>(null);
  const [removedPostId, setRemovedPostId] = useState<string | null>(null);
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

    socket.on('new-post', (data: Post) => {
      setNewPost(data);
    });

    socket.on('remove-post', (data: string) => {
      setRemovedPostId(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected, newPost, removedPostId };
}