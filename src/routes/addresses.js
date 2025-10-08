/**
 * Addresses API Routes
 * Handles address creation and verification
 */

import express from 'express';
import EasyPostClient from '@easypost/api';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { cache } from '../lib/redis.js';

const router = express.Router();
const easypost = new EasyPostClient(config.easypost.apiKey);

/**
 * POST /api/addresses/create
 * Create and validate an address
 */
router.post('/create', async (req, res) => {
  try {
    const addressData = req.body;
    
    logger.info('Creating address', { addressData });
    const address = await easypost.Address.create(addressData);

    res.json({
      success: true,
      data: {
        address_id: address.id,
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        verifications: address.verifications,
      },
    });
  } catch (error) {
    logger.error('Failed to create address', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/addresses/verify
 * Verify an address
 */
router.post('/verify', async (req, res) => {
  try {
    const addressData = req.body;
    
    logger.info('Verifying address', { addressData });
    
    const address = await easypost.Address.create({
      ...addressData,
      verify: ['delivery'],
    });

    res.json({
      success: true,
      data: {
        address_id: address.id,
        verified: address.verifications?.delivery?.success || false,
        errors: address.verifications?.delivery?.errors || [],
        corrected_address: {
          street1: address.street1,
          street2: address.street2,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to verify address', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/addresses/:id
 * Get address details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check cache first
    const cacheKey = `address:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Address from cache', { address_id: id });
      return res.json({
        success: true,
        data: cached,
      });
    }

    logger.info('Fetching address', { address_id: id });
    const address = await easypost.Address.retrieve(id);

    // Cache for 1 hour
    await cache.set(cacheKey, address, 3600);

    res.json({
      success: true,
      data: address,
    });
  } catch (error) {
    logger.error('Failed to get address', { error: error.message, address_id: req.params.id });
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

