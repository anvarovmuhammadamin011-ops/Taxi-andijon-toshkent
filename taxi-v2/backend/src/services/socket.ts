import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { Post } from '../types';

class SocketService {
  private io: IOServer | null = null;

  initialize(server: HttpServer, frontendUrls: string[]): void {
    this.io = new IOServer(server, {
      cors: { origin: frontendUrls, credentials: true },
    });
    logger_info('Socket.IO initialized');
  }

  broadcastNewPost(post: Post): void {
    this.io?.emit('new-post', post);
  }
  broadcastRemovePost(postId: string): void {
    this.io?.emit('remove-post', postId);
  }
}

function logger_info(...a: any[]): void {
  console.log(`[${new Date().toISOString()}] INFO:`, ...a);
}

export const socketService = new SocketService();
