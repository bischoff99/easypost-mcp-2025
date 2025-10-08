/**
 * GraphQL Server Integration
 * Version: 4.2.0
 * 
 * Integrates Apollo Server with Express 5
 * Following Context7 best practices (Trust Score: 9.6/10)
 */

import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import { resolvers } from './resolvers/index.js';
import logger from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Initialize Apollo Server
 * @param {Object} httpServer - HTTP server instance for graceful shutdown
 * @returns {ApolloServer} Apollo Server instance
 */
export async function createApolloServer(httpServer) {
  try {
    // Load GraphQL schema
    const typeDefs = readFileSync(
      join(__dirname, 'schemas/index.graphql'),
      'utf-8'
    );

    logger.info('📋 GraphQL schema loaded');

    // Create Apollo Server with DrainHttpServer plugin
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
      ],
      // Enable GraphQL Playground in development
      introspection: process.env.NODE_ENV !== 'production',
      // Format errors to hide internal details in production
      formatError: (formattedError, error) => {
        if (process.env.NODE_ENV === 'production') {
          // Don't leak internal server errors in production
          if (formattedError.message.startsWith('Context creation failed')) {
            return new Error('Internal server error');
          }
        }
        return formattedError;
      },
    });

    logger.info('🚀 Apollo Server created');
    return server;
  } catch (error) {
    logger.error('Failed to create Apollo Server:', error);
    throw error;
  }
}

/**
 * Mount Apollo Server to Express app
 * @param {Express} app - Express application
 * @param {ApolloServer} server - Apollo Server instance (must already be started)
 */
export async function mountGraphQL(app, server) {
  try {
    // Note: server.start() must be called BEFORE this function

    // Mount GraphQL endpoint at /graphql
    app.use('/graphql',
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          // Extract authentication token from headers
          const token = req.headers['x-api-key'] || 
                       req.headers.authorization?.replace('Bearer ', '');
          
          return {
            token,
            user: req.user,
            headers: req.headers,
          };
        },
      }),
    );

    logger.info('🌐 GraphQL endpoint mounted at /graphql');
    logger.info('📊 GraphQL Playground:', 
      process.env.NODE_ENV !== 'production' 
        ? 'http://localhost:3000/graphql' 
        : 'disabled (production)'
    );
  } catch (error) {
    logger.error('Failed to mount GraphQL:', error);
    throw error;
  }
}
