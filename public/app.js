/**
 * EasyPost Dashboard 2025 - Real Data Integration
 * Fetches actual data from your EasyPost account
 */

const API_BASE_URL = window.location.origin; // Same server
const SOCKET_URL = window.location.origin;

class EasyPostDashboard {
  constructor() {
    this.data = {
      stats: null,
      shipments: [],
      trackers: [],
      loading: true,
    };
    
    this.sockets = {};
    this.init();
  }

  async init() {
    console.log('🚀 Initializing EasyPost Dashboard with real data...');
    
    // Connect Socket.IO for real-time updates
    this.initSocketIO();
    
    // Load initial data
    await this.loadDashboardData();
    
    // Set up auto-refresh
    this.setupAutoRefresh();
    
    // Initialize UI components
    this.initUI();
  }

  /**
   * Initialize Socket.IO for real-time updates
   */
  initSocketIO() {
    // Main connection
    this.socket = io(SOCKET_URL);
    
    // Tracking namespace
    this.sockets.tracking = io(`${SOCKET_URL}/tracking`);
    this.sockets.tracking.on('connect', () => {
      console.log('✅ Connected to tracking namespace');
    });
    
    this.sockets.tracking.on('update', (data) => {
      console.log('📦 Tracking update received:', data);
      this.handleTrackingUpdate(data);
    });
    
    // Shipments namespace
    this.sockets.shipments = io(`${SOCKET_URL}/shipments`);
    this.sockets.shipments.on('shipment-update', (data) => {
      console.log('📬 Shipment update received:', data);
      this.handleShipmentUpdate(data);
    });
    
    // Notifications namespace
    this.sockets.notifications = io(`${SOCKET_URL}/notifications`);
    this.sockets.notifications.on('notification', (data) => {
      console.log('🔔 Notification received:', data);
      this.showNotification(data);
    });
  }

