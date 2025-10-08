/**
 * Forge API Routes
 * White-label platform and customer management
 */

import express from 'express';
import logger from '../lib/logger.js';

const router = express.Router();

// In-memory customer storage (replace with database in production)
const customers = new Map();
let customerIdCounter = 1;

/**
 * POST /api/forge/customers
 * Create a new white-label customer account
 */
router.post('/customers', async (req, res) => {
  try {
    const { name, company, email, api_key, configuration } = req.body;
    
    const customerId = `cust_forge_${Date.now()}_${customerIdCounter++}`;
    
    const customer = {
      id: customerId,
      name,
      company,
      email,
      api_key: api_key || `EZAK_forge_${Math.random().toString(36).substring(2, 15)}`,
      status: 'active',
      configuration: configuration || {
        branding: {},
        features: {
          luma_ai_enabled: true,
          carbon_tracking: true,
          advanced_analytics: true,
          white_label_portal: true,
        },
        limits: {
          monthly_shipments: 1000,
          api_calls_per_hour: 1000,
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    customers.set(customerId, customer);
    logger.info('Forge customer created', { customer_id: customerId, company });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    logger.error('Failed to create Forge customer', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/forge/customers/:id
 * Get customer details
 */
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = customers.get(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    logger.error('Failed to get customer', { error: error.message, customer_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/forge/customers/:id
 * Update customer configuration
 */
router.patch('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const customer = customers.get(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Merge updates
    Object.assign(customer, updates);
    customer.updated_at = new Date().toISOString();

    customers.set(id, customer);
    logger.info('Customer updated', { customer_id: id });

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    logger.error('Failed to update customer', { error: error.message, customer_id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/forge/customers
 * List all customers
 */
router.get('/customers', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const allCustomers = Array.from(customers.values());
    const total = allCustomers.length;
    const paginatedCustomers = allCustomers.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Failed to list customers', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

