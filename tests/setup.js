/**
 * Test Setup and Utilities
 * Shared configuration and helpers for all tests
 */

export const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:3000',
  WEB_BASE_URL: process.env.TEST_WEB_URL || 'http://localhost:8080',
  API_KEY: process.env.EASYPOST_API_KEY || 'test_key',
  TIMEOUT: 30000,
};

export const MOCK_DATA = {
  validAddress: {
    street1: '417 Montgomery Street',
    street2: 'Floor 5',
    city: 'San Francisco',
    state: 'CA',
    zip: '94104',
    country: 'US',
    name: 'EasyPost',
    phone: '415-123-4567',
  },
  
  invalidAddress: {
    street1: '',
    city: 'San Francisco',
    state: 'CA',
    zip: 'invalid',
    country: 'US',
  },
  
  validParcel: {
    length: 20.2,
    width: 10.9,
    height: 5,
    weight: 65.9,
  },
  
  trackingCode: '9400100000000000000000',
  carrier: 'USPS',
};

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateTestApiKey() {
  return `test_${Math.random().toString(36).substring(2, 15)}`;
}

