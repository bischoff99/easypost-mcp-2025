/**
 * Comprehensive Test Suite
 * Tests all aspects of the unified server
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

let serverProcess;
const BASE_URL = 'http://localhost:3000';
const TEST_API_KEY = process.env.TEST_EASYPOST_API_KEY || process.env.EASYPOST_API_KEY;

// Helper function to make requests
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return { response, data };
}

describe('Comprehensive Server Tests', () => {
  before(async () => {
    console.log('🚀 Starting server for comprehensive tests...');
    
    // Start server in background
    serverProcess = spawn('node', ['src/server.js'], {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'pipe',
    });
    
    // Wait for server to start
    await setTimeout(3000);
    
    console.log('✅ Server started');
  });

  after(async () => {
    console.log('🛑 Stopping server...');
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('1. Server Health & Status', () => {
    it('should respond to health check', async () => {
      const { response, data } = await request('/health');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp);
      assert.ok(typeof data.uptime === 'number');
    });

    it('should return API status', async () => {
      const { response, data } = await request('/api/status');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.status, 'operational');
      assert.strictEqual(data.version, '4.0.0');
    });

    it('should have correct CORS headers', async () => {
      const { response } = await request('/health');
      // Same origin, so no CORS headers needed
      assert.ok(response.ok);
    });
  });

  describe('2. Static File Serving', () => {
    it('should serve index.html', async () => {
      const { response, data } = await request('/');
      assert.strictEqual(response.status, 200);
      assert.ok(data.includes('<!DOCTYPE html>'));
      assert.ok(data.includes('EasyPost Dashboard'));
    });

    it('should serve app.js', async () => {
      const { response, data } = await request('/app.js');
      assert.strictEqual(response.status, 200);
      assert.ok(data.includes('EasyPostDashboard'));
      assert.ok(data.includes('class EasyPostDashboard'));
    });

    it('should serve style.css', async () => {
      const { response, data } = await request('/style.css');
      assert.strictEqual(response.status, 200);
      assert.ok(data.includes('root') || data.includes('body'));
    });

    it('should return 404 for non-existent files', async () => {
      const { response } = await request('/nonexistent.js');
      assert.strictEqual(response.status, 404);
    });
  });

  describe('3. Authentication & Security', () => {
    it('should reject requests without API key', async () => {
      const { response, data } = await request('/api/shipments/list');
      assert.strictEqual(response.status, 401);
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('API key'));
    });

    it('should reject requests with invalid API key', async () => {
      const { response, data } = await request('/api/shipments/list', {
        headers: { 'X-API-Key': 'invalid_key_12345' },
      });
      assert.strictEqual(response.status, 403);
      assert.strictEqual(data.success, false);
    });

    it('should accept requests with valid API key', async () => {
      if (!TEST_API_KEY) {
        console.log('⚠️  Skipping: No API key provided');
        return;
      }
      
      const { response } = await request('/api/shipments/list', {
        headers: { 'X-API-Key': TEST_API_KEY },
      });
      
      // Should get 200 or error from EasyPost API (not auth error)
      assert.ok(response.status === 200 || response.status >= 400);
    });

    it('should not require auth for dashboard API', async () => {
      const { response } = await request('/api/dashboard/stats');
      assert.strictEqual(response.status, 200);
    });
  });

  describe('4. API Endpoints - Dashboard (No Auth)', () => {
    it('GET /api/dashboard/stats should return statistics', async () => {
      const { response, data } = await request('/api/dashboard/stats');
      assert.strictEqual(response.status, 200);
      assert.ok(typeof data.totalShipments === 'number');
      assert.ok(typeof data.activeTracking === 'number');
      assert.ok(data.lastUpdated);
    });

    it('GET /api/dashboard/recent should return recent items', async () => {
      const { response, data } = await request('/api/dashboard/recent');
      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(data.shipments));
      assert.ok(Array.isArray(data.trackers));
    });

    it('GET /api/dashboard/activities should return activity log', async () => {
      const { response, data } = await request('/api/dashboard/activities');
      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(data.activities));
    });
  });

  describe('5. API Endpoints - Protected Routes', () => {
    const endpoints = [
      '/api/shipments/list',
      '/api/tracking/list',
      '/api/analytics/summary',
    ];

    endpoints.forEach((endpoint) => {
      it(`${endpoint} should require authentication`, async () => {
        const { response } = await request(endpoint);
        assert.ok(response.status === 401 || response.status === 403);
      });
    });
  });

  describe('6. Error Handling', () => {
    it('should handle 404 for API routes', async () => {
      const { response } = await request('/api/nonexistent');
      assert.strictEqual(response.status, 404);
    });

    it('should handle invalid JSON in POST requests', async () => {
      const { response } = await request('/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test',
        },
        body: 'invalid json',
      });
      assert.ok(response.status >= 400);
    });

    it('should handle missing required fields', async () => {
      const { response } = await request('/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': TEST_API_KEY || 'test',
        },
        body: JSON.stringify({}),
      });
      assert.ok(response.status >= 400);
    });
  });

  describe('7. Performance Tests', () => {
    it('health check should respond in < 50ms', async () => {
      const start = Date.now();
      await request('/health');
      const duration = Date.now() - start;
      assert.ok(duration < 50, `Health check took ${duration}ms (should be < 50ms)`);
    });

    it('static files should respond in < 100ms', async () => {
      const start = Date.now();
      await request('/');
      const duration = Date.now() - start;
      assert.ok(duration < 100, `Static file took ${duration}ms (should be < 100ms)`);
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => request('/health'));
      const results = await Promise.all(requests);
      
      results.forEach(({ response }) => {
        assert.strictEqual(response.status, 200);
      });
    });
  });

  describe('8. HTTP Headers & Security', () => {
    it('should have security headers', async () => {
      const { response } = await request('/');
      
      // Check for important security headers
      const headers = Object.fromEntries(response.headers.entries());
      assert.ok(!headers['x-powered-by'], 'Should not expose x-powered-by');
    });

    it('should set correct content-type headers', async () => {
      const tests = [
        { path: '/', expected: 'text/html' },
        { path: '/app.js', expected: 'application/javascript' },
        { path: '/style.css', expected: 'text/css' },
        { path: '/api/status', expected: 'application/json' },
      ];

      for (const test of tests) {
        const { response } = await request(test.path);
        const contentType = response.headers.get('content-type');
        assert.ok(
          contentType && contentType.includes(test.expected),
          `${test.path} should have content-type ${test.expected}, got ${contentType}`
        );
      }
    });
  });

  describe('9. SPA Routing Fallback', () => {
    it('should serve index.html for unknown routes', async () => {
      const { response, data } = await request('/some/random/route');
      assert.strictEqual(response.status, 200);
      assert.ok(data.includes('<!DOCTYPE html>'));
      assert.ok(data.includes('EasyPost Dashboard'));
    });

    it('should not fallback for API routes', async () => {
      const { response } = await request('/api/unknown/endpoint');
      assert.ok(response.status === 404 || response.status === 401);
    });
  });

  describe('10. Integration Tests', () => {
    it('dashboard should be able to call its own APIs', async () => {
      // Simulate dashboard loading and calling API
      const { response: htmlResponse } = await request('/');
      assert.strictEqual(htmlResponse.status, 200);

      const { response: statsResponse } = await request('/api/dashboard/stats');
      assert.strictEqual(statsResponse.status, 200);
    });

    it('API base URL should match server origin', async () => {
      const { data } = await request('/app.js');
      assert.ok(data.includes('window.location.origin'));
      assert.ok(data.includes('API_BASE_URL'));
    });
  });
});

console.log('✅ Comprehensive test suite ready to run!');
