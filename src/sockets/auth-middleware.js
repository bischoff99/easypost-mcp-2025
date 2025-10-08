/**
 * Socket.IO Authentication Middleware
 * Based on Socket.IO best practices from Context7
 */

import logger from '../lib/logger.js';

/**
 * Authenticate Socket.IO connections
 * Validates token from handshake auth
 */
export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;
  const apiKey = socket.handshake.auth.apiKey;

  // Allow connection without auth for public namespaces
  if (socket.nsp.name === '/') {
    logger.debug('Public namespace connection allowed', {
      socketId: socket.id,
      namespace: socket.nsp.name,
    });
    return next();
  }

  // Require authentication for private namespaces
  if (!token && !apiKey) {
    logger.warn('Socket connection rejected - no credentials', {
      socketId: socket.id,
      namespace: socket.nsp.name,
      ip: socket.handshake.address,
    });
    return next(new Error('Authentication required'));
  }

  // Validate token/API key
  const validApiKey = process.env.EASYPOST_API_KEY || process.env.TEST_EASYPOST_API_KEY;

  if (apiKey && apiKey === validApiKey) {
    socket.data.authenticated = true;
    socket.data.apiKey = apiKey;
    
    logger.info('Socket authenticated with API key', {
      socketId: socket.id,
      namespace: socket.nsp.name,
    });
    
    return next();
  }

  if (token) {
    // In production, validate JWT token here
    // For now, accept any token with valid format
    if (token.length > 10) {
      socket.data.authenticated = true;
      socket.data.token = token;
      
      logger.info('Socket authenticated with token', {
        socketId: socket.id,
        namespace: socket.nsp.name,
      });
      
      return next();
    }
  }

  logger.warn('Socket authentication failed - invalid credentials', {
    socketId: socket.id,
    namespace: socket.nsp.name,
  });

  return next(new Error('Invalid credentials'));
}

/**
 * Rate limiting for socket connections
 */
export function rateLimitSocket(socket, next) {
  const ip = socket.handshake.address;
  const now = Date.now();
  
  // Simple in-memory rate limiting (in production, use Redis)
  if (!global.socketRateLimits) {
    global.socketRateLimits = new Map();
  }

  const limit = global.socketRateLimits.get(ip) || { count: 0, resetTime: now + 60000 };

  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + 60000;
  }

  limit.count++;

  if (limit.count > 100) { // 100 connections per minute
    logger.warn('Socket rate limit exceeded', {
      ip,
      count: limit.count,
    });
    return next(new Error('Rate limit exceeded'));
  }

  global.socketRateLimits.set(ip, limit);
  next();
}

/**
 * Log socket connections and events
 */
export function logSocket(socket, next) {
  logger.info('Socket middleware - connection attempt', {
    socketId: socket.id,
    namespace: socket.nsp.name,
    transport: socket.conn.transport.name,
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
  });

  // Log disconnection
  socket.on('disconnect', (reason) => {
    logger.info('Socket disconnected', {
      socketId: socket.id,
      namespace: socket.nsp.name,
      reason,
    });
  });

  // Log errors
  socket.on('error', (error) => {
    logger.error('Socket error', {
      socketId: socket.id,
      error: error.message,
    });
  });

  next();
}

/**
 * Attach user data to socket
 */
export function attachUserData(socket, next) {
  // Extract user info from handshake
  socket.data.userId = socket.handshake.auth.userId || 'anonymous';
  socket.data.connectedAt = new Date();
  
  logger.debug('User data attached to socket', {
    socketId: socket.id,
    userId: socket.data.userId,
  });

  next();
}

export default {
  authenticateSocket,
  rateLimitSocket,
  logSocket,
  attachUserData,
};
