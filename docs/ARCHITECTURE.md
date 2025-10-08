# 🏗️ EasyPost MCP Server 2025 - Complete Architecture

## 🎯 **System Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED SERVER (Port 3000)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Node.js 22 + Express 5                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Web Dashboard  │  │   API Layer      │  │  Socket.IO   │  │
│  │  (Public)       │  │   (Protected)    │  │  (Real-time) │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│           ↓                    ↓                     ↓          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Service Layer (Business Logic)             │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↓                    ↓                     ↓          │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Redis Cache  │  │  EasyPost API   │  │  File System    │  │
│  │ (Optional)   │  │  (External)     │  │  (Logs/Temp)    │  │
│  └──────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 **Request Flow**

### **1. Web Dashboard Request**
```
Browser → http://localhost:3000
  ↓
Express Static Middleware
  ↓
Serves: public/index.html
        public/app.js
        public/style.css
  ↓
Dashboard Loads in Browser
```

### **2. API Request from Dashboard**
```
Dashboard JS → fetch('http://localhost:3000/api/shipments/create')
  ↓
Express Router
  ↓
validateApiKey Middleware
  ↓
Rate Limiting (100 req/15min)
  ↓
Request Validation
  ↓
ShipmentsRoute Handler
  ↓
ShipmentService (Business Logic)
  ↓
EasyPost API Client
  ↓
Redis Cache (if available)
  ↓
Response to Dashboard
```

### **3. Real-time Update Flow**
```
Event Occurs (Shipment Created)
  ↓
Socket.IO Server
  ↓
io.to('/shipments').emit('shipment:created', data)
  ↓
All Connected Clients Receive Update
  ↓
Dashboard Updates UI in Real-time
```

---

## 🗂️ **Directory Structure**

```
easypost-mcp-2025/
├── src/                        # Source code
│   ├── server.js              # 🌟 Unified server (API + Dashboard)
│   ├── config/                # Configuration
│   │   └── index.js          # Environment variables
│   ├── middleware/            # Express middleware
│   │   ├── index.js          # Standard middleware
│   │   └── auth.js           # API key validation
│   ├── routes/                # API endpoints
│   │   ├── shipments.js      # 7 endpoints
│   │   ├── tracking.js       # 4 endpoints
│   │   ├── addresses.js      # 4 endpoints
│   │   ├── luma-ai.js        # 2 endpoints
│   │   ├── claims.js         # 2 endpoints
│   │   ├── forge.js          # 4 endpoints
│   │   ├── analytics.js      # 3 endpoints
│   │   ├── batch.js          # 3 endpoints
│   │   └── dashboard.js      # Dashboard data API
│   ├── services/              # Business logic
│   │   ├── shipment.service.js
│   │   └── tracking.service.js
│   ├── sockets/               # Socket.IO setup
│   │   └── index.js
│   └── lib/                   # Utilities
│       ├── logger.js
│       └── redis.js
│
├── public/                     # Web dashboard (served by Express)
│   ├── index.html             # Main page (1,100+ lines)
│   ├── app.js                 # Dashboard logic (1,125+ lines)
│   ├── style.css              # Styles (2,897+ lines)
│   └── favicon.ico
│
├── tests/                      # Test suite
│   ├── setup.js
│   └── api/                   # API tests
│       ├── auth.test.js
│       ├── shipments.test.js
│       └── tracking.test.js
│
├── deployment/                 # Production configs
│   ├── docker-compose.staging.yml
│   └── nginx/
│       └── nginx.staging.conf
│
├── .github/workflows/          # CI/CD
│   ├── ci.yml                 # Build, test, lint
│   ├── deploy-staging.yml     # Auto deployment
│   └── release.yml            # GitHub releases
│
├── docker-compose.dev.yml      # Development environment
├── Dockerfile                  # Multi-stage build
├── package.json               # Dependencies
├── .env.example               # Environment template
└── README.md                  # Documentation
```

---

## 🔌 **Component Connections**

### **MCP Server ↔ Web Dashboard**

#### **Serving Static Files**
```javascript
// src/server.js
const publicPath = join(__dirname, '../public');
app.use(express.static(publicPath, {
  maxAge: config.isProduction ? '1d' : 0,
  etag: true,
  lastModified: true,
}));
```

#### **Dashboard Calling API**
```javascript
// public/app.js
const API_BASE_URL = window.location.origin; // Same server!

// Creates shipment
await fetch(`${API_BASE_URL}/api/shipments/create`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': this.getApiKey(), // From localStorage
  },
  body: JSON.stringify(shipmentData),
});
```

