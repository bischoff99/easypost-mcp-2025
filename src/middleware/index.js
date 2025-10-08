/**
 * Express Middleware Collection
 * Centralized middleware configuration with best practices
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import logger from '../lib/logger.js';

/**
 * Security middleware using Helmet
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

/**
 * CORS middleware
 */
export const corsMiddleware = cors({
  origin: config.socketio.cors.origin,
  credentials: config.socketio.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Compression middleware for response compression
 */
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
});

/**
 * Body parser middleware
 */
export const bodyParserMiddleware = [
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
];

/**
 * Request logging middleware using Morgan
 */
export const requestLoggingMiddleware = morgan(
  (tokens, req, res) => {
    const logData = {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: `${tokens['response-time'](req, res)}ms`,
      contentLength: tokens.res(req, res, 'content-length'),
      userAgent: tokens['user-agent'](req, res),
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request Failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    return null;
  },
  { immediate: false }
);

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Strict rate limiting for sensitive endpoints
 */
export const strictRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many attempts',
    message: 'Too many attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request ID middleware for tracing
 */
export const requestIdMiddleware = (req, res, next) => {
  req.id = req.get('X-Request-Id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-Id', req.id);
  next();
};

/**
 * Request timing middleware
 */
export const requestTimingMiddleware = (req, res, next) => {
  req.startTime = Date.now();
  
  // Capture response finish to log duration
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    
    if (duration > 1000) {
      logger.logPerformance('slow_request', duration, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      });
    }
  });

  next();
};

/**
 * Error handling middleware
 * Must be added last in the middleware chain
 */
export const errorHandlerMiddleware = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    requestId: req.id,
  });

  // Don't leak error details in production
  const errorResponse = {
    error: 'Internal server error',
    message: config.isProduction ? 'An error occurred' : err.message,
    requestId: req.id,
  };

  if (!config.isProduction) {
    errorResponse.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * 404 handler middleware
 */
export const notFoundMiddleware = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    requestId: req.id,
  });

  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
    requestId: req.id,
  });
};

/**
 * Health check middleware
 */
export const healthCheckMiddleware = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
};

/**
 * Apply all standard middleware to Express app
 * @param {Express} app - Express application instance
 */
export function applyStandardMiddleware(app) {
  // Request ID and timing (first)
  app.use(requestIdMiddleware);
  app.use(requestTimingMiddleware);

  // Security
  app.use(securityMiddleware);
  app.use(corsMiddleware);

  // Compression (if enabled)
  if (config.performance.compressionEnabled) {
    app.use(compressionMiddleware);
  }

  // Body parsing
  app.use(...bodyParserMiddleware);

  // Request logging
  app.use(requestLoggingMiddleware);

  // Rate limiting (apply globally or per-route)
  // app.use(rateLimitMiddleware); // Uncomment to apply globally

  logger.info('Standard middleware applied');
}

export default {
  applyStandardMiddleware,
  securityMiddleware,
  corsMiddleware,
  compressionMiddleware,
  bodyParserMiddleware,
  requestLoggingMiddleware,
  rateLimitMiddleware,
  strictRateLimitMiddleware,
  requestIdMiddleware,
  requestTimingMiddleware,
  errorHandlerMiddleware,
  notFoundMiddleware,
  healthCheckMiddleware,
};