  /**
   * Load dashboard data from API
   */
  async loadDashboardData() {
    try {
      this.showLoading(true);
      
      // Fetch data in parallel
      const [stats, shipments, trackers] = await Promise.all([
        this.fetchStats(),
        this.fetchRecentShipments(10),
        this.fetchActiveTracking(10),
      ]);
      
      this.data.stats = stats;
      this.data.shipments = shipments.shipments || [];
      this.data.trackers = trackers.trackers || [];
      this.data.loading = false;
      
      // Update UI
      this.updateDashboardUI();
      
      console.log('✅ Dashboard data loaded:', {
        totalShipments: stats.totalShipments,
        activeTracking: stats.activeTracking,
        shipmentsLoaded: this.data.shipments.length,
      });
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      this.showError('Failed to load dashboard data. Please check your API key and connection.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Fetch dashboard statistics
   */
  async fetchStats() {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch recent shipments
   */
  async fetchRecentShipments(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/shipments/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch active tracking
   */
  async fetchActiveTracking(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/tracking/active?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Update dashboard UI with real data
   */
  updateDashboardUI() {
    const stats = this.data.stats;
    
    if (!stats) return;
    
    // Update stat cards
    this.updateElement('#total-shipments', stats.totalShipments || 0);
    this.updateElement('#active-tracking', stats.activeTracking || 0);
    this.updateElement('#delivered-today', stats.delivered || 0);
    this.updateElement('#pending-labels', stats.pending || 0);
    this.updateElement('#total-cost', `$${stats.totalCost || '0.00'}`);
    this.updateElement('#today-shipments', stats.todayShipments || 0);
    
    // Update recent shipments table
    this.updateShipmentsTable();
    
    // Update tracking list
    this.updateTrackingList();
    
    console.log('✅ Dashboard UI updated with real data');
  }

  /**
   * Update shipments table with real data
   */
  updateShipmentsTable() {
    const tbody = document.querySelector('#shipments-table-body');
    if (!tbody) return;
    
    if (this.data.shipments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem;">
            <div style="color: var(--text-secondary)">
              No shipments found. Create your first shipment to get started!
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = this.data.shipments.map(shipment => `
      <tr>
        <td>
          <div class="shipment-id">${shipment.id}</div>
          ${shipment.tracking_code ? `<div class="tracking-number">${shipment.tracking_code}</div>` : ''}
        </td>
        <td>${shipment.from?.city || 'N/A'}, ${shipment.from?.state || ''}</td>
        <td>${shipment.to?.city || 'N/A'}, ${shipment.to?.state || ''}</td>
        <td>
          <span class="status-badge status-${this.normalizeStatus(shipment.status)}">
            ${this.formatStatus(shipment.status)}
          </span>
        </td>
        <td>
          <div>${shipment.carrier}</div>
          <div style="font-size: 0.875rem; color: var(--text-secondary)">
            ${shipment.service}
          </div>
        </td>
        <td>
          <div class="shipment-cost">$${shipment.rate}</div>
          ${shipment.label_url ? 
            `<a href="${shipment.label_url}" target="_blank" class="label-link">📄 Label</a>` : 
            '<span style="color: var(--text-secondary)">No label</span>'
          }
        </td>
      </tr>
    `).join('');
  }

  /**
   * Update tracking list with real data
   */
  updateTrackingList() {
    const container = document.querySelector('#tracking-list');
    if (!container) return;
    
    if (this.data.trackers.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary)">
          No active tracking. Shipments you create will appear here.
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.data.trackers.map(tracker => `
      <div class="tracking-card" data-tracking="${tracker.tracking_code}">
        <div class="tracking-header">
          <h4>${tracker.tracking_code}</h4>
          <span class="status-badge status-${this.normalizeStatus(tracker.status)}">
            ${this.formatStatus(tracker.status)}
          </span>
        </div>
        <div class="tracking-details">
          <div><strong>Carrier:</strong> ${tracker.carrier || 'Unknown'}</div>
          ${tracker.est_delivery_date ? 
            `<div><strong>Est. Delivery:</strong> ${this.formatDate(tracker.est_delivery_date)}</div>` : 
            ''
          }
          ${tracker.weight ? 
            `<div><strong>Weight:</strong> ${tracker.weight} oz</div>` : 
            ''
          }
        </div>
        ${tracker.tracking_details && tracker.tracking_details.length > 0 ?
          `<div class="latest-update">
            <strong>Latest:</strong> ${tracker.tracking_details[0].message || tracker.status_detail || 'In transit'}
          </div>` :
          ''
        }
      </div>
    `).join('');
  }

  /**
   * Handle real-time tracking updates
   */
  handleTrackingUpdate(data) {
    console.log('📦 Handling tracking update:', data);
    
    // Find and update tracker in data
    const index = this.data.trackers.findIndex(t => t.tracking_code === data.trackingNumber);
    if (index !== -1) {
      this.data.trackers[index] = { ...this.data.trackers[index], ...data.data };
    }
    
    // Refresh UI
    this.updateTrackingList();
    
    // Show notification
    this.showNotification({
      type: 'tracking_update',
      title: 'Tracking Update',
      message: `${data.trackingNumber} - Status updated`,
    });
  }

  /**
   * Handle real-time shipment updates
   */
  handleShipmentUpdate(data) {
    console.log('📬 Handling shipment update:', data);
    
    // Reload stats and shipments
    this.loadDashboardData();
  }

  /**
   * Create new shipment via API
   */
  async createShipment(shipmentData) {
    try {
      this.showLoading(true, 'Creating shipment...');
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Shipment created:', result.shipment);
        this.showNotification({
          type: 'success',
          title: 'Shipment Created',
          message: `Shipment ${result.shipment.id} created successfully!`,
        });
        
        // Reload data
        await this.loadDashboardData();
        
        return result.shipment;
      } else {
        throw new Error(result.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('❌ Failed to create shipment:', error);
      this.showError(`Failed to create shipment: ${error.message}`);
      throw error;
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Buy shipment label
   */
  async buyShipmentLabel(shipmentId, rateId) {
    try {
      this.showLoading(true, 'Purchasing label...');
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/shipments/${shipmentId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rateId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Label purchased:', result.shipment);
        this.showNotification({
          type: 'success',
          title: 'Label Purchased',
          message: 'Shipping label ready for download!',
        });
        
        // Reload data
        await this.loadDashboardData();
        
        return result.shipment;
      } else {
        throw new Error(result.error || 'Failed to purchase label');
      }
    } catch (error) {
      console.error('❌ Failed to buy label:', error);
      this.showError(`Failed to purchase label: ${error.message}`);
      throw error;
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Track package by tracking number
   */
  async trackPackage(trackingNumber) {
    try {
      this.showLoading(true, 'Fetching tracking info...');
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/tracking/${trackingNumber}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Tracking info retrieved:', result.tracker);
        
        // Subscribe to real-time updates
        this.sockets.tracking.emit('subscribe', trackingNumber, (response) => {
          if (response.success) {
            console.log('✅ Subscribed to tracking updates for', trackingNumber);
          }
        });
        
        return result.tracker;
      } else {
        throw new Error(result.error || 'Failed to get tracking info');
      }
    } catch (error) {
      console.error('❌ Failed to track package:', error);
      this.showError(`Failed to track package: ${error.message}`);
      throw error;
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Set up auto-refresh for dashboard data
   */
  setupAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      this.loadDashboardData();
    }, 30000);
  }

  /**
   * Utility: Update element content
   */
  updateElement(selector, content) {
    const el = document.querySelector(selector);
    if (el) {
      el.textContent = content;
    }
  }

  /**
   * Utility: Format status for display
   */
  formatStatus(status) {
    if (!status) return 'Unknown';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Utility: Normalize status for CSS classes
   */
  normalizeStatus(status) {
    const statusMap = {
      delivered: 'delivered',
      in_transit: 'in-transit',
      out_for_delivery: 'out-for-delivery',
      pre_transit: 'pending',
      failure: 'failed',
      cancelled: 'cancelled',
      unknown: 'unknown',
    };
    return statusMap[status] || 'unknown';
  }

  /**
   * Utility: Format date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Show loading indicator
   */
  showLoading(show, message = 'Loading...') {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
      const loaderText = loader.querySelector('.loader-text');
      if (loaderText) {
        loaderText.textContent = message;
      }
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('Error:', message);
    // You can implement a toast notification here
    alert(message); // Temporary - replace with better UI
  }

  /**
   * Show notification
   */
  showNotification(notification) {
    console.log('🔔 Notification:', notification);
    // Implement toast notification
    // For now, just log it
  }

  /**
   * Initialize UI components
   */
  initUI() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // Command palette keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
      if (e.key === 'Escape') {
        const palette = document.getElementById('command-palette');
        if (palette && !palette.classList.contains('hidden')) {
          this.toggleCommandPalette();
        }
      }
    });

    // Command palette backdrop click
    const paletteBackdrop = document.querySelector('.command-palette-backdrop');
    if (paletteBackdrop) {
      paletteBackdrop.addEventListener('click', () => this.toggleCommandPalette());
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadDashboardData());
    }
    
    console.log('✅ UI components initialized');
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    console.log('🎨 Theme switched to:', newTheme);
  }

  /**
   * Toggle command palette
   */
  toggleCommandPalette() {
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('command-input');
    
    if (palette) {
      const isHidden = palette.classList.contains('hidden');
      palette.classList.toggle('hidden');
      
      if (isHidden && input) {
        // Focus input when opening
        setTimeout(() => input.focus(), 100);
        this.renderCommandPalette();
      }
    }
  }

  /**
   * Render command palette options
   */
  renderCommandPalette() {
    const commands = [
      { icon: '📦', title: 'Create Shipment', description: 'Create a new shipment', action: () => alert('Create shipment form coming soon!') },
      { icon: '🔍', title: 'Track Package', description: 'Track a package by number', action: () => alert('Enter tracking number') },
      { icon: '🔄', title: 'Refresh Data', description: 'Reload dashboard data', action: () => this.loadDashboardData() },
      { icon: '🌓', title: 'Toggle Theme', description: 'Switch between light and dark mode', action: () => this.toggleTheme(), shortcut: 'Cmd+/' },
      { icon: '📊', title: 'View Analytics', description: 'Open analytics dashboard', action: () => alert('Analytics view coming soon!') },
      { icon: '⚙️', title: 'Settings', description: 'Open settings panel', action: () => alert('Settings coming soon!') },
    ];

    const resultsContainer = document.getElementById('command-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = commands.map((cmd, index) => `
      <div class="command-item" data-index="${index}">
        <span class="command-item-icon">${cmd.icon}</span>
        <div class="command-item-text">
          <div class="command-item-title">${cmd.title}</div>
          <div class="command-item-description">${cmd.description}</div>
        </div>
        ${cmd.shortcut ? `<span class="command-item-shortcut">${cmd.shortcut}</span>` : ''}
      </div>
    `).join('');

    // Add click handlers
    resultsContainer.querySelectorAll('.command-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        commands[index].action();
        this.toggleCommandPalette();
      });
    });
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting EasyPost Dashboard...');
  window.dashboard = new EasyPostDashboard();
});

// Make it available globally
window.EasyPostDashboard = EasyPostDashboard;

