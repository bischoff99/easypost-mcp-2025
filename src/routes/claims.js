/**
 * Claims API Routes
 * Insurance claim management and processing
 */

import express from 'express';
import EasyPostClient from '@easypost/api';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { cache } from '../lib/redis.js';

const router = express.Router();
const easypost = new EasyPostClient(config.easypost.apiKey);

// In-memory claims storage (replace with database in production)
const claims = new Map();
let claimIdCounter = 1;

/**
 * POST /api/claims/create
 * Create a new insurance claim
 */
router.post('/create', async (req, res) => {
  try {
    const { type, tracking_code, description, claimed_amount, contact_email, attachments } = req.body;
    
    const claimId = `claim_${Date.now()}_${claimIdCounter++}`;
    
    const claim = {
      id: claimId,
      type,
      tracking_code,
      description,
      claimed_amount,
      contact_email,
      attachments: attachments || [],
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_analysis: {
        risk_assessment: 'low',
        fraud_indicators: 'none_detected',
        evidence_quality: 'good',
        processing_priority: 'standard',
        estimated_resolution_days: 7,
      },
    };

    claims.set(claimId, claim);
    logger.info('Claim created', { claim_id: claimId, type });

    res.status(201).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    logger.error('Failed to create claim', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/claims/list
 * List all claims with pagination
 */
router.get('/list', async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    
    let allClaims = Array.from(claims.values());
    
    if (status) {
      allClaims = allClaims.filter(c => c.status === status);
    }

    const total = allClaims.length;
    const paginatedClaims = allClaims.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: paginatedClaims,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    logger.error('Failed to list claims', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/claims/:id
 * Get claim details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const claim = claims.get(id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found',
      });
    }

    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    logger.error('Failed to get claim', { error: error.message, claim_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/claims/:id/update
 * Update claim status
 */
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const claim = claims.get(id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found',
      });
    }

    claim.status = status || claim.status;
    claim.updated_at = new Date().toISOString();
    if (notes) {
      claim.notes = notes;
    }

    claims.set(id, claim);
    logger.info('Claim updated', { claim_id: id, status });

    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    logger.error('Failed to update claim', { error: error.message, claim_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

