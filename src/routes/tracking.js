/**
 * Tracking API Routes
 * Handles all tracking-related endpoints
 */

import express from 'express';
import TrackingService from '../services/TrackingService.js';
import logger from '../lib/logger.js';

const router = express.Router();
const trackingService = new TrackingService();

/**
 * POST /api/tracking/create
 * Create a new tracker
 */
router.post('/create', async (req, res) => {
  try {
    const { tracking_code, carrier } = req.body;
    
    const tracker = await trackingService.createTracker({
      tracking_code,
      carrier,
    });

    res.json({
      success: true,
      data: {
        tracker_id: tracker.id,
        tracking_code: tracker.tracking_code,
        status: tracker.status,
        carrier: tracker.carrier,
      },
    });
  } catch (error) {
    logger.error('Failed to create tracker', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tracking/:id
 * Get tracker details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tracker = await trackingService.getTracker(id);

    res.json({
      success: true,
      data: tracker,
    });
  } catch (error) {
    logger.error('Failed to get tracker', { error: error.message, tracker_id: req.params.id });
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tracking/list
 * List trackers with pagination
 */
router.get('/list', async (req, res) => {
  try {
    const { page_size, before_id, after_id } = req.query;
    
    const params = {};
    if (page_size) params.page_size = parseInt(page_size, 10);
    if (before_id) params.before_id = before_id;
    if (after_id) params.after_id = after_id;

    const trackers = await trackingService.listTrackers(params);

    res.json({
      success: true,
      data: trackers,
    });
  } catch (error) {
    logger.error('Failed to list trackers', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tracking/:id/history
 * Get tracking history for a tracker
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await trackingService.getTrackingHistory(id);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Failed to get tracking history', { error: error.message, tracker_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

