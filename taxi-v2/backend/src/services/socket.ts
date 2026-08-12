import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Post } from '../types';
import { getUsers, getUserById, addNotification } from './storage';

class SocketService {
  private io: SocketIOServer | null = null;

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.server.frontendUrls,
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

  // Broadcast new post to all connected clients and create notifications
  broadcastNewPost(post: Post): void {
    if (!this.io) return;
    this.io.emit('new-post', post);

    // Create in-app notifications for users whose defaultRoute matches
    if (post.classification === 'passenger' && !post.isDuplicate) {
      for (const user of getUsers()) {
        const settings = user.settings;
        if (settings && settings.notifications !== false && settings.defaultRoute === post.route) {
          addNotification({
            id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
            userId: user.id,
            postId: post.id,
            route: post.route,
            passengerCount: post.passengerCount,
            text: post.originalText.slice(0, 150),
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  // Broadcast post removal
  broadcastRemovePost(postId: string): void {
    if (!this.io) return;
    this.io.emit('remove-post', postId);
  }
}

export const socketService = new SocketService();
