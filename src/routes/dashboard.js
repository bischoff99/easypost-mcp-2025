/**
 * Dashboard API Routes
 * Provides real EasyPost account data for the web dashboard
 */

import express from 'express';
import shipmentService from '../services/ShipmentService.js';
import trackingService from '../services/TrackingService.js';
import logger from '../lib/logger.js';
import { cache } from '../lib/redis.js';

const router = express.Router();

/**
 * Get dashboard overview statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'dashboard:stats';
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Dashboard stats from cache');
      return res.json(cached);
    }

    // Fetch real data from EasyPost
    const [shipments, trackers] = await Promise.all([
      shipmentService.listShipments({ page_size: 100 }),
      trackingService.listTrackers({ page_size: 100 }),
    ]);

    // Calculate statistics
    const stats = {
      totalShipments: shipments.shipments?.length || 0,
      activeTracking: trackers.trackers?.filter(t => 
        ['in_transit', 'out_for_delivery'].includes(t.status)
      ).length || 0,
      delivered: trackers.trackers?.filter(t => t.status === 'delivered').length || 0,
      pending: shipments.shipments?.filter(s => !s.postage_label).length || 0,
      
      // Calculate total cost (from bought shipments)
      totalCost: shipments.shipments
        ?.filter(s => s.selected_rate)
        ?.reduce((sum, s) => sum + parseFloat(s.selected_rate.rate || 0), 0)
        .toFixed(2) || '0.00',
      
      // Get today's shipments
      todayShipments: shipments.shipments?.filter(s => {
        const created = new Date(s.created_at);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length || 0,
      
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, stats, 300);

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get dashboard stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/dashboard/recent
 * Get recent shipments and trackers
 */
router.get('/recent', async (req, res) => {
  try {
    const cacheKey = 'dashboard:recent';
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Recent data from cache');
      return res.json(cached);
    }

    // Fetch recent data
    const [shipments, trackers] = await Promise.all([
      shipmentService.listShipments({ page_size: 10 }),
      trackingService.listTrackers({ page_size: 10 }),
    ]);

    const recentData = {
      shipments: shipments.shipments?.slice(0, 10).map(s => ({
        id: s.id,
        to: s.to_address?.city || 'Unknown',
        carrier: s.selected_rate?.carrier || 'N/A',
        status: s.postage_label ? 'purchased' : 'created',
        created: s.created_at,
      })) || [],
      trackers: trackers.trackers?.slice(0, 10).map(t => ({
        id: t.id,
        tracking_code: t.tracking_code,
        carrier: t.carrier,
        status: t.status,
        updated: t.updated_at,
      })) || [],
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, recentData, 120);

    res.json(recentData);
  } catch (error) {
    logger.error('Failed to fetch recent data', { error: error.message });
    
    // Return empty arrays on error
    res.json({
      shipments: [],
      trackers: [],
    });
  }
});

/**
 * GET /api/dashboard/activities
 * Get recent activity log
 */
router.get('/activities', async (req, res) => {
  try {
    const cacheKey = 'dashboard:activities';
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Activities from cache');
      return res.json(cached);
    }

    // Fetch recent shipments and trackers for activity log
    const [shipments, trackers] = await Promise.all([
      shipmentService.listShipments({ page_size: 20 }),
      trackingService.listTrackers({ page_size: 20 }),
    ]);

    // Combine and create activity log
    const activities = [];

    // Add shipment activities
    shipments.shipments?.forEach(s => {
      activities.push({
        id: `ship-${s.id}`,
        type: 'shipment',
        action: s.postage_label ? 'Label purchased' : 'Shipment created',
        description: `${s.to_address?.city || 'Unknown'} via ${s.selected_rate?.carrier || 'N/A'}`,
        timestamp: s.created_at || new Date().toISOString(),
        icon: '📦',
      });
    });

    // Add tracking activities
    trackers.trackers?.forEach(t => {
      const statusIcons = {
        'pre_transit': '🏭',
        'in_transit': '🚚',
        'out_for_delivery': '📬',
        'delivered': '✅',
        'returned': '↩️',
        'failure': '❌',
      };

      activities.push({
        id: `track-${t.id}`,
        type: 'tracking',
        action: 'Status updated',
        description: `${t.tracking_code} - ${t.status}`,
        timestamp: t.updated_at || new Date().toISOString(),
        icon: statusIcons[t.status] || '📍',
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to 50 most recent
    const recentActivities = {
      activities: activities.slice(0, 50),
      total: activities.length,
    };

    // Cache for 1 minute
    await cache.set(cacheKey, recentActivities, 60);

    res.json(recentActivities);
  } catch (error) {
    logger.error('Failed to fetch activities', { error: error.message });
    
    // Return empty array on error
    res.json({
      activities: [],
      total: 0,
    });
  }
});

/**
 * Get recent shipments
 */
router.get('/shipments/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const cacheKey = `dashboard:shipments:recent:${limit}`;
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch from EasyPost
    const result = await shipmentService.listShipments({
      page_size: limit,
    });

    const shipments = (result.shipments || []).map(s => ({
      id: s.id,
      tracking_code: s.tracking_code,
      status: s.status,
      from: {
        city: s.from_address?.city,
        state: s.from_address?.state,
      },
      to: {
        city: s.to_address?.city,
        state: s.to_address?.state,
      },
      carrier: s.selected_rate?.carrier || 'Not selected',
      service: s.selected_rate?.service || 'Not selected',
      rate: s.selected_rate?.rate || '0.00',
      created_at: s.created_at,
      label_url: s.postage_label?.label_url,
    }));

    const response = {
      shipments,
      count: shipments.length,
      has_more: result.has_more,
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, response, 120);

    res.json(response);
  } catch (error) {
    logger.error('Failed to get recent shipments', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch shipments',
      message: error.message,
    });
  }
});