#### **Real-time Updates**
```javascript
// src/server.js (Socket.IO setup)
const io = initializeSocketIO(httpServer);

// public/app.js (Dashboard connection)
this.sockets.main = io(SOCKET_URL);
this.sockets.shipments = io(`${SOCKET_URL}/shipments`);
this.sockets.tracking = io(`${SOCKET_URL}/tracking`);
```

---

## 🔐 **Authentication Flow**

### **API Key Storage**
```javascript
// Dashboard stores API key in localStorage
localStorage.setItem('easypost_api_key', userEnteredKey);

// Retrieved for each API call
getApiKey() {
  return localStorage.getItem('easypost_api_key') || '';
}
```

### **Middleware Validation**
```javascript
// src/middleware/auth.js
export function validateApiKey(req, res, next) {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate against EASYPOST_API_KEY
  if (apiKey !== process.env.EASYPOST_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next(); // Authorized!
}
```

### **Protected Routes**
```javascript
// src/server.js
// ✅ Protected (requires API key)
app.use('/api/shipments', validateApiKey, shipmentsRoutes);
app.use('/api/tracking', validateApiKey, trackingRoutes);

// ✅ Public (no API key needed)
app.use('/api/dashboard', dashboardRoutes);
app.use(express.static(publicPath));
```

---

## 📡 **API Endpoint Map**

### **Complete API Structure**
```
http://localhost:3000
│
├── /                           (Web Dashboard - HTML/CSS/JS)
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── /health                     (Health check)
├── /api/status                 (API status)
│
├── /api/dashboard/*            (Dashboard data - no auth)
│   ├── GET /stats
│   ├── GET /recent
│   └── GET /activities
│
├── /api/shipments/*            (Shipments - requires auth)
│   ├── POST /create            (Create shipment)
│   ├── POST /buy               (Buy label)
│   ├── GET /list               (List shipments)
│   ├── GET /:id                (Get shipment)
│   ├── POST /rate              (Get rates)
│   ├── POST /refund            (Refund shipment)
│   └── POST /label             (Generate label)
│
├── /api/tracking/*             (Tracking - requires auth)
│   ├── POST /create            (Create tracker)
│   ├── GET /:id                (Get tracker)
│   ├── GET /list               (List trackers)
│   └── PUT /:id                (Update tracker)
│
├── /api/addresses/*            (Addresses - requires auth)
│   ├── POST /create            (Create address)
│   ├── POST /verify            (Verify address)
│   ├── GET /list               (List addresses)
│   └── GET /:id                (Get address)
│
├── /api/luma/*                 (Luma AI - requires auth)
│   ├── POST /recommend         (AI recommendations)
│   └── POST /one-call-buy      (AI auto-purchase)
│
├── /api/claims/*               (Claims - requires auth)
│   ├── POST /create            (Submit claim)
│   └── GET /:id                (Get claim status)
│
├── /api/forge/*                (Forge - requires auth)
│   ├── POST /customers         (Create customer)
│   ├── GET /customers/:id      (Get customer)
│   ├── PUT /customers/:id      (Update customer)
│   └── DELETE /customers/:id   (Delete customer)
│
├── /api/analytics/*            (Analytics - requires auth)
│   ├── GET /summary            (Overview)
│   ├── GET /shipping           (Shipping data)
│   └── GET /cost               (Cost analysis)
│
└── /api/batch/*                (Batch - requires auth)
    ├── POST /create            (Create batch)
    ├── POST /:id/add           (Add to batch)
    └── POST /:id/buy           (Buy batch)
```

---

## 🎨 **Dashboard Sections**

### **8 Main Sections**
```
1. 📊 Dashboard     → Overview, stats, recent activity
2. 📦 Shipments     → Create, buy, list, manage shipments
3. 📍 Tracking      → Track packages, real-time updates
4. 🤖 Luma AI       → AI recommendations, one-call-buy
5. 🛡️  Claims       → File insurance claims
6. 🔨 Forge         → Customer management, white-label
7. 📈 Analytics     → Charts, reports, cost analysis
8. 📚 Batch         → Batch operations, bulk processing
```

### **6 Interactive Modals**
```
1. Create Shipment  → Multi-step form for shipment creation
2. Rate Shopping    → Compare carrier rates
3. Shipment Details → View complete shipment info
4. Track Package    → Real-time tracking updates
5. Submit Claim     → Insurance claim form
6. Create Customer  → Forge customer setup
```

---

## ⚡ **Performance Optimizations**

### **1. Redis Caching**
```javascript
// Cache shipment data for 5 minutes
await redisClient.setEx(
  `shipment:${id}`,
  300,
  JSON.stringify(shipment)
);

// Check cache before API call
const cached = await redisClient.get(`shipment:${id}`);
if (cached) return JSON.parse(cached);
```

