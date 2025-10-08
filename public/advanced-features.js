/**
 * Advanced Dashboard Features
 * Enhanced functionality and UX improvements
 */

class AdvancedFeatures {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.init();
  }

  init() {
    this.setupAutoRefresh();
    this.setupKeyboardShortcuts();
    this.setupNotifications();
    this.setupBulkOperations();
    this.setupExportFeatures();
  }

  /**
   * Auto-refresh dashboard data
   */
  setupAutoRefresh() {
    let autoRefreshInterval;
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    
    if (autoRefreshToggle) {
      autoRefreshToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          autoRefreshInterval = setInterval(() => {
            this.dashboard.loadStats();
            this.dashboard.showToast('info', 'Auto-refresh', 'Dashboard data refreshed');
          }, 30000); // Every 30 seconds
        } else {
          clearInterval(autoRefreshInterval);
        }
      });
    }
  }

  /**
   * Enhanced keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K already handled by command palette
      
      // Cmd/Ctrl + N - New Shipment
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        this.dashboard.openModal('modal-create-shipment');
      }

      // Cmd/Ctrl + T - Track Package
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        this.dashboard.openModal('modal-track-package');
      }

      // Cmd/Ctrl + / - Help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        this.showKeyboardShortcutsModal();
      }

      // Escape - Close current modal
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.active');
        if (openModal) {
          this.dashboard.closeModal(openModal.id);
        }
      }

      // Arrow keys for navigation
      if (e.altKey && e.key === 'ArrowLeft') {
        this.navigateSectionPrev();
      }
      if (e.altKey && e.key === 'ArrowRight') {
        this.navigateSectionNext();
      }
    });
  }

  /**
   * Desktop notifications
   */
  setupNotifications() {
    // Request permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Listen for important events
    if (this.dashboard.sockets.shipments) {
      this.dashboard.sockets.shipments.on('shipment:created', (data) => {
        this.showDesktopNotification('Shipment Created', 
          `New shipment to ${data.to_address?.city || 'destination'}`);
      });

      this.dashboard.sockets.shipments.on('label:purchased', (data) => {
        this.showDesktopNotification('Label Purchased', 
          `Tracking: ${data.tracking_code}`);
      });
    }

    if (this.dashboard.sockets.tracking) {
      this.dashboard.sockets.tracking.on('status:delivered', (data) => {
        this.showDesktopNotification('Package Delivered', 
          `${data.tracking_code} has been delivered!`);
      });
    }
  }

  showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }

  /**
   * Bulk operations
   */
  setupBulkOperations() {
    const bulkSelectAll = document.getElementById('bulk-select-all');
    const bulkActions = document.getElementById('bulk-actions');

    if (bulkSelectAll) {
      bulkSelectAll.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.shipment-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        this.updateBulkActionsUI();
      });
    }

    // Bulk action buttons
    const bulkBuyBtn = document.getElementById('bulk-buy-labels');
    if (bulkBuyBtn) {
      bulkBuyBtn.addEventListener('click', () => this.bulkBuyLabels());
    }

    const bulkExportBtn = document.getElementById('bulk-export');
    if (bulkExportBtn) {
      bulkExportBtn.addEventListener('click', () => this.bulkExport());
    }
  }

  updateBulkActionsUI() {
    const selected = document.querySelectorAll('.shipment-checkbox:checked').length;
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    
    if (selected > 0) {
      bulkActionsBar.classList.add('visible');
      document.getElementById('bulk-selected-count').textContent = selected;
    } else {
      bulkActionsBar.classList.remove('visible');
    }
  }

  async bulkBuyLabels() {
    const selected = Array.from(document.querySelectorAll('.shipment-checkbox:checked'))
      .map(cb => cb.dataset.shipmentId);

    if (selected.length === 0) return;

    this.dashboard.showToast('info', 'Processing', `Buying ${selected.length} labels...`);

    // Use batch API
    try {
      const response = await fetch(`${this.dashboard.API_BASE_URL}/api/batch/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.dashboard.getApiKey(),
        },
        body: JSON.stringify({
          shipment_ids: selected,
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.dashboard.showToast('success', 'Success', `${selected.length} labels purchased!`);
        this.dashboard.loadShipments();
      }
    } catch (error) {
      this.dashboard.showToast('error', 'Error', 'Bulk operation failed');
    }
  }

  /**
   * Export features
   */
  setupExportFeatures() {
    const exportBtn = document.getElementById('export-shipments');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToCSV());
    }
  }

  exportToCSV() {
    const shipments = this.dashboard.data.shipments;
    
    if (!shipments || shipments.length === 0) {
      this.dashboard.showToast('warning', 'No Data', 'No shipments to export');
      return;
    }

    // Create CSV
    const headers = ['ID', 'Tracking Code', 'From City', 'To City', 'Carrier', 'Status', 'Cost', 'Created'];
    const rows = shipments.map(s => [
      s.id,
      s.tracking_code || 'N/A',
      s.from?.city || 'N/A',
      s.to?.city || 'N/A',
      s.carrier || 'N/A',
      s.status || 'N/A',
      s.rate || '0.00',
      new Date(s.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easypost-shipments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.dashboard.showToast('success', 'Exported', `${shipments.length} shipments exported to CSV`);
  }

  bulkExport() {
    const selected = Array.from(document.querySelectorAll('.shipment-checkbox:checked'))
      .map(cb => cb.dataset.shipmentId);

    if (selected.length === 0) {
      this.dashboard.showToast('warning', 'No Selection', 'Select shipments to export');
      return;
    }

    const selectedShipments = this.dashboard.data.shipments.filter(s => 
      selected.includes(s.id)
    );

    // Create CSV
    const headers = ['ID', 'Tracking Code', 'From', 'To', 'Carrier', 'Cost'];
    const rows = selectedShipments.map(s => [
      s.id,
      s.tracking_code || 'N/A',
      `${s.from?.city}, ${s.from?.state}`,
      `${s.to?.city}, ${s.to?.state}`,
      s.carrier || 'N/A',
      s.rate || '0.00',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-shipments-${Date.now()}.csv`;
    a.click();

    this.dashboard.showToast('success', 'Exported', `${selected.length} shipments exported`);
  }

  /**
   * Navigate sections with keyboard
   */
  navigateSectionPrev() {
    const sections = ['dashboard', 'shipments', 'tracking', 'luma-ai', 'claims', 'forge', 'analytics', 'batch'];
    const currentIndex = sections.indexOf(this.dashboard.currentSection);
    const prevIndex = (currentIndex - 1 + sections.length) % sections.length;
    this.dashboard.showSection(sections[prevIndex]);
  }

  navigateSectionNext() {
    const sections = ['dashboard', 'shipments', 'tracking', 'luma-ai', 'claims', 'forge', 'analytics', 'batch'];
    const currentIndex = sections.indexOf(this.dashboard.currentSection);
    const nextIndex = (currentIndex + 1) % sections.length;
    this.dashboard.showSection(sections[nextIndex]);
  }

  /**
   * Show keyboard shortcuts modal
   */
  showKeyboardShortcutsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'modal-keyboard-shortcuts';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button class="btn-icon" onclick="this.closest('.modal').classList.remove('active')">✕</button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-grid">
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl</kbd> + <kbd>K</kbd>
              <span>Open command palette</span>
            </div>
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl</kbd> + <kbd>N</kbd>
              <span>New shipment</span>
            </div>
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl</kbd> + <kbd>T</kbd>
              <span>Track package</span>
            </div>
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl</kbd> + <kbd>/</kbd>
              <span>Show shortcuts</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>←</kbd>
              <span>Previous section</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>→</kbd>
              <span>Next section</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd>
              <span>Close modal</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Initialize when dashboard is ready
window.AdvancedFeatures = AdvancedFeatures;
