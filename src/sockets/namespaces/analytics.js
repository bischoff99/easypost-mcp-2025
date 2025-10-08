/**
 * Analytics Namespace - Real-time analytics and metrics
 * Handles live dashboard updates
 */

import logger from '../../lib/logger.js';

/**
 * Initialize analytics namespace
 * @param {Server} io - Socket.IO server instance
 */
export function analyticsNamespace(io) {
  const namespace = io.of('/analytics');

  namespace.on('connection', (socket) => {
    logger.info('Client connected to analytics namespace', {
      socketId: socket.id,
    });

    /**
     * Subscribe to analytics updates
     */
    socket.on('subscribe', async (type, callback) => {
      try {
        await socket.join(`analytics:${type}`);

        if (typeof callback === 'function') {
          callback({ success: true, type });
        }

        logger.debug('Client subscribed to analytics', {
          socketId: socket.id,
          type,
        });
      } catch (error) {
        logger.error('Analytics subscription error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected from analytics namespace', {
        socketId: socket.id,
        reason,
      });
    });
  });

  /**
   * Emit analytics update
   * @param {string} type - Analytics type (e.g., 'shipments', 'costs')
   * @param {Object} data - Analytics data
   */
  namespace.emitAnalyticsUpdate = (type, data) => {
    namespace.to(`analytics:${type}`).emit('update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Analytics update emitted', { type });
  };

  logger.info('Analytics namespace initialized');
  return namespace;
}