### **2. Rate Limiting**
```javascript
// API endpoints: 100 requests / 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
});

// Dashboard: 1000 requests / 15 minutes
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
```

### **3. Compression**
```javascript
// Gzip compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
}));
```

### **4. Static File Caching**
```javascript
// Cache static files for 1 day in production
app.use(express.static(publicPath, {
  maxAge: config.isProduction ? '1d' : 0,
}));
```

---

## 🚀 **Deployment Architecture**

### **Development**
```
┌─────────────────────────────────────┐
│  Docker Compose (Dev)               │
│  ┌───────────────────────────────┐  │
│  │  api-dev (port 3000)          │  │
│  │  - Hot reload enabled         │  │
│  │  - Source code mounted        │  │
│  │  - Debug port exposed         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  redis (port 6379)            │  │
│  │  - Persistent volume          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### **Staging/Production**
```
┌─────────────────────────────────────────────┐
│  Nginx (Reverse Proxy)                      │
│  ┌───────────────────────────────────────┐  │
│  │  SSL Termination                      │  │
│  │  Rate Limiting                        │  │
│  │  Static File Caching                  │  │
│  └───────────────────────────────────────┘  │
│           ↓                                  │
│  ┌───────────────────────────────────────┐  │
│  │  EasyPost Server (port 3000)         │  │
│  │  - API + Dashboard                    │  │
│  │  - Socket.IO                          │  │
│  │  - Health checks                      │  │
│  └───────────────────────────────────────┘  │
│           ↓                                  │
│  ┌───────────────────────────────────────┐  │
│  │  Redis (port 6379)                    │  │
│  │  - Session storage                    │  │
│  │  - API response cache                 │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🧪 **Testing Strategy**

### **Test Layers**
```
┌─────────────────────────────────┐
│  E2E Tests (Puppeteer)          │
│  - Full user workflows          │
│  - Dashboard interactions       │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  API Tests (Supertest)          │
│  - Endpoint testing             │
│  - Authentication               │
│  - Response validation          │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Unit Tests (Node test runner)  │
│  - Service logic                │
│  - Utility functions            │
│  - Data validation              │
└─────────────────────────────────┘
```

### **CI/CD Pipeline**
```
GitHub Push
  ↓
GitHub Actions (ci.yml)
  ↓
┌─────────────────────┐
│  1. Install deps    │
│  2. Run linter      │
│  3. Run tests       │
│  4. Security audit  │
│  5. Build Docker    │
└─────────────────────┘
  ↓
Deploy (deploy-staging.yml)
  ↓
┌─────────────────────┐
│  1. Build image     │
│  2. Push to GHCR    │
│  3. Deploy staging  │
│  4. Health check    │
│  5. Notify team     │
└─────────────────────┘
```

---

## 📊 **Monitoring & Logging**

### **Winston Logger**
```javascript
logger.info('Shipment created', { id, carrier });
logger.error('API call failed', { error, endpoint });
logger.debug('Cache hit', { key, ttl });
```

### **Health Checks**
```javascript
// /health endpoint
{
  status: 'healthy',
  uptime: 123456,
  memory: { used: 280, total: 512 },
  redis: 'connected',
  timestamp: '2025-10-08T...'
}
```

### **Socket.IO Events**
```javascript
// Track connection status
io.on('connection', (socket) => {
  logger.info('Client connected', { id: socket.id });
});

// Monitor errors
socket.on('error', (error) => {
  logger.error('Socket error', { error });
});
```

---

## 🎯 **Key Achievements**

### **Unified Architecture**
✅ Single server for API + Dashboard  
✅ No CORS configuration needed  
✅ Shared resources and cache  
✅ Simplified deployment

### **Complete Feature Set**
✅ 29 API endpoints fully implemented  
✅ 8 dashboard sections with rich UI  
✅ Real-time updates via Socket.IO  
✅ AI-powered features (Luma AI)  
✅ White-label support (Forge)

### **Production Ready**
✅ Docker multi-stage builds  
✅ GitHub Actions CI/CD  
✅ Comprehensive testing  
✅ Security hardened  
✅ Performance optimized  
✅ Fully documented

---

## 📚 **Documentation Index**

- `README.md` - Main documentation
- `SERVER-MERGE.md` - Server merge details
- `ARCHITECTURE.md` - This file
- `DASHBOARD-STATUS.md` - Dashboard features
- `COMPLETE-DASHBOARD.md` - Dashboard implementation
- `FINAL-CLEANUP-REPORT.md` - Cleanup details
- `.env.example` - Environment variables
- `.github/workflows/README.md` - CI/CD docs

---

**Last Updated**: October 8, 2025  
**Version**: 4.0.0  
**Status**: 🟢 Production Ready