/**
 * Get active tracking information
 */
router.get('/tracking/active', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const cacheKey = `dashboard:tracking:active:${limit}`;
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch from EasyPost
    const result = await trackingService.listTrackers({
      page_size: limit,
    });

    const trackers = (result.trackers || []).map(t => ({
      id: t.id,
      tracking_code: t.tracking_code,
      status: t.status,
      status_detail: t.status_detail,
      carrier: t.carrier,
      signed_by: t.signed_by,
      weight: t.weight,
      est_delivery_date: t.est_delivery_date,
      tracking_details: t.tracking_details?.slice(0, 5), // Last 5 events
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const response = {
      trackers,
      count: trackers.length,
      has_more: result.has_more,
      stats: {
        in_transit: trackers.filter(t => t.status === 'in_transit').length,
        out_for_delivery: trackers.filter(t => t.status === 'out_for_delivery').length,
        delivered: trackers.filter(t => t.status === 'delivered').length,
        pre_transit: trackers.filter(t => t.status === 'pre_transit').length,
      },
    };

    // Cache for 1 minute
    await cache.set(cacheKey, response, 60);

    res.json(response);
  } catch (error) {
    logger.error('Failed to get active tracking', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch tracking',
      message: error.message,
    });
  }
});

/**
 * Get tracking details for specific tracking number
 */
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const tracker = await trackingService.getTracking(trackingNumber);
    
    res.json({
      success: true,
      tracker: {
        tracking_code: tracker.tracking_code,
        status: tracker.status,
        carrier: tracker.carrier,
        signed_by: tracker.signed_by,
        weight: tracker.weight,
        est_delivery_date: tracker.est_delivery_date,
        tracking_details: tracker.tracking_details,
        public_url: tracker.public_url,
      },
    });
  } catch (error) {
    logger.error('Failed to get tracking details', {
      trackingNumber: req.params.trackingNumber,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get shipment details
 */
router.get('/shipments/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    const shipment = await shipmentService.getShipment(shipmentId);
    
    res.json({
      success: true,
      shipment: {
        id: shipment.id,
        tracking_code: shipment.tracking_code,
        status: shipment.status,
        from_address: shipment.from_address,
        to_address: shipment.to_address,
        parcel: shipment.parcel,
        rates: shipment.rates,
        selected_rate: shipment.selected_rate,
        postage_label: shipment.postage_label,
        created_at: shipment.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to get shipment details', {
      shipmentId: req.params.shipmentId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create new shipment
 */
router.post('/shipments/create', async (req, res) => {
  try {
    const shipmentData = req.body;
    
    logger.info('Creating shipment from dashboard', { shipmentData });
    
    const shipment = await shipmentService.createShipment(shipmentData);
    
    res.json({
      success: true,
      shipment: {
        id: shipment.id,
        tracking_code: shipment.tracking_code,
        rates: shipment.rates,
        message: 'Shipment created successfully',
      },
    });
  } catch (error) {
    logger.error('Failed to create shipment from dashboard', {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Buy shipment label
 */
router.post('/shipments/:shipmentId/buy', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { rateId } = req.body;
    
    logger.info('Buying shipment from dashboard', { shipmentId, rateId });
    
    const shipment = await shipmentService.buyShipment(shipmentId, rateId);
    
    res.json({
      success: true,
      shipment: {
        id: shipment.id,
        tracking_code: shipment.tracking_code,
        postage_label: shipment.postage_label,
        selected_rate: shipment.selected_rate,
        message: 'Label purchased successfully',
      },
    });
  } catch (error) {
    logger.error('Failed to buy shipment from dashboard', {
      shipmentId: req.params.shipmentId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

