/**
 * Dashboard API Routes
 * Provides real EasyPost account data for the web dashboard
 */

import express from 'express';
import ShipmentService from '../services/ShipmentService.js';
import TrackingService from '../services/TrackingService.js';
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
      ShipmentService.listShipments({ page_size: 100 }),
      TrackingService.listTrackers({ page_size: 100 }),
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
    const result = await ShipmentService.listShipments({
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
    const result = await TrackingService.listTrackers({
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
    
    const tracker = await TrackingService.getTracking(trackingNumber);
    
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
    
    const shipment = await ShipmentService.getShipment(shipmentId);
    
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
    
    const shipment = await ShipmentService.createShipment(shipmentData);
    
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
    
    const shipment = await ShipmentService.buyShipment(shipmentId, rateId);
    
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

