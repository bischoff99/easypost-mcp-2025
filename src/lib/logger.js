/**
 * Structured Winston Logger with Multiple Transports
 * Implements best practices for production logging
 */

import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '../../', config.logging.dir);
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for development environment
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (service) msg += ` [${service}]`;
    msg += `: ${message}`;
    
    // Add metadata if present
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return msg + metaStr;
  })
);

/**
 * Custom format for production environment (JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports based on environment
 */
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true,
  }),

  // Error log file
  new winston.transports.File({
    filename: join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    handleExceptions: true,
    handleRejections: true,
  }),

  // Combined log file
  new winston.transports.File({
    filename: join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    handleExceptions: true,
  }),
];

// Add debug log in development
if (config.isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: join(logsDir, 'debug.log'),
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.isProduction ? prodFormat : devFormat,
  defaultMeta: {
    service: 'easypost-mcp',
    environment: config.env,
  },
  transports,
  exitOnError: false,
});

/**
 * Create child logger with additional context
 * @param {Object} meta - Additional metadata for child logger
 * @returns {winston.Logger} Child logger instance
 */
logger.child = (meta) => {
  return logger.child(meta);
};

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Request Failed', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log API call to EasyPost
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {number} duration - Call duration in ms
 * @param {number} status - Response status code
 */
logger.logAPICall = (endpoint, method, duration, status) => {
  logger.info('EasyPost API Call', {
    endpoint,
    method,
    duration: `${duration}ms`,
    status,
  });
};

/**
 * Log Redis operation
 * @param {string} operation - Redis operation name
 * @param {string} key - Redis key
 * @param {boolean} success - Operation success status
 */
logger.logRedisOp = (operation, key, success) => {
  if (success) {
    logger.debug('Redis Operation', { operation, key, success });
  } else {
    logger.warn('Redis Operation Failed', { operation, key, success });
  }
};

/**
 * Log Socket.IO event
 * @param {string} event - Event name
 * @param {string} namespace - Socket.IO namespace
 * @param {string} socketId - Socket ID
 */
logger.logSocketEvent = (event, namespace, socketId) => {
  logger.debug('Socket.IO Event', {
    event,
    namespace,
    socketId,
  });
};

/**
 * Log performance metric
 * @param {string} operation - Operation name
 * @param {number} duration - Operation duration in ms
 * @param {Object} metadata - Additional metadata
 */
logger.logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger.log(level, 'Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

/**
 * Log security event
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 */
logger.logSecurity = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: join(logsDir, 'exceptions.log'),
    maxsize: 5242880,
    maxFiles: 5,
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: join(logsDir, 'rejections.log'),
    maxsize: 5242880,
    maxFiles: 5,
  })
);

// Log startup
logger.info('Logger initialized', {
  level: config.logging.level,
  environment: config.env,
});

export default logger;

