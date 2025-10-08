/**
 * Authentication Middleware
 * Simple API key validation for protecting routes
 */

import logger from '../lib/logger.js';

/**
 * Validate API Key from X-API-Key header
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    logger.warn('API request without API key', {
      path: req.path,
      ip: req.ip,
      method: req.method,
    });

    return res.status(401).json({
      success: false,
      error: 'Missing API key',
      message: 'API key is required. Provide via X-API-Key header or Authorization: Bearer token',
    });
  }

  // For now, just validate that key exists and has reasonable format
  // In production, you would validate against a database or key service
  if (apiKey.length < 10) {
    logger.warn('Invalid API key format', {
      path: req.path,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'API key format is invalid',
    });
  }

  // Attach API key to request for later use
  req.apiKey = apiKey;
  
  logger.debug('API key validated', {
    path: req.path,
    keyPrefix: apiKey.substring(0, 8) + '...',
  });

  next();
}

/**
 * Optional authentication - doesn't fail if no key provided
 */
export function optionalAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey) {
    req.apiKey = apiKey;
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }
  
  next();
}

export default {
  validateApiKey,
  optionalAuth,
};

