/**
 * Shipments API Routes
 * Handles all shipment-related endpoints
 */

import express from 'express';
import shipmentService from '../services/ShipmentService.js';
import logger from '../lib/logger.js';

const router = express.Router();

/**
 * POST /api/shipments/create
 * Create a new shipment with rate shopping
 */
router.post('/create', async (req, res) => {
  try {
    const { to_address, from_address, parcel, options } = req.body;
    
    const shipment = await shipmentService.createShipment({
      to_address,
      from_address,
      parcel,
      options,
    });

    res.json({
      success: true,
      data: {
        shipment_id: shipment.id,
        rates: shipment.rates,
        created_at: shipment.created_at,
        status: shipment.status,
      },
    });
  } catch (error) {
    logger.error('Failed to create shipment', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/shipments/:id/buy
 * Purchase a shipment with selected rate
 */
router.post('/:id/buy', async (req, res) => {
  try {
    const { id } = req.params;
    const { rate_id } = req.body;

    const shipment = await shipmentService.buyShipment(id, rate_id);

    res.json({
      success: true,
      data: {
        shipment_id: shipment.id,
        tracking_code: shipment.tracking_code,
        label_url: shipment.postage_label?.label_url,
        selected_rate: shipment.selected_rate,
      },
    });
  } catch (error) {
    logger.error('Failed to buy shipment', { error: error.message, shipment_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/shipments/:id
 * Get shipment details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.getShipment(id);

    res.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    logger.error('Failed to get shipment', { error: error.message, shipment_id: req.params.id });
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/shipments/list
 * List shipments with pagination
 */
router.get('/list', async (req, res) => {
  try {
    const { page_size, before_id, after_id } = req.query;
    
    const params = {};
    if (page_size) params.page_size = parseInt(page_size, 10);
    if (before_id) params.before_id = before_id;
    if (after_id) params.after_id = after_id;

    const shipments = await shipmentService.listShipments(params);

    res.json({
      success: true,
      data: shipments,
    });
  } catch (error) {
    logger.error('Failed to list shipments', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/shipments/:id/refund
 * Request refund for a shipment
 */
router.post('/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await shipmentService.refundShipment(id);

    res.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    logger.error('Failed to refund shipment', { error: error.message, shipment_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/shipments/:id/label
 * Get shipment label
 */
router.get('/:id/label', async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    
    const label = await shipmentService.getLabel(id, format);

    res.json({
      success: true,
      data: label,
    });
  } catch (error) {
    logger.error('Failed to get label', { error: error.message, shipment_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

