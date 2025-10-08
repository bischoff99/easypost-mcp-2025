/**
 * Tracking Service
 * Handles shipment tracking and updates
 */

import EasyPostClient from '@easypost/api';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { cache } from '../lib/redis.js';

class TrackingService {
  constructor() {
    this.client = new EasyPostClient(config.easypost.apiKey);
  }

  /**
   * Create a tracker for a tracking code
   * @param {string} trackingCode - Tracking number
   * @param {string} carrier - Carrier code (optional)
   * @returns {Promise<Object>} Tracker data
   */
  async createTracker(trackingCode, carrier = null) {
    const startTime = Date.now();

    try {
      logger.info('Creating tracker', { trackingCode, carrier });

      const trackerData = { tracking_code: trackingCode };
      if (carrier) {
        trackerData.carrier = carrier;
      }

      const tracker = await this.client.Tracker.create(trackerData);

      const duration = Date.now() - startTime;
      logger.logPerformance('createTracker', duration, {
        trackingCode,
        carrier,
      });

      // Cache the tracker
      await cache.set(`tracker:${trackingCode}`, tracker, 300); // 5 minutes TTL

      return tracker;
    } catch (error) {
      logger.error('Failed to create tracker', {
        error: error.message,
        trackingCode,
        carrier,
      });
      throw error;
    }
  }

  /**
   * Get tracking information
   * @param {string} trackingCode - Tracking number
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Tracking data
   */
  async getTracking(trackingCode, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = await cache.get(`tracker:${trackingCode}`);
        if (cached) {
          logger.debug('Tracker retrieved from cache', { trackingCode });
          return cached;
        }
      }

      logger.info('Fetching tracker from API', { trackingCode });

      // Try to retrieve existing tracker
      try {
        const tracker = await this.client.Tracker.retrieve(trackingCode);
        
        // Update cache
        await cache.set(`tracker:${trackingCode}`, tracker, 300);
        
        return tracker;
      } catch (retrieveError) {
        // If tracker doesn't exist, create it
        logger.debug('Tracker not found, creating new one', { trackingCode });
        return await this.createTracker(trackingCode);
      }
    } catch (error) {
      logger.error('Failed to get tracking', {
        error: error.message,
        trackingCode,
      });
      throw error;
    }
  }

  /**
   * List all trackers with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of trackers
   */
  async listTrackers(params = {}) {
    try {
      logger.info('Listing trackers', { params });

      const trackers = await this.client.Tracker.all(params);

      return trackers;
    } catch (error) {
      logger.error('Failed to list trackers', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Get tracking history/events
   * @param {string} trackingCode - Tracking number
   * @returns {Promise<Array>} Tracking events
   */
  async getTrackingHistory(trackingCode) {
    try {
      const tracker = await this.getTracking(trackingCode);

      return {
        trackingCode: tracker.tracking_code,
        status: tracker.status,
        carrier: tracker.carrier,
        signedBy: tracker.signed_by,
        weight: tracker.weight,
        estDeliveryDate: tracker.est_delivery_date,
        trackingDetails: tracker.tracking_details || [],
        carrierDetail: tracker.carrier_detail,
      };
    } catch (error) {
      logger.error('Failed to get tracking history', {
        error: error.message,
        trackingCode,
      });
      throw error;
    }
  }

  /**
   * Check for tracking updates
   * @param {string} trackingCode - Tracking number
   * @returns {Promise<Object>} Updated tracking data
   */
  async checkForUpdates(trackingCode) {
    try {
      // Force refresh from API
      const tracker = await this.getTracking(trackingCode, false);

      logger.info('Tracking update checked', {
        trackingCode,
        status: tracker.status,
      });

      return tracker;
    } catch (error) {
      logger.error('Failed to check tracking updates', {
        error: error.message,
        trackingCode,
      });
      throw error;
    }
  }

  /**
   * Invalidate tracking cache
   * @param {string} trackingCode - Tracking number
   */
  async invalidateCache(trackingCode) {
    await cache.del(`tracker:${trackingCode}`);
    logger.debug('Tracker cache invalidated', { trackingCode });
  }

  /**
   * Parse tracking status to human-readable format
   * @param {string} status - Tracker status
   * @returns {Object} Human-readable status info
   */
  parseStatus(status) {
    const statusMap = {
      pre_transit: {
        label: 'Pre-Transit',
        description: 'Shipment information received',
        color: 'blue',
      },
      in_transit: {
        label: 'In Transit',
        description: 'Package is on its way',
        color: 'yellow',
      },
      out_for_delivery: {
        label: 'Out for Delivery',
        description: 'Package is out for delivery',
        color: 'orange',
      },
      delivered: {
        label: 'Delivered',
        description: 'Package has been delivered',
        color: 'green',
      },
      available_for_pickup: {
        label: 'Available for Pickup',
        description: 'Package is ready for pickup',
        color: 'purple',
      },
      return_to_sender: {
        label: 'Return to Sender',
        description: 'Package is being returned',
        color: 'red',
      },
      failure: {
        label: 'Delivery Failed',
        description: 'Delivery attempt failed',
        color: 'red',
      },
      cancelled: {
        label: 'Cancelled',
        description: 'Shipment has been cancelled',
        color: 'gray',
      },
      error: {
        label: 'Error',
        description: 'Tracking error occurred',
        color: 'red',
      },
      unknown: {
        label: 'Unknown',
        description: 'Status is unknown',
        color: 'gray',
      },
    };

    return statusMap[status] || statusMap.unknown;
  }
}

export default new TrackingService();

