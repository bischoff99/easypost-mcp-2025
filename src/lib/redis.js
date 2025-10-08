/**
 * Redis Connection Pool Manager
 * Implements best practices from node-redis documentation
 */

import { createClient } from 'redis';
import config from '../config/index.js';
import logger from './logger.js';

let client = null;
let isConnected = false;

/**
 * Create and configure Redis client with connection pooling
 * @returns {Promise<RedisClient>} Connected Redis client
 */
async function createRedisClient() {
  if (client && isConnected) {
    return client;
  }

  try {
    logger.info('Initializing Redis connection...');

    client = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: config.redis.retryStrategy,
        connectTimeout: 5000, // 5 second timeout
      },
      // Connection pool configuration
      isolationPoolOptions: {
        min: 2,
        max: config.redis.poolSize,
      },
    });

    // Event handlers
    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    client.on('ready', () => {
      logger.info('Redis client ready!');
      isConnected = true;
    });

    client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
      isConnected = false;
    });

    client.on('end', () => {
      logger.warn('Redis client connection closed');
      isConnected = false;
    });

    // Connect to Redis with timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout after 10s')), 10000)
      )
    ]);

    logger.info('Redis connection established successfully');
    return client;
  } catch (error) {
    logger.warn('Failed to connect to Redis - Running without cache:', error.message);
    logger.warn('💡 To enable caching, start Redis: docker run -d -p 6379:6379 redis:7-alpine');
    
    // Set client to null so cache operations fail gracefully
    client = null;
    isConnected = false;
    
    // Don't throw - allow server to run without Redis
    return null;
  }
}

/**
 * Get the Redis client instance
 * Creates one if it doesn't exist
 * @returns {Promise<RedisClient>} Redis client instance
 */
async function getRedisClient() {
  if (!client || !isConnected) {
    return await createRedisClient();
  }
  return client;
}

/**
 * Execute Redis commands with automatic pipelining
 * Multiple commands in the same tick are automatically pipelined
 * @param {Function} callback - Callback function that receives the client
 * @returns {Promise<any>} Result of the callback
 */
async function executeWithClient(callback) {
  const redisClient = await getRedisClient();
  return await callback(redisClient);
}

/**
 * Execute Redis transaction (MULTI/EXEC)
 * @param {Function} callback - Callback that receives multi instance
 * @returns {Promise<any>} Transaction results
 */
async function executeTransaction(callback) {
  const redisClient = await getRedisClient();
  const multi = redisClient.multi();
  await callback(multi);
  return await multi.exec();
}

/**
 * Cache helper functions
 */
const cache = {
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      const redisClient = await getRedisClient();
      if (!redisClient) {
        logger.debug('Redis not available, skipping cache get');
        return null;
      }
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.debug(`Cache get error for key ${key}:`, error.message);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default from config)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = config.cache.ttl) {
    try {
      const redisClient = await getRedisClient();
      if (!redisClient) {
        logger.debug('Redis not available, skipping cache set');
        return false;
      }
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.debug(`Cache set error for key ${key}:`, error.message);
      return false;
    }
  },

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      const redisClient = await getRedisClient();
      if (!redisClient) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.debug(`Cache delete error for key ${key}:`, error.message);
      return false;
    }
  },

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., "user:*")
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    try {
      const redisClient = await getRedisClient();
      if (!redisClient) return 0;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.debug(`Cache delete pattern error for ${pattern}:`, error.message);
      return 0;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    try {
      const redisClient = await getRedisClient();
      if (!redisClient) return false;
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.debug(`Cache exists error for key ${key}:`, error.message);
      return false;
    }
  },

  /**
   * Increment value
   * @param {string} key - Cache key
   * @param {number} amount - Amount to increment (default: 1)
   * @returns {Promise<number>} New value
   */
  async incr(key, amount = 1) {
    try {
      const redisClient = await getRedisClient();
      if (!redisClient) return 0;
      return await redisClient.incrBy(key, amount);
    } catch (error) {
      logger.debug(`Cache increment error for key ${key}:`, error.message);
      return 0;
    }
  },
};

/**
 * Gracefully close Redis connection
 */
async function closeRedisConnection() {
  if (client && isConnected) {
    try {
      await client.quit();
      logger.info('Redis connection closed gracefully');
      isConnected = false;
      client = null;
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      // Force close if graceful close fails
      await client.disconnect();
    }
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await closeRedisConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRedisConnection();
  process.exit(0);
});

export {
  createRedisClient,
  getRedisClient,
  executeWithClient,
  executeTransaction,
  cache,
  closeRedisConnection,
};

export default {
  createRedisClient,
  getRedisClient,
  executeWithClient,
  executeTransaction,
  cache,
  closeRedisConnection,
};

