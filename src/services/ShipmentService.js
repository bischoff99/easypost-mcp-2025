/**
 * Shipment Service
 * Handles all shipment-related business logic
 */

import EasyPostClient from '@easypost/api';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { cache } from '../lib/redis.js';

class ShipmentService {
  constructor() {
    this.client = new EasyPostClient(config.easypost.apiKey);
  }

  /**
   * Create a new shipment
   * @param {Object} shipmentData - Shipment data
   * @returns {Promise<Object>} Created shipment
   */
  async createShipment(shipmentData) {
    const startTime = Date.now();
    
    try {
      logger.info('Creating shipment', { shipmentData });

      const shipment = await this.client.Shipment.create(shipmentData);

      const duration = Date.now() - startTime;
      logger.logPerformance('createShipment', duration, {
        shipmentId: shipment.id,
      });

      // Cache the shipment
      await cache.set(`shipment:${shipment.id}`, shipment, 3600);

      return shipment;
    } catch (error) {
      logger.error('Failed to create shipment', {
        error: error.message,
        stack: error.stack,
        shipmentData,
      });
      throw error;
    }
  }

  /**
   * Get shipment by ID
   * @param {string} shipmentId - Shipment ID
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Shipment data
   */
  async getShipment(shipmentId, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = await cache.get(`shipment:${shipmentId}`);
        if (cached) {
          logger.debug('Shipment retrieved from cache', { shipmentId });
          return cached;
        }
      }

      logger.info('Fetching shipment from API', { shipmentId });
      const shipment = await this.client.Shipment.retrieve(shipmentId);

      // Update cache
      await cache.set(`shipment:${shipmentId}`, shipment, 3600);

      return shipment;
    } catch (error) {
      logger.error('Failed to get shipment', {
        error: error.message,
        shipmentId,
      });
      throw error;
    }
  }

  /**
   * Buy shipment with selected rate
   * @param {string} shipmentId - Shipment ID
   * @param {string} rateId - Rate ID to purchase
   * @returns {Promise<Object>} Updated shipment with postage label
   */
  async buyShipment(shipmentId, rateId) {
    const startTime = Date.now();

    try {
      logger.info('Buying shipment', { shipmentId, rateId });

      const shipment = await this.client.Shipment.buy(shipmentId, { rate: { id: rateId } });

      const duration = Date.now() - startTime;
      logger.logPerformance('buyShipment', duration, {
        shipmentId,
        rateId,
      });

      // Update cache
      await cache.set(`shipment:${shipmentId}`, shipment, 3600);

      // Cache tracking number
      if (shipment.tracking_code) {
        await cache.set(
          `tracking:${shipment.tracking_code}`,
          {
            shipmentId: shipment.id,
            carrier: shipment.selected_rate?.carrier,
            service: shipment.selected_rate?.service,
          },
          86400 // 24 hours
        );
      }

      return shipment;
    } catch (error) {
      logger.error('Failed to buy shipment', {
        error: error.message,
        shipmentId,
        rateId,
      });
      throw error;
    }
  }

  /**
   * List shipments with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of shipments
   */
  async listShipments(params = {}) {
    try {
      logger.info('Listing shipments', { params });

      const shipments = await this.client.Shipment.all(params);

      return shipments;
    } catch (error) {
      logger.error('Failed to list shipments', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Refund a shipment
   * @param {string} shipmentId - Shipment ID
   * @returns {Promise<Object>} Refund result
   */
  async refundShipment(shipmentId) {
    try {
      logger.info('Refunding shipment', { shipmentId });

      const refund = await this.client.Shipment.refund(shipmentId);

      // Invalidate cache
      await cache.del(`shipment:${shipmentId}`);

      return refund;
    } catch (error) {
      logger.error('Failed to refund shipment', {
        error: error.message,
        shipmentId,
      });
      throw error;
    }
  }

  /**
   * Generate label for shipment
   * @param {string} shipmentId - Shipment ID
   * @param {Object} options - Label options (format, etc.)
   * @returns {Promise<Object>} Label data
   */
  async generateLabel(shipmentId, options = {}) {
    try {
      logger.info('Generating label', { shipmentId, options });

      const shipment = await this.getShipment(shipmentId);

      if (!shipment.postage_label) {
        throw new Error('Shipment has not been purchased yet');
      }

      return {
        labelUrl: shipment.postage_label.label_url,
        labelPdfUrl: shipment.postage_label.label_pdf_url,
        trackingCode: shipment.tracking_code,
      };
    } catch (error) {
      logger.error('Failed to generate label', {
        error: error.message,
        shipmentId,
      });
      throw error;
    }
  }

  /**
   * Invalidate shipment cache
   * @param {string} shipmentId - Shipment ID
   */
  async invalidateCache(shipmentId) {
    await cache.del(`shipment:${shipmentId}`);
    logger.debug('Shipment cache invalidated', { shipmentId });
  }
}

export default new ShipmentService();

