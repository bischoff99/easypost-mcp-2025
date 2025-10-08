/**
 * Batch API Routes
 * Bulk shipment processing and management
 */

import express from 'express';
import shipmentService from '../services/ShipmentService.js';
import logger from '../lib/logger.js';

const router = express.Router();

// In-memory batch storage (replace with database in production)
const batches = new Map();
let batchIdCounter = 1;

/**
 * POST /api/batch/create
 * Create a batch of shipments
 */
router.post('/create', async (req, res) => {
  try {
    const { shipments } = req.body;
    
    if (!shipments || !Array.isArray(shipments)) {
      return res.status(400).json({
        success: false,
        error: 'shipments array is required',
      });
    }

    const batchId = `batch_${Date.now()}_${batchIdCounter++}`;
    
    const batch = {
      id: batchId,
      total_shipments: shipments.length,
      status: 'processing',
      created_at: new Date().toISOString(),
      completed_at: null,
      results: {
        successful: 0,
        failed: 0,
        pending: shipments.length,
      },
      shipments: [],
    };

    batches.set(batchId, batch);

    // Process shipments asynchronously
    processShipmentsBatch(batchId, shipments);

    res.status(202).json({
      success: true,
      data: {
        batch_id: batchId,
        status: 'processing',
        total_shipments: shipments.length,
        message: 'Batch processing started. Use GET /api/batch/:id/status to check progress',
      },
    });
  } catch (error) {
    logger.error('Failed to create batch', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/batch/:id
 * Get batch details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const batch = batches.get(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    logger.error('Failed to get batch', { error: error.message, batch_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/batch/:id/status
 * Get batch processing status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const batch = batches.get(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.json({
      success: true,
      data: {
        batch_id: batch.id,
        status: batch.status,
        results: batch.results,
        progress: {
          total: batch.total_shipments,
          completed: batch.results.successful + batch.results.failed,
          percentage: Math.round(((batch.results.successful + batch.results.failed) / batch.total_shipments) * 100),
        },
        created_at: batch.created_at,
        completed_at: batch.completed_at,
      },
    });
  } catch (error) {
    logger.error('Failed to get batch status', { error: error.message, batch_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Helper function to process shipments asynchronously
 */
async function processShipmentsBatch(batchId, shipments) {
  const batch = batches.get(batchId);
  if (!batch) return;

  logger.info('Processing batch', { batch_id: batchId, count: shipments.length });

  for (const shipmentData of shipments) {
    try {
      const shipment = await shipmentService.createShipment(shipmentData);
      batch.shipments.push({
        success: true,
        shipment_id: shipment.id,
        tracking_code: shipment.tracking_code,
      });
      batch.results.successful++;
      batch.results.pending--;
    } catch (error) {
      batch.shipments.push({
        success: false,
        error: error.message,
        input: shipmentData,
      });
      batch.results.failed++;
      batch.results.pending--;
    }
  }

  batch.status = 'completed';
  batch.completed_at = new Date().toISOString();
  batches.set(batchId, batch);

  logger.info('Batch processing completed', {
    batch_id: batchId,
    successful: batch.results.successful,
    failed: batch.results.failed,
  });
}

export default router;

