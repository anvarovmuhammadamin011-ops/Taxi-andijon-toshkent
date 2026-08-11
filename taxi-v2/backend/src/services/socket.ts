import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Post } from '../types';

class SocketService {
  private io: SocketIOServer | null = null;

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.server.frontendUrl,
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.debug(`Client disconnected: ${socket.id}`);
      });
    });

    logger.info('Socket.IO initialized');
  }

  // Broadcast new post to all connected clients
  broadcastNewPost(post: Post): void {
    if (!this.io) return;
    this.io.emit('new-post', post);
  }

  // Broadcast post removal
  broadcastRemovePost(postId: string): void {
    if (!this.io) return;
    this.io.emit('remove-post', postId);
  }
}

export const socketService = new SocketService();
