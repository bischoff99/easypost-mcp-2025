/**
 * Tracking Namespace - Real-time shipment tracking updates
 * Handles tracking number subscriptions and live updates
 */

import logger from '../../lib/logger.js';
import { cache } from '../../lib/redis.js';

/**
 * Initialize tracking namespace
 * @param {Server} io - Socket.IO server instance
 */
export function trackingNamespace(io) {
  const namespace = io.of('/tracking');

  namespace.on('connection', (socket) => {
    logger.info('Client connected to tracking namespace', {
      socketId: socket.id,
      handshake: socket.handshake.auth,
    });

    /**
     * Subscribe to tracking updates for a specific tracking number
     */
    socket.on('subscribe', async (trackingNumber, callback) => {
      try {
        logger.info('Tracking subscription request', {
          socketId: socket.id,
          trackingNumber,
        });

        // Join room for this tracking number
        await socket.join(`tracking:${trackingNumber}`);

        // Get cached tracking data if available
        const cachedData = await cache.get(`tracking:${trackingNumber}`);

        // Send confirmation
        if (typeof callback === 'function') {
          callback({
            success: true,
            trackingNumber,
            data: cachedData,
          });
        }

        logger.debug('Client subscribed to tracking updates', {
          socketId: socket.id,
          trackingNumber,
        });
      } catch (error) {
        logger.error('Tracking subscription error', {
          socketId: socket.id,
          trackingNumber,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({
            success: false,
            error: error.message,
          });
        }
      }
    });

    /**
     * Unsubscribe from tracking updates
     */
    socket.on('unsubscribe', async (trackingNumber, callback) => {
      try {
        await socket.leave(`tracking:${trackingNumber}`);

        if (typeof callback === 'function') {
          callback({ success: true, trackingNumber });
        }

        logger.debug('Client unsubscribed from tracking updates', {
          socketId: socket.id,
          trackingNumber,
        });
      } catch (error) {
        logger.error('Tracking unsubscription error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Get current tracking status
     */
    socket.on('get-status', async (trackingNumber, callback) => {
      try {
        const cachedData = await cache.get(`tracking:${trackingNumber}`);

        if (typeof callback === 'function') {
          callback({
            success: true,
            trackingNumber,
            data: cachedData,
          });
        }
      } catch (error) {
        logger.error('Get tracking status error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected from tracking namespace', {
        socketId: socket.id,
        reason,
      });
    });

    socket.on('error', (error) => {
      logger.error('Socket error in tracking namespace', {
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  /**
   * Emit tracking update to all subscribed clients
   * @param {string} trackingNumber - Tracking number
   * @param {Object} data - Tracking data
   */
  namespace.emitTrackingUpdate = async (trackingNumber, data) => {
    try {
      // Cache the update
      await cache.set(`tracking:${trackingNumber}`, data, 3600); // 1 hour TTL

      // Emit to room
      namespace.to(`tracking:${trackingNumber}`).emit('update', {
        trackingNumber,
        data,
        timestamp: new Date().toISOString(),
      });

      logger.debug('Tracking update emitted', {
        trackingNumber,
        subscriberCount: namespace.adapter.rooms.get(`tracking:${trackingNumber}`)?.size || 0,
      });
    } catch (error) {
      logger.error('Error emitting tracking update', {
        trackingNumber,
        error: error.message,
      });
    }
  };

  logger.info('Tracking namespace initialized');
  return namespace;
}

