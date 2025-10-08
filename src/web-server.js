#!/usr/bin/env node

/**
 * EasyPost Web Dashboard Server
 * Serves the web interface for the EasyPost MCP Server
 */

import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import config from './config/index.js';
import logger from './lib/logger.js';
import middleware from './middleware/index.js';
import initializeSocketIO from './sockets/index.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ASCII Banner
console.log(
  chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║  EasyPost Web Dashboard 2025                              ║
║  Modern shipping management interface                     ║
╚═══════════════════════════════════════════════════════════╝
  `)
);

/**
 * Initialize Express application for web dashboard
 */
function initializeWebApp() {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Apply middleware
  middleware.applyStandardMiddleware(app);

  // Serve static files from public directory
  const publicPath = join(__dirname, '../public');
  logger.info('Serving static files from:', { path: publicPath });
  
  app.use(express.static(publicPath, {
    maxAge: config.isProduction ? '1d' : 0,
    etag: true,
    lastModified: true,
  }));

  // Dashboard API routes with real EasyPost data
  app.use('/api/dashboard', dashboardRoutes);
  
  // Status endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'operational',
      version: '4.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // Health check
  app.get('/health', middleware.healthCheckMiddleware);

  // Error handlers (must come before catch-all)
  app.use(middleware.errorHandlerMiddleware);
  
  // Fallback to index.html for SPA routing (Express 5 compatible)
  app.use((req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
  });

  logger.info('Web dashboard application initialized');
  return app;
}

/**
 * Start the web dashboard server
 */
async function startWebServer() {
  try {
    logger.info('Starting web dashboard server...');

    // Try to connect to Redis (optional)
    const { createRedisClient } = await import('./lib/redis.js');
    const redisClient = await createRedisClient();
    if (redisClient) {
      logger.info('✓ Redis connected for caching');
    } else {
      logger.warn('⚠ Running without Redis cache');
    }

    // Initialize Express
    const app = initializeWebApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO for real-time updates
    const io = initializeSocketIO(httpServer);
    logger.info('Socket.IO initialized for web dashboard');

    // Use port 8080 for web dashboard (different from API server)
    const webPort = parseInt(process.env.WEB_PORT, 10) || 8080;
    const webHost = process.env.WEB_HOST || config.server.host;

    httpServer.listen(webPort, webHost, () => {
      logger.info(chalk.green.bold(`
╔═══════════════════════════════════════════════════════════╗
║  🌐 Web Dashboard is running!                            ║
║                                                           ║
║  Dashboard URL:  http://${webHost}:${webPort.toString().padEnd(33)}║
║  Environment:    ${config.env.padEnd(37)}║
║  Socket.IO:      Enabled for real-time updates           ║
╚═══════════════════════════════════════════════════════════╝
      `));
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down web dashboard...`);
      
      httpServer.close(() => {
        logger.info('Web dashboard server closed');
      });

      io.close(() => {
        logger.info('Socket.IO closed');
      });

      setTimeout(() => {
        process.exit(0);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start web dashboard server:', error);
    process.exit(1);
  }
}

// Start the server
startWebServer();

