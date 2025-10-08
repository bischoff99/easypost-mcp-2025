/**
 * GraphQL Resolvers
 * Version: 4.2.0
 * 
 * Connects GraphQL schema to existing service layer
 * Uses existing ShipmentService and TrackingService
 */

import shipmentService from '../../services/ShipmentService.js';
import trackingService from '../../services/TrackingService.js';
import logger from '../../lib/logger.js';

/**
 * Authentication helper
 * Throws error if no valid token in context
 */
function requireAuth(context) {
  if (!context.token) {
    throw new Error('Authentication required. Please provide X-API-Key header.');
  }
  return context.token;
}

/**
 * Query Resolvers
 */
const Query = {
  // Health & Status
  health: async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  },

  apiStatus: async () => {
    return {
      status: 'operational',
      version: '4.2.0',
      timestamp: new Date().toISOString(),
    };
  },

  // Shipments
  shipment: async (_, { id }, context) => {
    requireAuth(context);
    try {
      const shipment = await shipmentService.getShipment(id);
      return shipment;
    } catch (error) {
      logger.error('GraphQL shipment query error:', error);
      throw new Error(`Failed to fetch shipment: ${error.message}`);
    }
  },

  shipments: async (_, { limit = 10, offset = 0, status }, context) => {
    requireAuth(context);
    try {
      const shipments = await shipmentService.listShipments({ 
        limit, 
        offset,
        status 
      });
      return shipments || [];
    } catch (error) {
      logger.error('GraphQL shipments query error:', error);
      return [];
    }
  },

  // Tracking
  tracker: async (_, { id }, context) => {
    requireAuth(context);
    try {
      const tracker = await trackingService.getTracker(id);
      return tracker;
    } catch (error) {
      logger.error('GraphQL tracker query error:', error);
      throw new Error(`Failed to fetch tracker: ${error.message}`);
    }
  },

  trackByCode: async (_, { tracking_code, carrier }, context) => {
    requireAuth(context);
    try {
      const tracker = await trackingService.getByTrackingCode(tracking_code, carrier);
      return tracker;
    } catch (error) {
      logger.error('GraphQL trackByCode query error:', error);
      throw new Error(`Failed to track package: ${error.message}`);
    }
  },

  trackers: async (_, { limit = 10, offset = 0 }, context) => {
    requireAuth(context);
    try {
      const trackers = await trackingService.listTrackers({ limit, offset });
      return trackers || [];
    } catch (error) {
      logger.error('GraphQL trackers query error:', error);
      return [];
    }
  },

  // Analytics
  dashboardStats: async (_, __, context) => {
    // Public endpoint - no auth required for basic stats
    try {
      return {
        total_shipments: 0,
        active_trackers: 0,
        total_claims: 0,
        pending_batches: 0,
        recent_shipments: [],
      };
    } catch (error) {
      logger.error('GraphQL dashboardStats query error:', error);
      return {
        total_shipments: 0,
        active_trackers: 0,
        total_claims: 0,
        pending_batches: 0,
      };
    }
  },

  analytics: async (_, { startDate, endDate }, context) => {
    requireAuth(context);
    try {
      return {
        shipments_created: 0,
        total_cost: 0.0,
        average_delivery_days: 0.0,
        top_carriers: [],
        date_range: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('GraphQL analytics query error:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  },
};

/**
 * Mutation Resolvers
 */
const Mutation = {
  // Shipments
  createShipment: async (_, { input }, context) => {
    requireAuth(context);
    try {
      logger.info('GraphQL createShipment mutation', { input });
      const shipment = await shipmentService.createShipment(input);
      return shipment;
    } catch (error) {
      logger.error('GraphQL createShipment mutation error:', error);
      throw new Error(`Failed to create shipment: ${error.message}`);
    }
  },

  buyShipment: async (_, { id, rate_id }, context) => {
    requireAuth(context);
    try {
      logger.info('GraphQL buyShipment mutation', { id, rate_id });
      const shipment = await shipmentService.buyShipment(id, rate_id);
      return shipment;
    } catch (error) {
      logger.error('GraphQL buyShipment mutation error:', error);
      throw new Error(`Failed to buy shipment: ${error.message}`);
    }
  },

  refundShipment: async (_, { id }, context) => {
    requireAuth(context);
    try {
      logger.info('GraphQL refundShipment mutation', { id });
      const result = await shipmentService.refundShipment(id);
      return {
        success: true,
        refund_id: result.id,
        status: result.status,
        message: 'Refund requested successfully',
      };
    } catch (error) {
      logger.error('GraphQL refundShipment mutation error:', error);
      return {
        success: false,
        status: 'failed',
        message: error.message,
      };
    }
  },

  // Tracking
  createTracker: async (_, { tracking_code, carrier }, context) => {
    requireAuth(context);
    try {
      logger.info('GraphQL createTracker mutation', { tracking_code, carrier });
      const tracker = await trackingService.createTracker({ 
        tracking_code, 
        carrier 
      });
      return tracker;
    } catch (error) {
      logger.error('GraphQL createTracker mutation error:', error);
      throw new Error(`Failed to create tracker: ${error.message}`);
    }
  },

  // Claims
  createClaim: async (_, { input }, context) => {
    requireAuth(context);
    try {
      logger.info('GraphQL createClaim mutation', { input });
      // Placeholder - implement when Claims service is available
      return {
        id: `claim_${Date.now()}`,
        tracking_code: input.tracking_code,
        status: 'pending',
        amount: input.amount,
        type: input.type,
        description: input.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('GraphQL createClaim mutation error:', error);
      throw new Error(`Failed to create claim: ${error.message}`);
    }
  },

  // Forge (White-label)
  createCustomer: async (_, { input }, context) => {
    requireAuth(context);
    try {
      logger.info('GraphQL createCustomer mutation', { input });
      // Placeholder - implement when Forge service is available
      return {
        id: `cust_${Date.now()}`,
        name: input.name,
        email: input.email,
        api_key: `key_${Math.random().toString(36).substring(2, 15)}`,
        created_at: new Date().toISOString(),
        active: true,
      };
    } catch (error) {
      logger.error('GraphQL createCustomer mutation error:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  },
};

/**
 * Export resolvers
 */
export const resolvers = {
  Query,
  Mutation,
};
