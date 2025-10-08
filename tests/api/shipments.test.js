/**
 * Shipments API Tests
 * Tests for shipment endpoints
 */

import { describe, test, expect } from '@jest/globals';
import { TEST_CONFIG, MOCK_DATA } from '../setup.js';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': TEST_CONFIG.API_KEY,
};

describe('Shipments API', () => {
  
  test('should create shipment with valid data', async () => {
    const shipmentData = {
      to_address: MOCK_DATA.validAddress,
      from_address: MOCK_DATA.validAddress,
      parcel: MOCK_DATA.validParcel,
    };

    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(shipmentData),
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('shipment_id');
    expect(data.data).toHaveProperty('rates');
    expect(Array.isArray(data.data.rates)).toBe(true);
  }, 30000);

  test('should get shipment list', async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/list`, {
      headers,
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('shipments');
  });

  test('should reject invalid shipment data', async () => {
    const invalidData = {
      to_address: MOCK_DATA.invalidAddress,
      from_address: MOCK_DATA.validAddress,
      parcel: MOCK_DATA.validParcel,
    };

    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/shipments/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invalidData),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

