/**
 * Notifications Namespace - Real-time notifications
 * Handles system notifications and alerts
 */

import logger from '../../lib/logger.js';

/**
 * Initialize notifications namespace
 * @param {Server} io - Socket.IO server instance
 */
export function notificationsNamespace(io) {
  const namespace = io.of('/notifications');

  namespace.on('connection', (socket) => {
    logger.info('Client connected to notifications namespace', {
      socketId: socket.id,
    });

    /**
     * Subscribe to user notifications
     */
    socket.on('subscribe', async (userId, callback) => {
      try {
        await socket.join(`notifications:${userId}`);

        if (typeof callback === 'function') {
          callback({ success: true, userId });
        }

        logger.debug('Client subscribed to notifications', {
          socketId: socket.id,
          userId,
        });
      } catch (error) {
        logger.error('Notification subscription error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Mark notification as read
     */
    socket.on('mark-read', async (notificationId, callback) => {
      try {
        // Here you would update notification status in database
        logger.debug('Notification marked as read', {
          socketId: socket.id,
          notificationId,
        });

        if (typeof callback === 'function') {
          callback({ success: true, notificationId });
        }
      } catch (error) {
        logger.error('Mark notification read error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected from notifications namespace', {
        socketId: socket.id,
        reason,
      });
    });
  });

  /**
   * Send notification to user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  namespace.sendNotification = (userId, notification) => {
    namespace.to(`notifications:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Notification sent', { userId, type: notification.type });
  };

  /**
   * Broadcast system notification
   * @param {Object} notification - Notification data
   */
  namespace.broadcastSystemNotification = (notification) => {
    namespace.emit('system-notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    logger.info('System notification broadcasted', { type: notification.type });
  };

  logger.info('Notifications namespace initialized');
  return namespace;
}

