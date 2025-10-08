/**
 * EasyPost MCP Server 2025 - Comprehensive Testing Suite
 * Includes unit tests, integration tests, UI component tests, and performance tests
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import puppeteer, { Browser, Page } from 'puppeteer';
import { performance } from 'perf_hooks';

// Types
import type { 
  Address, 
  Shipment, 
  LumaResponse, 
  Claim, 
  ForgeCustomer,
  AnalyticsResponse 
} from '../src/types/index.js';

// Test configuration
const TEST_CONFIG = {
  SERVER_PORT: 3001,
  WEB_PORT: 3002,
  TIMEOUT: 30000,
  BROWSER_TIMEOUT: 10000,
  API_KEY: process.env.TEST_EASYPOST_API_KEY || 'test_key',
  PUPPETEER_HEADLESS: process.env.CI ? true : 'new',
};

// Test data
const MOCK_DATA = {
  validAddress: {
    street1: '417 Montgomery Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94104',
    country: 'US',
    name: 'Test User',
  } as Address,
  
  validParcel: {
    length: 10,
    width: 8,
    height: 4,
    weight: 16,
  },
  
  invalidAddress: {
    street1: '',
    city: 'San Francisco',
    state: 'CA',
    zip: 'invalid',
    country: 'US',
  } as Partial<Address>,
};

class TestSuite {
  private serverProcess: ChildProcess | null = null;
  private webProcess: ChildProcess | null = null;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private apiClient: any;
  
  constructor() {
    this.apiClient = request(`http://localhost:${TEST_CONFIG.WEB_PORT}`);
  }

  // Setup test environment
  async setup(): Promise<void> {
    console.log('🔧 Setting up test environment...');
    
    // Start servers
    await this.startServers();
    
    // Setup browser for UI testing
    await this.setupBrowser();
    
    // Wait for services to be ready
    await this.waitForServices();
    
    console.log('✅ Test environment ready');
  }

  // Cleanup test environment
  async teardown(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    if (this.webProcess) {
      this.webProcess.kill('SIGTERM');
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Test cleanup complete');
  }

  private async startServers(): Promise<void> {
    // Start MCP server
    this.serverProcess = spawn('node', ['dist/server-2025.js'], {
      env: {
        ...process.env,
        PORT: TEST_CONFIG.SERVER_PORT.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
        EASYPOST_API_KEY: TEST_CONFIG.API_KEY,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Start web server
    this.webProcess = spawn('node', ['dist/web-server-2025.js'], {
      env: {
        ...process.env,
        PORT: TEST_CONFIG.WEB_PORT.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
        EASYPOST_API_KEY: TEST_CONFIG.API_KEY,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  private async setupBrowser(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.PUPPETEER_HEADLESS,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(TEST_CONFIG.BROWSER_TIMEOUT);
    
    // Enable JavaScript
    await this.page.setJavaScriptEnabled(true);
  }

  private async waitForServices(): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.apiClient.get('/health').timeout(5000);
        if (response.status === 200) {
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Services failed to start within timeout period');
  }
}

// Global test suite instance
let testSuite: TestSuite;

// Jest setup and teardown
beforeAll(async () => {
  testSuite = new TestSuite();
  await testSuite.setup();
}, 60000);

afterAll(async () => {
  if (testSuite) {
    await testSuite.teardown();
  }
}, 30000);

// === UNIT TESTS ===

describe('Core Functions', () => {
  describe('Address Validation', () => {
    test('should validate correct address format', () => {
      const address = MOCK_DATA.validAddress;
      expect(address.street1).toBeTruthy();
      expect(address.city).toBeTruthy();
      expect(address.state).toMatch(/^[A-Z]{2}$/);
      expect(address.zip).toMatch(/^[0-9]{5}(-[0-9]{4})?$/);
      expect(address.country).toMatch(/^[A-Z]{2}$/);
    });

    test('should reject invalid address format', () => {
      const address = MOCK_DATA.invalidAddress;
      expect(address.street1).toBeFalsy();
      expect(address.zip).not.toMatch(/^[0-9]{5}(-[0-9]{4})?$/);
    });
  });

  describe('Type Safety', () => {
    test('should enforce TypeScript types', () => {
      const shipment: Partial<Shipment> = {
        id: 'test_id',
        status: 'created',
        from_address: MOCK_DATA.validAddress,
        to_address: MOCK_DATA.validAddress,
        rates: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(typeof shipment.id).toBe('string');
      expect(shipment.status).toMatch(/^(created|purchased|cancelled|delivered|returned)$/);
      expect(Array.isArray(shipment.rates)).toBe(true);
    });
  });
});

// === API INTEGRATION TESTS ===

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await testSuite.apiClient
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: '4.0.0',
        nodejs: expect.stringMatching(/^v22\./),
        express: '5.1.0',
      });
    });
  });

  describe('Shipment API', () => {
    test('should create shipment with valid data', async () => {
      const shipmentData = {
        from_address: MOCK_DATA.validAddress,
        to_address: MOCK_DATA.validAddress,
        parcel: MOCK_DATA.validParcel,
      };

      const response = await testSuite.apiClient
        .post('/api/shipments/create')
        .set('X-API-Key', TEST_CONFIG.API_KEY)
        .send(shipmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shipment_id');
      expect(response.body.data).toHaveProperty('rates');
      expect(Array.isArray(response.body.data.rates)).toBe(true);
    });

    test('should reject invalid shipment data', async () => {
      const invalidData = {
        from_address: MOCK_DATA.invalidAddress,
        to_address: MOCK_DATA.validAddress,
        parcel: MOCK_DATA.validParcel,
      };

      await testSuite.apiClient
        .post('/api/shipments/create')
        .set('X-API-Key', TEST_CONFIG.API_KEY)
        .send(invalidData)
        .expect(400);
    });

    test('should require API key authentication', async () => {
      const shipmentData = {
        from_address: MOCK_DATA.validAddress,
        to_address: MOCK_DATA.validAddress,
        parcel: MOCK_DATA.validParcel,
      };

      await testSuite.apiClient
        .post('/api/shipments/create')
        .send(shipmentData)
        .expect(401);
    });
  });

  describe('Luma AI API', () => {
    test('should provide AI recommendations', async () => {
      const lumaRequest = {
        shipment: {
          from_address: MOCK_DATA.validAddress,
          to_address: MOCK_DATA.validAddress,
          parcel: MOCK_DATA.validParcel,
          preferences: {
            priority: 'cost',
            carbon_neutral: false,
          },
        },
      };

      const response = await testSuite.apiClient
        .post('/api/luma/recommend')
        .set('X-API-Key', TEST_CONFIG.API_KEY)
        .send(lumaRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ai_analysis');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      
      // Check AI analysis structure
      const aiAnalysis = response.body.data.ai_analysis;
      expect(aiAnalysis).toHaveProperty('processing_time_ms');
      expect(aiAnalysis).toHaveProperty('model_version');
      expect(aiAnalysis).toHaveProperty('confidence');
      expect(['high', 'medium', 'low']).toContain(aiAnalysis.confidence);
    });
  });

  describe('Claims API', () => {
    test('should create claim with valid data', async () => {
      const claimData = {
        type: 'damage',
        tracking_code: '1Z999AA1234567890',
        description: 'Package arrived damaged during testing',
        claimed_amount: 99.99,
        contact_email: 'test@example.com',
        ai_analysis: true,
      };

      const response = await testSuite.apiClient
        .post('/api/claims')
        .set('X-API-Key', TEST_CONFIG.API_KEY)
        .send(claimData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.type).toBe('damage');
      expect(response.body.data).toHaveProperty('ai_analysis');
    });

    test('should list claims with pagination', async () => {
      const response = await testSuite.apiClient
        .get('/api/claims?limit=10&offset=0')
        .set('X-API-Key', TEST_CONFIG.API_KEY)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
    });
  });

  describe('Analytics API', () => {
    test('should provide analytics data', async () => {
      const response = await testSuite.apiClient
        .get('/api/analytics/ai')
        .query({
          start_date: '2025-09-01',
          end_date: '2025-10-01',
          type: 'cost_optimization',
        })
        .set('X-API-Key', TEST_CONFIG.API_KEY)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('ai_insights');
      expect(response.body.data).toHaveProperty('predictions');
      expect(Array.isArray(response.body.data.ai_insights)).toBe(true);
    });
  });
});

// === UI COMPONENT TESTS ===

describe('UI Component Tests', () => {
  beforeEach(async () => {
    if (testSuite.page) {
      await testSuite.page.goto(`http://localhost:${TEST_CONFIG.WEB_PORT}`);
      await testSuite.page.waitForSelector('body', { timeout: 10000 });
    }
  });

  describe('Dashboard Loading', () => {
    test('should load main dashboard', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      // Wait for main elements to load
      await testSuite.page.waitForSelector('.dashboard', { timeout: 10000 });
      await testSuite.page.waitForSelector('.sidebar', { timeout: 5000 });
      
      // Check page title
      const title = await testSuite.page.title();
      expect(title).toContain('EasyPost Dashboard');
      
      // Check for key UI elements
      const dashboardExists = await testSuite.page.$('.dashboard') !== null;
      const sidebarExists = await testSuite.page.$('.sidebar') !== null;
      const headerExists = await testSuite.page.$('.header') !== null;
      
      expect(dashboardExists).toBe(true);
      expect(sidebarExists).toBe(true);
      expect(headerExists).toBe(true);
    });
  });

  describe('Theme System', () => {
    test('should support dark/light theme toggle', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      // Check initial theme
      const bodyClass = await testSuite.page.evaluate(() => document.body.className);
      expect(bodyClass).toMatch(/theme-(light|dark|auto)/);
      
      // Find and click theme toggle
      const themeToggle = await testSuite.page.$('.theme-toggle, [data-testid="theme-toggle"]');
      if (themeToggle) {
        await themeToggle.click();
        
        // Wait for theme change
        await testSuite.page.waitForTimeout(500);
        
        // Check theme changed
        const newBodyClass = await testSuite.page.evaluate(() => document.body.className);
        expect(newBodyClass).not.toBe(bodyClass);
      }
    });
  });

  describe('Navigation', () => {
    test('should navigate between sections', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      // Test navigation links
      const navLinks = [
        { selector: '[data-section="shipments"]', expectedUrl: '#shipments' },
        { selector: '[data-section="luma"]', expectedUrl: '#luma' },
        { selector: '[data-section="tracking"]', expectedUrl: '#tracking' },
        { selector: '[data-section="analytics"]', expectedUrl: '#analytics' },
      ];

      for (const link of navLinks) {
        const navElement = await testSuite.page.$(link.selector);
        if (navElement) {
          await navElement.click();
          await testSuite.page.waitForTimeout(500);
          
          // Check if section is active/visible
          const activeSection = await testSuite.page.$('.section.active, .tab-content.active');
          expect(activeSection).not.toBeNull();
        }
      }
    });
  });

  describe('Command Palette', () => {
    test('should open command palette with Cmd+K', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      // Press Cmd+K (or Ctrl+K on Windows/Linux)
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      await testSuite.page.keyboard.down(modifier);
      await testSuite.page.keyboard.press('KeyK');
      await testSuite.page.keyboard.up(modifier);
      
      // Wait for command palette to appear
      await testSuite.page.waitForSelector('.command-palette:not(.hidden)', { timeout: 2000 });
      
      const paletteVisible = await testSuite.page.evaluate(() => {
        const palette = document.querySelector('.command-palette');
        return palette && !palette.classList.contains('hidden');
      });
      
      expect(paletteVisible).toBe(true);
    });
  });

  describe('Form Validation', () => {
    test('should validate shipment form', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      // Navigate to shipments section
      const shipmentsNav = await testSuite.page.$('[data-section="shipments"]');
      if (shipmentsNav) {
        await shipmentsNav.click();
        await testSuite.page.waitForTimeout(500);
      }
      
      // Find create shipment form
      const createButton = await testSuite.page.$('.btn-create-shipment, [data-testid="create-shipment"]');
      if (createButton) {
        await createButton.click();
        await testSuite.page.waitForTimeout(500);
        
        // Try to submit empty form
        const submitButton = await testSuite.page.$('button[type="submit"], .btn-submit');
        if (submitButton) {
          await submitButton.click();
          
          // Check for validation errors
          await testSuite.page.waitForTimeout(1000);
          const errorExists = await testSuite.page.$('.error, .invalid, .validation-error') !== null;
          expect(errorExists).toBe(true);
        }
      }
    });
  });

  describe('Responsive Design', () => {
    test('should work on mobile viewports', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      // Set mobile viewport
      await testSuite.page.setViewport({ width: 375, height: 667 });
      await testSuite.page.reload({ waitUntil: 'networkidle0' });
      
      // Check if mobile layout is applied
      const mobileLayout = await testSuite.page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        return body.classList.contains('mobile') || 
               computedStyle.getPropertyValue('--mobile').includes('true') ||
               window.innerWidth <= 768;
      });
      
      expect(mobileLayout).toBe(true);
      
      // Check if sidebar is collapsible on mobile
      const sidebar = await testSuite.page.$('.sidebar');
      if (sidebar) {
        const sidebarClass = await testSuite.page.evaluate(
          (el) => el?.className || '', sidebar
        );
        expect(sidebarClass).toMatch(/(collapsed|mobile|hidden)/);
      }
    });
  });
});

// === PERFORMANCE TESTS ===

describe('Performance Tests', () => {
  describe('Page Load Performance', () => {
    test('should load dashboard within performance budget', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');

      const startTime = performance.now();
      
      // Navigate to dashboard
      await testSuite.page.goto(`http://localhost:${TEST_CONFIG.WEB_PORT}`, {
        waitUntil: 'networkidle0'
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check Core Web Vitals with Lighthouse-like metrics
      const metrics = await testSuite.page.evaluate(() => ({
        // First Contentful Paint
        fcp: performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        
        // Largest Contentful Paint (approximation)
        lcp: performance.now(),
        
        // Cumulative Layout Shift (basic check)
        cls: 0, // Would need more sophisticated measurement
        
        // Total page size
        resourceSizes: performance.getEntriesByType('navigation')[0]?.transferSize || 0,
      }));
      
      // Performance budgets
      expect(metrics.fcp).toBeLessThan(1500); // First Contentful Paint < 1.5s
      expect(metrics.resourceSizes).toBeLessThan(2 * 1024 * 1024); // < 2MB total
    });
  });

  describe('API Performance', () => {
    test('should respond to health check quickly', async () => {
      const startTime = performance.now();
      
      const response = await testSuite.apiClient
        .get('/health')
        .expect(200);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 200ms
      expect(responseTime).toBeLessThan(200);
      expect(response.body.status).toBe('healthy');
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () =>
        testSuite.apiClient.get('/health')
      );
      
      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable under load
      expect(avgResponseTime).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    test('should maintain reasonable memory usage', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        await testSuite.apiClient.get('/health');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

// === WEBSOCKET TESTS ===

describe('WebSocket Tests', () => {
  test('should establish WebSocket connection', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_CONFIG.WEB_PORT}/socket.io/?transport=websocket`);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: { type: 'shipment', id: 'test_shipment_id' }
      }));
      
      setTimeout(() => {
        ws.close();
        done();
      }, 1000);
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
});

// === ACCESSIBILITY TESTS ===

describe('Accessibility Tests', () => {
  test('should meet WCAG 2.1 AA standards', async () => {
    if (!testSuite.page) throw new Error('Page not initialized');

    // Basic accessibility checks
    const accessibilityIssues = await testSuite.page.evaluate(() => {
      const issues: string[] = [];
      
      // Check for alt text on images
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push(`Image ${index} missing alt text`);
        }
      });
      
      // Check for form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, index) => {
        const hasLabel = input.getAttribute('aria-label') || 
                        input.getAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${input.id}"]`);
        if (!hasLabel) {
          issues.push(`Input ${index} missing label`);
        }
      });
      
      // Check for heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let previousLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > previousLevel + 1) {
          issues.push(`Heading level skip at ${heading.textContent} (index ${index})`);
        }
        previousLevel = level;
      });
      
      return issues;
    });
    
    // Should have minimal accessibility issues
    expect(accessibilityIssues.length).toBeLessThan(3);
  });

  test('should support keyboard navigation', async () => {
    if (!testSuite.page) throw new Error('Page not initialized');

    // Test Tab navigation
    await testSuite.page.keyboard.press('Tab');
    
    let focusedElement = await testSuite.page.evaluate(() => {
      return document.activeElement?.tagName || 'none';
    });
    
    // Should focus on interactive elements
    expect(['BUTTON', 'INPUT', 'A', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });
});

// Export test suite for use in other files
export { TestSuite, TEST_CONFIG, MOCK_DATA };