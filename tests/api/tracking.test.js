/**
 * Tracking API Tests
 * Tests for tracking endpoints
 */

import { describe, test, expect } from '@jest/globals';
import { TEST_CONFIG, MOCK_DATA } from '../setup.js';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': TEST_CONFIG.API_KEY,
};

describe('Tracking API', () => {
  
  test('should create tracker', async () => {
    const trackerData = {
      tracking_code: MOCK_DATA.trackingCode,
      carrier: MOCK_DATA.carrier,
    };

    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/tracking/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(trackerData),
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('tracker_id');
    expect(data.data).toHaveProperty('tracking_code');
  }, 30000);

  test('should list trackers', async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/tracking/list`, {
      headers,
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('trackers');
  });
});

