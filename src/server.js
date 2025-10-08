#!/usr/bin/env node

/**
 * EasyPost MCP Server 2025
 * Modern, production-ready server with best practices
 */

import express from 'express';
import { createServer } from 'http';
import chalk from 'chalk';
import figlet from 'figlet';
import config from './config/index.js';
import logger from './lib/logger.js';
import { createRedisClient } from './lib/redis.js';
import initializeSocketIO from './sockets/index.js';
import middleware from './middleware/index.js';
import { validateApiKey } from './middleware/auth.js';

// Import route handlers
import shipmentsRoutes from './routes/shipments.js';
import trackingRoutes from './routes/tracking.js';
import addressesRoutes from './routes/addresses.js';
import lumaAiRoutes from './routes/luma-ai.js';
import claimsRoutes from './routes/claims.js';
import forgeRoutes from './routes/forge.js';
import analyticsRoutes from './routes/analytics.js';
import batchRoutes from './routes/batch.js';

// ASCII Banner
console.log(
  chalk.cyan(
    figlet.textSync('EasyPost MCP', {
      font: 'Standard',
      horizontalLayout: 'default',
    })
  )
);

console.log(chalk.green(`
╔═══════════════════════════════════════════════════════════╗
║  EasyPost MCP Server 2025                                 ║
║  Version: 4.0.0                                           ║
║  Environment: ${config.env.padEnd(44)}║
║  Node: ${process.version.padEnd(49)}║
╚═══════════════════════════════════════════════════════════╝
`));

/**
 * Initialize Express application
 */
function initializeExpress() {
  const app = express();

  // Trust proxy (important for rate limiting and logging behind reverse proxy)
  app.set('trust proxy', 1);

  // Disable x-powered-by header for security
  app.disable('x-powered-by');

  // Apply standard middleware
  middleware.applyStandardMiddleware(app);

  // Health check endpoint (before rate limiting)
  app.get('/health', middleware.healthCheckMiddleware);

  // API status endpoint (public)
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'operational',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes (protected with API key authentication)
  app.use('/api/shipments', validateApiKey, shipmentsRoutes);
  app.use('/api/tracking', validateApiKey, trackingRoutes);
  app.use('/api/addresses', validateApiKey, addressesRoutes);
  app.use('/api/luma', validateApiKey, lumaAiRoutes);
  app.use('/api/claims', validateApiKey, claimsRoutes);
  app.use('/api/forge', validateApiKey, forgeRoutes);
  app.use('/api/analytics', validateApiKey, analyticsRoutes);
  app.use('/api/batch', validateApiKey, batchRoutes);

  // Serve static files (if needed)
  app.use(express.static('web', { maxAge: '1d' }));

  // 404 handler
  app.use(middleware.notFoundMiddleware);

  // Error handler (must be last)
  app.use(middleware.errorHandlerMiddleware);

  logger.info('Express application initialized');
  return app;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    logger.info('Starting server initialization...');

    // Initialize Redis (optional - server will run without it)
    logger.info('Attempting to connect to Redis...');
    const redisClient = await createRedisClient();
    if (redisClient) {
      logger.info(chalk.green('✓ Redis connected - Caching enabled'));
    } else {
      logger.warn(chalk.yellow('⚠ Redis not available - Running without cache'));
      logger.warn(chalk.yellow('  Start Redis: docker run -d -p 6379:6379 redis:7-alpine'));
    }

    // Initialize Express
    logger.info('Initializing Express application...');
    const app = initializeExpress();
    logger.info(chalk.green('✓ Express initialized'));

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    logger.info('Initializing Socket.IO...');
    const io = initializeSocketIO(httpServer);
    logger.info(chalk.green('✓ Socket.IO initialized'));

    // Start listening
    httpServer.listen(config.server.port, config.server.host, () => {
      logger.info(chalk.green.bold(`
╔═══════════════════════════════════════════════════════════╗
║  🚀 Server is running!                                    ║
║                                                           ║
║  HTTP Server:  http://${config.server.host}:${config.server.port.toString().padEnd(28)}║
║  Environment:  ${config.env.padEnd(43)}║
║  Logging:      ${config.logging.level.padEnd(43)}║
║                                                           ║
║  Socket.IO Namespaces:                                    ║
║    - / (main)                                             ║
║    - /tracking                                            ║
║    - /shipments                                           ║
║    - /notifications                                       ║
${config.features.analytics ? '║    - /analytics                                           ║' : ''}
╚═══════════════════════════════════════════════════════════╝
      `));

      // Log feature flags
      const enabledFeatures = Object.entries(config.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature);

      if (enabledFeatures.length > 0) {
        logger.info('Enabled features:', { features: enabledFeatures });
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      // Close Socket.IO connections
      io.close(() => {
        logger.info('Socket.IO server closed');
      });

      // Give ongoing requests time to finish
      setTimeout(() => {
        logger.info('Forcing shutdown after timeout');
        process.exit(0);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

