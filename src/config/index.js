/**
 * Centralized Configuration Management
 * Loads and validates all environment variables
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Validates required environment variables
 * @param {string[]} vars - Array of required variable names
 * @throws {Error} If any required variables are missing
 */
function validateEnvVars(vars) {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate critical environment variables
const requiredVars = ['EASYPOST_API_KEY'];
validateEnvVars(requiredVars);

/**
 * Application Configuration Object
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTesting: process.env.NODE_ENV === 'test',

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0',
    basePath: process.env.BASE_PATH || '/',
  },

  // EasyPost API Configuration
  easypost: {
    apiKey: process.env.EASYPOST_API_KEY,
    apiBase: process.env.EASYPOST_API_BASE || 'https://api.easypost.com/v2',
    timeout: parseInt(process.env.EASYPOST_TIMEOUT, 10) || 30000,
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    poolSize: parseInt(process.env.REDIS_POOL_SIZE, 10) || 10,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  },

  // Socket.IO Configuration
  socketio: {
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL, 10) || 25000,
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT, 10) || 20000,
    maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_BUFFER, 10) || 1e6,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    dir: process.env.LOG_DIR || 'logs',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600, // 1 hour
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD, 10) || 600, // 10 minutes
  },

  // Feature Flags
  features: {
    lumaAI: process.env.FEATURE_LUMA_AI === 'true',
    forge: process.env.FEATURE_FORGE === 'true',
    claimsAPI: process.env.FEATURE_CLAIMS_API === 'true',
    wallet: process.env.FEATURE_WALLET === 'true',
    webhooks: process.env.FEATURE_WEBHOOKS === 'true',
    analytics: process.env.FEATURE_ANALYTICS === 'true',
    carbonTracking: process.env.FEATURE_CARBON_TRACKING === 'true',
  },

  // Performance Configuration
  performance: {
    compressionEnabled: process.env.ENABLE_COMPRESSION !== 'false',
    workerProcesses: parseInt(process.env.WORKER_PROCESSES, 10) || 0, // 0 = auto
  },
};

// Freeze config in production to prevent accidental modifications
if (config.isProduction) {
  Object.freeze(config);
}

export default config;

