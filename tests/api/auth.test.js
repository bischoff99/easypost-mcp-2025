/**
 * Authentication Tests
 * Tests for API key authentication middleware
 */

import { describe, test, expect } from '@jest/globals';
import { TEST_CONFIG } from '../setup.js';

describe('Authentication', () => {
  
  test('should reject request without API key', async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/list`);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing API key');
  });

  test('should reject request with invalid API key format', async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/list`, {
      headers: {
        'X-API-Key': 'short',
      },
    });
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid API key');
  });

  test('should accept request with valid API key', async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/list`, {
      headers: {
        'X-API-Key': TEST_CONFIG.API_KEY,
      },
    });
    
    expect(response.status).not.toBe(401);
  });

  test('should accept Bearer token format', async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/list`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.API_KEY}`,
      },
    });
    
    expect(response.status).not.toBe(401);
  });
});

