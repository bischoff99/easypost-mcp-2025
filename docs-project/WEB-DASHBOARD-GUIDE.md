# 🌐 Web Dashboard Guide

**Complete guide to the EasyPost Web Dashboard**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Features](#features)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)

---

## 🎯 Overview

The EasyPost Web Dashboard is a modern, real-time web interface for managing your shipping operations. Built with vanilla JavaScript, it features:

- Modern 2025 design aesthetic
- Real-time updates via Socket.IO
- Dark/Light mode support
- Fully responsive design
- Command palette for quick actions
- Progressive Web App capabilities

---

## 🚀 Getting Started

### **Quick Start**

```bash
# 1. Start the backend API server
npm start

# 2. In another terminal, start the web dashboard
npm run web

# Or start both together
npm run both
```

### **Access**
- **Dashboard**: http://localhost:8080
- **API**: http://localhost:3000
- **Socket.IO**: Connected automatically

---

## 🏗️ Architecture

### **Stack**

```
┌─────────────────────────────────────────┐
│         Web Browser (Client)            │
│  ┌───────────────────────────────────┐  │
│  │   index.html                      │  │
│  │   + app.js (JavaScript)           │  │
│  │   + style.css (Styling)           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                   ↓ ↑
              HTTP + WebSocket
                   ↓ ↑
┌─────────────────────────────────────────┐
│     Web Dashboard Server (Node.js)      │
│  ┌───────────────────────────────────┐  │
│  │   src/web-server.js               │  │
│  │   + Express (Static files)        │  │
│  │   + Socket.IO (Real-time)         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                   ↓ ↑
              HTTP API Calls
                   ↓ ↑
┌─────────────────────────────────────────┐
│      API Server (Backend)               │
│  ┌───────────────────────────────────┐  │
│  │   src/server.js                   │  │
│  │   + Services (Business Logic)     │  │
│  │   + Redis (Caching)               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### **Files Structure**

```
Web Dashboard Components:
├── public/                  # Static files
│   ├── index.html          # Main HTML
│   ├── app.js              # Client JavaScript
│   ├── style.css           # Styling
│   └── README.md           # Dashboard docs
│
├── src/
│   └── web-server.js       # Dashboard server
│
└── src/sockets/            # Real-time features
    └── namespaces/         # Socket.IO namespaces
```

---

## ✨ Features

### **1. Dashboard Overview**
- Real-time statistics
- Today's shipments
- Active tracking
- Quick actions

### **2. Shipment Management**
- Create shipments
- View rates
- Buy labels
- Manage shipments

### **3. Real-time Tracking**
- Live tracking updates
- Delivery status
- Tracking history
- Status notifications

### **4. Analytics**
- Shipping statistics
- Cost analysis
- Performance metrics
- Trends visualization

### **5. Command Palette**
Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux):
- Quick navigation
- Search shipments
- Execute actions
- Keyboard shortcuts

### **6. Theme System**
- **Light Mode**: Clean and bright
- **Dark Mode**: Easy on the eyes
- **Auto Mode**: Follows system preference
- Toggle with `Cmd+/` or `Ctrl+/`

---

## ⚙️ Configuration

### **Environment Variables**

Create `.env` file:

```bash
# API Server
PORT=3000
HOST=0.0.0.0

# Web Dashboard
WEB_PORT=8080
WEB_HOST=0.0.0.0

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# EasyPost
EASYPOST_API_KEY=your_api_key_here
```

### **Dashboard Configuration**

Edit `public/app.js`:

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';

// Dashboard Settings
const REFRESH_INTERVAL = 30000; // 30 seconds
const THEME_PREFERENCE = 'auto'; // 'light', 'dark', or 'auto'
```

---

## 💻 Development

### **Local Development**

```bash
# Terminal 1: Start API server with hot reload
npm run dev

# Terminal 2: Start web dashboard
npm run web

# Or use concurrently (both servers)
npm run both
```

### **File Watching**

For automatic reload during development:

```bash
# Install live-server (optional)
npm install -g live-server

# Serve public directory
cd public
live-server --port=8080
```

### **Making Changes**

#### **HTML Changes** (`public/index.html`)
```html
<!-- Add new section -->
<section class="dashboard-section">
  <h2>My New Section</h2>
  <!-- Your content -->
</section>
```

#### **JavaScript Changes** (`public/app.js`)
```javascript
// Add new functionality
function myNewFeature() {
  // Your code
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  myNewFeature();
});
```

#### **CSS Changes** (`public/style.css`)
```css
/* Add new styles */
.my-new-component {
  /* Your styles */
}
```

---

## 🎨 Design System

### **Colors**

```css
/* Light Mode */
--primary: #A47C48;        /* Mocha Mousse */
--background: #FAFBFC;     /* Light background */
--text: #1F2937;           /* Dark text */
--border: #E5E7EB;         /* Light border */

/* Dark Mode */
--primary: #A47C48;        /* Mocha Mousse */
--background: #1F2937;     /* Dark background */
--text: #F9FAFB;           /* Light text */
--border: #374151;         /* Dark border */
```

### **Typography**

```css
/* Fonts */
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Sizes */
--text-xs: 0.75rem;        /* 12px */
--text-sm: 0.875rem;       /* 14px */
--text-base: 1rem;         /* 16px */
--text-lg: 1.125rem;       /* 18px */
--text-xl: 1.25rem;        /* 20px */
```

### **Spacing**

```css
/* Spacing scale */
--space-1: 0.25rem;        /* 4px */
--space-2: 0.5rem;         /* 8px */
--space-3: 0.75rem;        /* 12px */
--space-4: 1rem;           /* 16px */
--space-6: 1.5rem;         /* 24px */
--space-8: 2rem;           /* 32px */
```

---

## 🔌 Socket.IO Integration

### **Client-side Connection**

```javascript
// In public/app.js
const socket = io('http://localhost:3000');

// Connect to namespaces
const trackingSocket = io('/tracking');
const shipmentsSocket = io('/shipments');
const notificationsSocket = io('/notifications');

// Listen for updates
trackingSocket.on('update', (data) => {
  updateTrackingUI(data);
});

shipmentsSocket.on('shipment-update', (data) => {
  updateShipmentUI(data);
});

notificationsSocket.on('notification', (data) => {
  showNotification(data);
});
```

### **Real-time Features**

1. **Live Tracking Updates**
   - Automatic status updates
   - No page refresh needed
   - Toast notifications

2. **Shipment Status Changes**
   - Label generation progress
   - Payment confirmations
   - Error alerts

3. **Dashboard Statistics**
   - Live count updates
   - Real-time metrics
   - Auto-refreshing charts

---

## 🚢 Deployment

### **Production Build**

```bash
# Build assets
npm run build

# Build web specifically
npm run build:web
```

### **Docker Deployment**

```bash
# Build image
docker build -t easypost-web:latest .

# Run web dashboard
docker run -d \
  -p 8080:8080 \
  -e WEB_PORT=8080 \
  -e PORT=3000 \
  --env-file .env \
  easypost-web:latest
```

### **Docker Compose**

Already configured in `docker-compose.staging.yml`:

```yaml
web-dashboard:
  build:
    context: .
    dockerfile: Dockerfile
    target: production
  ports:
    - "8080:8080"
  environment:
    - WEB_PORT=8080
    - NODE_ENV=production
```

---

## 📊 Analytics & Monitoring

### **Dashboard Metrics**

The dashboard tracks:
- Page views
- User interactions
- Error rates
- Performance metrics

### **Performance**

Lighthouse scores (target):
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

Test with:
```bash
npm run performance
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Dashboard won't load**
```bash
# Check if server is running
ps aux | grep node

# Check port availability
lsof -i :8080

# Restart server
npm run web
```

#### **Socket.IO not connecting**
```bash
# Check browser console
# Should see: "Connected to Socket.IO"

# Verify backend is running
curl http://localhost:3000/health

# Check WebSocket support
# Modern browsers support WebSocket
```

#### **Styling broken**
```bash
# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Check CSS file loaded
# Open browser dev tools > Network tab
# Should see style.css loaded
```

---

## 🧪 Testing

### **Manual Testing Checklist**

- [ ] Dashboard loads correctly
- [ ] All sections visible
- [ ] Socket.IO connects
- [ ] Real-time updates work
- [ ] Command palette opens (Cmd+K)
- [ ] Theme toggle works
- [ ] Responsive on mobile
- [ ] No console errors

### **Automated Testing**

```bash
# Run web tests
npm run test:web

# Run integration tests
npm run test:integration
```

---

## 💡 Tips & Best Practices

1. **Performance**
   - Minimize API calls
   - Use caching effectively
   - Optimize images and assets
   - Enable compression

2. **Security**
   - Validate all inputs
   - Sanitize display data
   - Use HTTPS in production
   - Implement CSP headers

3. **UX**
   - Show loading states
   - Handle errors gracefully
   - Provide feedback
   - Use animations sparingly

4. **Accessibility**
   - Use semantic HTML
   - Add ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers

---

## 📚 Additional Resources

- **Main Docs**: ../README.md
- **API Docs**: docs-project/IMPLEMENTATION-SUMMARY.md
- **Quick Start**: docs-project/QUICK-START.md
- **Public Folder Docs**: public/README.md

---

**Version**: 4.0.0  
**Last Updated**: October 7, 2025  
**Status**: Production Ready

