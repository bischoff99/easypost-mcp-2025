/**
 * UI Enhancements
 * Advanced UI components and interactions
 */

class UIEnhancements {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.init();
  }

  init() {
    this.setupTooltips();
    this.setupDragAndDrop();
    this.setupInfiniteScroll();
    this.setupContextMenus();
    this.setupQuickActions();
  }

  /**
   * Enhanced tooltips
   */
  setupTooltips() {
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;

      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = target.dataset.tooltip;
      tooltip.style.position = 'absolute';
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
      document.body.appendChild(tooltip);

      target.addEventListener('mouseout', () => tooltip.remove(), { once: true });
    });
  }

  /**
   * Drag and drop file upload
   */
  setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.file-drop-zone');

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        await this.handleFileUpload(files);
      });
    });
  }

  async handleFileUpload(files) {
    const csvFile = files.find(f => f.name.endsWith('.csv'));
    if (!csvFile) {
      this.dashboard.showToast('warning', 'Invalid File', 'Please upload a CSV file');
      return;
    }

    this.dashboard.showLoading(true, 'Processing CSV file...');

    try {
      const text = await csvFile.text();
      const rows = this.parseCSV(text);
      
      this.dashboard.showToast('success', 'CSV Loaded', `${rows.length} rows parsed`);
      this.showCSVPreview(rows);
    } catch (error) {
      this.dashboard.showToast('error', 'Error', 'Failed to parse CSV');
    } finally {
      this.dashboard.showLoading(false);
    }
  }

  parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i]?.trim() || '';
        return obj;
      }, {});
    });
  }

  showCSVPreview(rows) {
    // Implementation for CSV preview modal
    console.log('CSV Preview:', rows);
  }

  /**
   * Infinite scroll for large lists
   */
  setupInfiniteScroll() {
    const shipmentsTable = document.getElementById('shipments-table');
    if (!shipmentsTable) return;

    let page = 1;
    let loading = false;

    shipmentsTable.addEventListener('scroll', async () => {
      if (loading) return;

      const { scrollTop, scrollHeight, clientHeight } = shipmentsTable;
      
      // Load more when 100px from bottom
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loading = true;
        await this.loadMoreShipments(++page);
        loading = false;
      }
    });
  }

  async loadMoreShipments(page) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/shipments/list?page=${page}&page_size=20`,
        {
          headers: { 'X-API-Key': this.dashboard.getApiKey() },
        }
      );

      const result = await response.json();

      if (result.success && result.data.shipments) {
        this.dashboard.data.shipments.push(...result.data.shipments);
        this.dashboard.updateShipmentsTable(this.dashboard.data.shipments);
      }
    } catch (error) {
      console.error('Failed to load more shipments:', error);
    }
  }

  /**
   * Context menus (right-click)
   */
  setupContextMenus() {
    document.addEventListener('contextmenu', (e) => {
      const shipmentRow = e.target.closest('[data-shipment-id]');
      if (!shipmentRow) return;

      e.preventDefault();
      this.showContextMenu(e.pageX, e.pageY, shipmentRow.dataset.shipmentId);
    });

    // Close context menu on click
    document.addEventListener('click', () => {
      const contextMenu = document.querySelector('.context-menu');
      if (contextMenu) contextMenu.remove();
    });
  }

  showContextMenu(x, y, shipmentId) {
    // Remove existing menu
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.innerHTML = `
      <div class="context-menu-item" onclick="viewShipmentDetails('${shipmentId}')">
        👁️ View Details
      </div>
      <div class="context-menu-item" onclick="copyTrackingNumber('${shipmentId}')">
        📋 Copy Tracking
      </div>
      <div class="context-menu-item" onclick="downloadLabel('${shipmentId}')">
        📄 Download Label
      </div>
      <div class="context-menu-item" onclick="refundShipment('${shipmentId}')">
        💸 Refund
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" onclick="deleteShipment('${shipmentId}')">
        🗑️ Delete
      </div>
    `;

    document.body.appendChild(menu);
  }

  /**
   * Quick actions floating button
   */
  setupQuickActions() {
    const fab = document.createElement('div');
    fab.className = 'fab';
    fab.innerHTML = `
      <button class="fab-main" title="Quick Actions">
        ⚡
      </button>
      <div class="fab-actions">
        <button class="fab-action" onclick="dashboard.openModal('modal-create-shipment')" title="New Shipment">
          📦
        </button>
        <button class="fab-action" onclick="dashboard.openModal('modal-track-package')" title="Track">
          📍
        </button>
        <button class="fab-action" onclick="dashboard.openModal('modal-submit-claim')" title="Claim">
          🛡️
        </button>
        <button class="fab-action" onclick="refreshAllData()" title="Refresh">
          🔄
        </button>
      </div>
    `;

    document.body.appendChild(fab);

    // Toggle actions
    const fabMain = fab.querySelector('.fab-main');
    fabMain.addEventListener('click', () => {
      fab.classList.toggle('open');
    });
  }

  /**
   * Smart table with sorting, filtering, pagination
   */
  enhanceTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Add sorting to headers
    const headers = table.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const field = header.dataset.sortable;
        this.sortTable(table, field);
      });
    });
  }

  sortTable(table, field) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const sorted = rows.sort((a, b) => {
      const aValue = a.querySelector(`[data-field="${field}"]`)?.textContent || '';
      const bValue = b.querySelector(`[data-field="${field}"]`)?.textContent || '';
      return aValue.localeCompare(bValue);
    });

    tbody.innerHTML = '';
    sorted.forEach(row => tbody.appendChild(row));
  }

  /**
   * Progressive web app features
   */
  setupPWA() {
    // Service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registered'))
        .catch(err => console.log('❌ Service Worker failed:', err));
    }

    // Install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      const installBtn = document.getElementById('install-pwa');
      if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User ${outcome} the install prompt`);
          deferredPrompt = null;
        });
      }
    });
  }
}

// Global helper functions
window.viewShipmentDetails = (shipmentId) => {
  console.log('View details:', shipmentId);
};

window.copyTrackingNumber = (shipmentId) => {
  const shipment = dashboard.data.shipments.find(s => s.id === shipmentId);
  if (shipment?.tracking_code) {
    navigator.clipboard.writeText(shipment.tracking_code);
    dashboard.showToast('success', 'Copied', 'Tracking number copied to clipboard');
  }
};

window.downloadLabel = async (shipmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/label`, {
      headers: { 'X-API-Key': dashboard.getApiKey() },
    });
    const result = await response.json();
    
    if (result.success && result.data.labelUrl) {
      window.open(result.data.labelUrl, '_blank');
    }
  } catch (error) {
    dashboard.showToast('error', 'Error', 'Failed to download label');
  }
};

window.refreshAllData = () => {
  dashboard.loadDashboardData();
  dashboard.showToast('success', 'Refreshed', 'Dashboard data refreshed');
};

window.UIEnhancements = UIEnhancements;
