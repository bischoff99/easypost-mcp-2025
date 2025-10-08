/**
 * Enhanced Analytics Features
 * Advanced charts, visualizations, and insights
 */

class EnhancedAnalytics {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = {};
    this.init();
  }

  init() {
    console.log('📊 Initializing Enhanced Analytics...');
  }

  /**
   * Create real-time cost trend chart
   */
  createCostTrendChart(canvasId, data) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: [{
          label: 'Daily Shipping Cost',
          data: data.values || [],
          borderColor: '#2c5f2d',
          backgroundColor: 'rgba(44, 95, 45, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => `$${context.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value}`,
            },
          },
        },
      },
    });
  }

  /**
   * Create carrier distribution pie chart
   */
  createCarrierChart(canvasId, data) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const carrierColors = {
      'USPS': '#1e3a8a',
      'UPS': '#92400e',
      'FedEx': '#4c1d95',
      'DHL': '#991b1b',
      'Other': '#64748b',
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels || [],
        datasets: [{
          data: data.values || [],
          backgroundColor: data.labels?.map(label => carrierColors[label] || carrierColors.Other) || [],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create delivery status timeline
   */
  createStatusTimelineChart(canvasId, data) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pre-Transit', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Failed'],
        datasets: [{
          label: 'Package Count',
          data: [
            data.pre_transit || 0,
            data.in_transit || 0,
            data.out_for_delivery || 0,
            data.delivered || 0,
            data.returned || 0,
            data.failure || 0,
          ],
          backgroundColor: [
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6',
            '#10b981',
            '#ef4444',
            '#6b7280',
          ],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  /**
   * Create heatmap for shipping volume by day/hour
   */
  createShippingHeatmap(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    let html = '<div class="heatmap-grid">';
    
    // Create grid
    days.forEach((day, dayIdx) => {
      html += `<div class="heatmap-row">`;
      html += `<div class="heatmap-label">${day}</div>`;
      
      hours.forEach((hour) => {
        const value = data[dayIdx]?.[hour] || 0;
        const intensity = Math.min(value / 10, 1); // Normalize to 0-1
        html += `
          <div class="heatmap-cell" 
               style="background-color: rgba(44, 95, 45, ${intensity})"
               title="${day} ${hour}:00 - ${value} shipments">
          </div>
        `;
      });
      
      html += `</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Advanced filtering
   */
  setupAdvancedFilters() {
    const filterPanel = document.getElementById('advanced-filters');
    if (!filterPanel) return;

    // Date range filter
    const startDate = document.getElementById('filter-start-date');
    const endDate = document.getElementById('filter-end-date');

    // Carrier filter
    const carrierFilter = document.getElementById('filter-carrier');

    // Status filter
    const statusFilter = document.getElementById('filter-status');

    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.applyFilters({
          startDate: startDate?.value,
          endDate: endDate?.value,
          carrier: carrierFilter?.value,
          status: statusFilter?.value,
        });
      });
    }

    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        if (carrierFilter) carrierFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        this.dashboard.loadShipments();
      });
    }
  }

  applyFilters(filters) {
    let filtered = [...this.dashboard.data.shipments];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(s => 
        new Date(s.created_at) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(s => 
        new Date(s.created_at) <= new Date(filters.endDate)
      );
    }

    // Filter by carrier
    if (filters.carrier) {
      filtered = filtered.filter(s => s.carrier === filters.carrier);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    this.dashboard.updateShipmentsTable(filtered);
    this.dashboard.showToast('success', 'Filtered', `Showing ${filtered.length} shipments`);
  }

  /**
   * Live search functionality
   */
  setupLiveSearch() {
    const searchInput = document.getElementById('dashboard-search');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300); // Debounce 300ms
    });
  }

  performSearch(query) {
    if (!query || query.length < 2) {
      this.dashboard.updateShipmentsTable(this.dashboard.data.shipments);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = this.dashboard.data.shipments.filter(s => 
      s.id?.toLowerCase().includes(lowerQuery) ||
      s.tracking_code?.toLowerCase().includes(lowerQuery) ||
      s.to?.city?.toLowerCase().includes(lowerQuery) ||
      s.from?.city?.toLowerCase().includes(lowerQuery) ||
      s.carrier?.toLowerCase().includes(lowerQuery)
    );

    this.dashboard.updateShipmentsTable(filtered);
    
    const searchResults = document.getElementById('search-results-count');
    if (searchResults) {
      searchResults.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Compare rates across carriers
   */
  async compareRates(shipmentData) {
    this.dashboard.showLoading(true, 'Comparing rates across all carriers...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/shipments/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.dashboard.getApiKey(),
        },
        body: JSON.stringify(shipmentData),
      });

      const result = await response.json();

      if (result.success && result.data.rates) {
        this.showRateComparisonModal(result.data.rates);
      }
    } catch (error) {
      this.dashboard.showToast('error', 'Error', 'Failed to compare rates');
    } finally {
      this.dashboard.showLoading(false);
    }
  }

  showRateComparisonModal(rates) {
    // Group by carrier
    const byCarrier = rates.reduce((acc, rate) => {
      if (!acc[rate.carrier]) {
        acc[rate.carrier] = [];
      }
      acc[rate.carrier].push(rate);
      return acc;
    }, {});

    // Find cheapest and fastest
    const cheapest = rates.reduce((min, rate) => 
      parseFloat(rate.rate) < parseFloat(min.rate) ? rate : min
    );

    const fastest = rates.reduce((min, rate) => 
      rate.delivery_days < min.delivery_days ? rate : min
    );

    let html = '<div class="rate-comparison">';
    html += `<div class="comparison-summary">`;
    html += `<div class="summary-card cheapest">`;
    html += `<h4>💰 Cheapest</h4>`;
    html += `<div class="carrier">${cheapest.carrier}</div>`;
    html += `<div class="price">$${cheapest.rate}</div>`;
    html += `<div class="service">${cheapest.service}</div>`;
    html += `</div>`;
    html += `<div class="summary-card fastest">`;
    html += `<h4>⚡ Fastest</h4>`;
    html += `<div class="carrier">${fastest.carrier}</div>`;
    html += `<div class="days">${fastest.delivery_days} days</div>`;
    html += `<div class="service">${fastest.service}</div>`;
    html += `</div>`;
    html += `</div>`;

    Object.entries(byCarrier).forEach(([carrier, carrierRates]) => {
      html += `<div class="carrier-group">`;
      html += `<h4>${carrier}</h4>`;
      carrierRates.forEach(rate => {
        html += `
          <div class="rate-card" onclick="selectRate('${rate.id}')">
            <div class="rate-service">${rate.service}</div>
            <div class="rate-price">$${rate.rate}</div>
            <div class="rate-delivery">${rate.delivery_days} days</div>
          </div>
        `;
      });
      html += `</div>`;
    });

    html += '</div>';

    // Show in modal
    const modalBody = document.querySelector('#modal-rate-shopping .modal-body');
    if (modalBody) {
      modalBody.innerHTML = html;
      this.dashboard.openModal('modal-rate-shopping');
    }
  }

  /**
   * Predictive analytics
   */
  async getPredictiveInsights() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/predictions`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.dashboard.getApiKey(),
        },
      });

      const result = await response.json();

      if (result.success) {
        this.displayPredictions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  }

  displayPredictions(predictions) {
    const container = document.getElementById('predictions-container');
    if (!container) return;

    let html = '<div class="predictions-grid">';

    if (predictions.nextDayVolume) {
      html += `
        <div class="prediction-card">
          <div class="prediction-icon">📈</div>
          <div class="prediction-title">Tomorrow's Volume</div>
          <div class="prediction-value">${predictions.nextDayVolume}</div>
          <div class="prediction-confidence">${predictions.volumeConfidence}% confidence</div>
        </div>
      `;
    }

    if (predictions.peakHours) {
      html += `
        <div class="prediction-card">
          <div class="prediction-icon">⏰</div>
          <div class="prediction-title">Peak Hours</div>
          <div class="prediction-value">${predictions.peakHours.join(', ')}</div>
          <div class="prediction-subtitle">Best time to ship</div>
        </div>
      `;
    }

    if (predictions.costSavings) {
      html += `
        <div class="prediction-card">
          <div class="prediction-icon">💰</div>
          <div class="prediction-title">Potential Savings</div>
          <div class="prediction-value">$${predictions.costSavings}</div>
          <div class="prediction-subtitle">By optimizing carriers</div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Generate custom reports
   */
  async generateCustomReport(reportType) {
    this.dashboard.showLoading(true, `Generating ${reportType} report...`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/${reportType}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.dashboard.getApiKey(),
        },
      });

      const result = await response.json();

      if (result.success) {
        this.downloadReport(result.data, reportType);
      }
    } catch (error) {
      this.dashboard.showToast('error', 'Error', 'Failed to generate report');
    } finally {
      this.dashboard.showLoading(false);
    }
  }

  downloadReport(data, reportType) {
    // Convert to CSV or PDF
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easypost-${reportType}-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.dashboard.showToast('success', 'Report Ready', `${reportType} report downloaded`);
  }

  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

window.EnhancedAnalytics = EnhancedAnalytics;
