/**
 * Shipments Namespace - Real-time shipment creation and updates
 * Handles shipment lifecycle events
 */

import logger from '../../lib/logger.js';

/**
 * Initialize shipments namespace
 * @param {Server} io - Socket.IO server instance
 */
export function shipmentsNamespace(io) {
  const namespace = io.of('/shipments');

  namespace.on('connection', (socket) => {
    logger.info('Client connected to shipments namespace', {
      socketId: socket.id,
      handshake: socket.handshake.auth,
    });

    /**
     * Subscribe to user's shipment updates
     */
    socket.on('subscribe-user', async (userId, callback) => {
      try {
        await socket.join(`user:${userId}`);

        if (typeof callback === 'function') {
          callback({ success: true, userId });
        }

        logger.debug('Client subscribed to user shipments', {
          socketId: socket.id,
          userId,
        });
      } catch (error) {
        logger.error('User subscription error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Create shipment request with real-time updates
     */
    socket.on('create-shipment', async (shipmentData, callback) => {
      try {
        logger.info('Shipment creation request', {
          socketId: socket.id,
          shipmentData,
        });

        // Emit progress update
        socket.emit('creation-progress', {
          status: 'processing',
          message: 'Creating shipment...',
        });

        // Here you would call the shipment service
        // For now, just acknowledge
        if (typeof callback === 'function') {
          callback({
            success: true,
            message: 'Shipment creation initiated',
          });
        }
      } catch (error) {
        logger.error('Shipment creation error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Get shipment status
     */
    socket.on('get-shipment', async (shipmentId, callback) => {
      try {
        // Here you would fetch shipment data
        if (typeof callback === 'function') {
          callback({
            success: true,
            shipmentId,
            data: null, // Replace with actual data
          });
        }
      } catch (error) {
        logger.error('Get shipment error', {
          socketId: socket.id,
          error: error.message,
        });

        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected from shipments namespace', {
        socketId: socket.id,
        reason,
      });
    });
  });

  /**
   * Emit shipment update to user
   * @param {string} userId - User ID
   * @param {Object} shipmentData - Shipment data
   */
  namespace.emitShipmentUpdate = (userId, shipmentData) => {
    namespace.to(`user:${userId}`).emit('shipment-update', {
      ...shipmentData,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Shipment update emitted', { userId });
  };

  logger.info('Shipments namespace initialized');
  return namespace;
}

