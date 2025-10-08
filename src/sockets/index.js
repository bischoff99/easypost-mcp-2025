/**
 * Socket.IO Server with Namespaces
 * Implements best practices from Socket.IO documentation
 */

import { Server } from 'socket.io';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { trackingNamespace } from './namespaces/tracking.js';
import { shipmentsNamespace } from './namespaces/shipments.js';
import { notificationsNamespace } from './namespaces/notifications.js';
import { analyticsNamespace } from './namespaces/analytics.js';
import { 
  authenticateSocket, 
  rateLimitSocket, 
  logSocket, 
  attachUserData 
} from './auth-middleware.js';

/**
 * Initialize Socket.IO server with all namespaces
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initializeSocketIO(httpServer) {
  logger.info('Initializing Socket.IO server...');

  const io = new Server(httpServer, {
    cors: config.socketio.cors,
    pingInterval: config.socketio.pingInterval,
    pingTimeout: config.socketio.pingTimeout,
    maxHttpBufferSize: config.socketio.maxHttpBufferSize,
    transports: ['websocket', 'polling'],
  });

  // Apply global middleware to all namespaces
  io.use(rateLimitSocket);
  io.use(logSocket);
  io.use(attachUserData);
  
  logger.info('Socket.IO middleware applied (rate limiting, logging, user data)');

  // Main namespace (root)
  io.on('connection', (socket) => {
    logger.info('Client connected to main namespace', {
      socketId: socket.id,
      transport: socket.conn.transport.name,
    });

    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected from main namespace', {
        socketId: socket.id,
        reason,
      });
    });

    // Basic events
    socket.on('ping', (callback) => {
      logger.debug('Ping received', { socketId: socket.id });
      if (typeof callback === 'function') {
        callback('pong');
      }
    });
  });

  // Initialize namespaces
  trackingNamespace(io);
  shipmentsNamespace(io);
  notificationsNamespace(io);
  
  if (config.features.analytics) {
    analyticsNamespace(io);
  }

  // Global error handler
  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error', {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  logger.info('Socket.IO server initialized successfully', {
    namespaces: [
      '/',
      '/tracking',
      '/shipments',
      '/notifications',
      config.features.analytics ? '/analytics' : null,
    ].filter(Boolean),
  });

  return io;
}

export default initializeSocketIO;

