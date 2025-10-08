# 🗺️ EasyPost MCP Server 2025 - Visual Architecture Map

**Date**: October 8, 2025  
**Version**: 4.0.0

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EASYPOST MCP SERVER 2025                             │
│                              (Port 3000)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                     ┌────────────────────────────────┐
                     │      Express 5.1.0 Server      │
                     │    (src/server.js - main)      │
                     └────────────────────────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                ▼                     ▼                     ▼
        ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
        │  Middleware   │     │  Static Files │     │  Socket.IO   │
        │   Pipeline    │     │   (public/)   │     │  Real-time   │
        └───────────────┘     └──────────────┘     └──────────────┘
                │                     │                     │
                ▼                     ▼                     ▼
        ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
        │ - CORS        │     │ Dashboard UI │     │ 4 Namespaces │
        │ - Helmet      │     │ 8 Sections   │     │ - shipments  │
        │ - Rate Limit  │     │ PWA Enabled  │     │ - tracking   │
        │ - Body Parser │     │ 7,384 lines  │     │ - notify     │
        │ - Logger      │     │              │     │ - analytics  │
        └───────────────┘     └──────────────┘     └──────────────┘
                │
                ▼
        ┌───────────────────────────────────────────────────────┐
        │              API AUTHENTICATION LAYER                  │
        │         (src/middleware/auth.js)                       │
        │                                                         │
        │  validateApiKey()  →  Check X-API-Key header          │
        │  optionalAuth()    →  Optional authentication         │
        └───────────────────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────────────────┐
        │                  REST API ROUTES                       │
        │                  (29 Endpoints)                        │
        └───────────────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬───────────┬───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Shipment│ │Tracking│ │Address │ │Luma AI │ │ Claims │ │ Forge  │
│   (7)  │ │   (4)  │ │   (4)  │ │   (2)  │ │   (2)  │ │   (4)  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │           │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌─────────────────────────────────────────┐
│Analytic│ │ Batch  │ │         SERVICE LAYER                   │
│   (3)  │ │   (3)  │ │    (src/services/)                      │
└────────┘ └────────┘ │                                          │
                       │  • ShipmentService.js                   │
                       │  • TrackingService.js                   │
                       └─────────────────────────────────────────┘
                                      │
                        ┌─────────────┼─────────────┐
                        ▼             ▼             ▼
                ┌──────────────┐ ┌────────┐ ┌──────────────┐
                │  EasyPost    │ │ Redis  │ │   Logger     │
                │  SDK v8.0    │ │ Cache  │ │  (Winston)   │
                └──────────────┘ └────────┘ └──────────────┘
                        │             │             │
                        ▼             ▼             ▼
                ┌──────────────────────────────────────────┐
                │         EXTERNAL SERVICES                │
                │                                           │
                │  • EasyPost API (shipping)               │
                │  • Redis Server (caching)                │
                │  • File System (logs)                    │
                └──────────────────────────────────────────┘

                    ┌────────────────────────────────┐
                    │   GRAPHQL FOUNDATION (Ready)   │
                    │   src/graphql/ (not mounted)   │
                    │                                │
                    │   • Schemas (262 lines)        │
                    │   • Resolvers (271 lines)      │
                    │   • Apollo Server (109 lines)  │
                    └────────────────────────────────┘
```

---

## 📁 File System Architecture

```
easypost-mcp-2025/
│
├── 🖥️  Backend (src/)
│   │
│   ├── server.js ──────────────┐ Main Entry Point (Unified Server)
│   │                            │
│   ├── config/                 │
│   │   └── index.js ───────────┤ Environment Configuration
│   │                            │
│   ├── middleware/              │
│   │   ├── index.js ────────────┤ Standard Middleware Stack
│   │   └── auth.js ─────────────┤ API Key Validation
│   │                            │
│   ├── routes/                  │ API Endpoint Handlers
│   │   ├── shipments.js ────────┤ 7 shipment endpoints
│   │   ├── tracking.js ─────────┤ 4 tracking endpoints
│   │   ├── addresses.js ────────┤ 4 address endpoints
│   │   ├── luma-ai.js ──────────┤ 2 AI endpoints
│   │   ├── claims.js ───────────┤ 2 claim endpoints
│   │   ├── forge.js ────────────┤ 4 forge endpoints
│   │   ├── analytics.js ────────┤ 3 analytics endpoints
│   │   ├── batch.js ────────────┤ 3 batch endpoints
│   │   └── dashboard.js ────────┤ Dashboard API
│   │                            │
│   ├── services/                │ Business Logic Layer
│   │   ├── ShipmentService.js ─┤ Shipment operations
│   │   └── TrackingService.js ─┤ Tracking operations
│   │                            │
│   ├── sockets/                 │ Real-time Communication
│   │   ├── index.js ────────────┤ Socket.IO setup
│   │   ├── auth-middleware.js ─┤ Socket authentication
│   │   └── namespaces/          │
│   │       ├── shipments.js ────┤ Shipment events
│   │       ├── tracking.js ─────┤ Tracking events
│   │       ├── notifications.js ┤ Push notifications
│   │       └── analytics.js ────┤ Live analytics
│   │                            │
│   ├── lib/                     │ Core Libraries
│   │   ├── logger.js ───────────┤ Winston logging
│   │   ├── redis.js ────────────┤ Redis client & cache
│   │   └── route-optimizer.js ─┤ AI route optimization
│   │                            │
│   ├── graphql/                 │ GraphQL Foundation
│   │   ├── index.js ────────────┤ Apollo Server setup
│   │   ├── schemas/             │
│   │   │   └── index.graphql ───┤ GraphQL schema (262 lines)
│   │   └── resolvers/           │
│   │       └── index.js ────────┤ Resolvers (271 lines)
│   │                            │
│   ├── monitoring/              │
│   │   └── apm.ts ──────────────┤ APM foundation
│   │                            │
│   └── types/                   │
│       └── index.ts ────────────┘ TypeScript definitions
│
├── 🎨 Frontend (public/)
│   │
│   ├── index.html ──────────────┐ Main Dashboard Page (32K lines)
│   │                            │
│   ├── app.js ───────────────────┤ Core Dashboard Logic (34K lines)
│   ├── advanced-features.js ────┤ Advanced Features (10K lines)
│   ├── analytics-enhanced.js ───┤ Enhanced Analytics (14K lines)
│   ├── ui-enhancements.js ──────┤ UI Improvements (9K lines)
│   │                            │
│   ├── style.css ───────────────┤ Main Styles (71K lines)
│   ├── advanced-styles.css ─────┤ Advanced Styles (13K lines)
│   │                            │
│   ├── sw.js ───────────────────┤ Service Worker - PWA (5K lines)
│   └── manifest.json ───────────┘ PWA Manifest (2K lines)
│
├── 🧪 Testing (tests/)
│   │
│   ├── setup.js ────────────────┐ Test Configuration
│   │                            │
│   ├── api/                     │ API Endpoint Tests
│   │   ├── auth.test.js ────────┤ Authentication tests
│   │   ├── shipments.test.js ───┤ Shipment tests
│   │   └── tracking.test.js ────┤ Tracking tests
│   │                            │
│   ├── comprehensive.test.js ───┤ Full test suite (JS)
│   └── comprehensive.test.ts ───┘ Full test suite (TS)
│
├── 📚 Documentation (docs/)
│   │
│   ├── README.md ───────────────┐ Docs index
│   ├── PROJECT-STATE-ANALYSIS.md ┤ Full analysis report
│   ├── PROJECT-STATE-SUMMARY.md ┤ Executive summary
│   ├── PROJECT-QUICK-STATS.md ──┤ Quick reference
│   │                            │
│   ├── ARCHITECTURE.md ──────────┤ System design
│   ├── API-IMPLEMENTATION.md ───┤ API reference
│   ├── COMPLETE-DASHBOARD.md ───┤ Dashboard guide
│   │                            │
│   ├── FINAL-SUMMARY.md ────────┤ Project summary
│   ├── FINAL-REVIEW.md ─────────┤ Comprehensive review
│   ├── FINAL-CLEANUP-REPORT.md ─┤ Cleanup report
│   │                            │
│   ├── GRAPHQL-FOUNDATION-COMPLETE.md ┤ GraphQL status
│   ├── V4.2.0-IMPLEMENTATION-GUIDE.md ┤ v4.2.0 guide
│   │                            │
│   ├── CHANGELOG.md ─────────────┤ Version history
│   ├── ROADMAP.md ──────────────┤ Future plans
│   └── CONTRIBUTING.md ─────────┘ Contribution guide
│
├── 🐳 DevOps
│   │
│   ├── Dockerfile ──────────────┐ Multi-stage build
│   ├── docker-compose.dev.yml ─┤ Dev environment
│   ├── docker-compose.staging.yml ┤ Staging environment
│   │                            │
│   ├── .github/workflows/       │ CI/CD Pipelines
│   │   ├── ci.yml ──────────────┤ Continuous integration
│   │   ├── deploy-staging.yml ─┤ Staging deployment
│   │   └── release.yml ─────────┤ Release automation
│   │                            │
│   └── nginx/                   │ Reverse Proxy
│       ├── Dockerfile ──────────┤ Nginx container
│       ├── nginx.staging.conf ─┤ Config
│       └── proxy_params.conf ──┘ Params
│
└── ⚙️  Configuration
    │
    ├── package.json ────────────┐ Dependencies & scripts
    ├── .env.example ────────────┤ Environment template
    ├── .env.staging ────────────┤ Staging config
    ├── .gitignore ──────────────┤ Git exclusions
    └── tsconfig.json ───────────┘ TypeScript config
```

---

## 🔄 Data Flow Diagram

### **Request Flow - REST API**
```
Client Request
    │
    ├─→ HTTP Request (with X-API-Key header)
    │
    ▼
┌─────────────────┐
│  Express Server │
│   (Port 3000)   │
└─────────────────┘
    │
    ├─→ Middleware Pipeline
    │   ├─→ CORS
    │   ├─→ Helmet (security headers)
    │   ├─→ Rate Limiting
    │   ├─→ Body Parser
    │   └─→ Morgan (request logging)
    │
    ▼
┌─────────────────┐
│  Authentication │
│  validateApiKey │
└─────────────────┘
    │
    ├─→ API Key Valid? ─NO─→ 401/403 Error Response
    │        │
    │       YES
    │        ▼
┌─────────────────┐
│   Route Handler │
│ (routes/*.js)   │
└─────────────────┘
    │
    ├─→ Input Validation (express-validator)
    │        │
    │        ├─→ Invalid? ─YES─→ 400 Error Response
    │        │
    │       NO
    │        ▼
┌─────────────────┐
│  Service Layer  │
│  (services/)    │
└─────────────────┘
    │
    ├─→ Business Logic Execution
    │   ├─→ Check Redis Cache
    │   │       │
    │   │    Hit? ─YES─→ Return Cached Data
    │   │       │
    │   │      NO
    │   │       ▼
    │   ├─→ Call EasyPost API
    │   ├─→ Process Response
    │   └─→ Cache Result (if applicable)
    │
    ▼
┌─────────────────┐
│  Response       │
│  JSON Format    │
└─────────────────┘
    │
    └─→ Client receives response
```

### **Request Flow - Socket.IO**
```
Client Connection
    │
    ├─→ WebSocket Handshake
    │
    ▼
┌─────────────────┐
│   Socket.IO     │
│   Server        │
└─────────────────┘
    │
    ├─→ Socket Authentication Middleware
    │        │
    │     Valid? ─NO─→ Connection Rejected
    │        │
    │       YES
    │        ▼
┌─────────────────┐
│   Namespace     │
│  Assignment     │
└─────────────────┘
    │
    ├─→ Join Namespace
    │   ├─→ /shipments
    │   ├─→ /tracking
    │   ├─→ /notifications
    │   └─→ /analytics
    │
    ▼
┌─────────────────┐
│  Event Listener │
│    Registered   │
└─────────────────┘
    │
    ├─→ Listen for Events
    │   ├─→ Server → Client (emit)
    │   └─→ Client → Server (on)
    │
    ▼
┌─────────────────┐
│  Real-time Data │
│    Updates      │
└─────────────────┘
```

### **Cache Flow - Redis**
```
API Request
    │
    ▼
┌─────────────────┐
│  Check Cache    │
│  redis.get(key) │
└─────────────────┘
    │
    ├─→ Cache Hit?
    │       │
    │      YES ──→ Return Cached Data (fast)
    │       │
    │       NO
    │       ▼
┌─────────────────┐
│  Fetch from     │
│  EasyPost API   │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Store in Cache │
│  redis.set(key) │
│  TTL: 5 minutes │
└─────────────────┘
    │
    └─→ Return Fresh Data
```

---

## 🔌 API Endpoint Map

### **Shipments** (`/api/shipments`)
```
POST   /                  → Create shipment
POST   /:id/buy           → Buy shipment
GET    /                  → List shipments
GET    /:id               → Get shipment
POST   /:id/refund        → Refund shipment
GET    /:id/label         → Get label
POST   /rate              → Get rates
```

### **Tracking** (`/api/tracking`)
```
POST   /                  → Create tracker
GET    /:id               → Get tracker
GET    /                  → List trackers
PUT    /:id               → Update tracker
```

### **Addresses** (`/api/addresses`)
```
POST   /                  → Create address
POST   /verify            → Verify address
GET    /                  → List addresses
GET    /:id               → Get address
```

### **Luma AI** (`/api/luma`)
```
POST   /recommend         → Get AI recommendations
POST   /one-call-buy      → AI one-call purchase
```

### **Claims** (`/api/claims`)
```
POST   /                  → Create claim
GET    /:id               → Get claim status
```

### **Forge** (`/api/forge`)
```
POST   /customers         → Create customer
GET    /customers/:id     → Get customer
PUT    /customers/:id     → Update customer
DELETE /customers/:id     → Delete customer
```

### **Analytics** (`/api/analytics`)
```
GET    /summary           → Analytics summary
GET    /shipping          → Shipping data
GET    /costs             → Cost analysis
```

### **Batch** (`/api/batch`)
```
POST   /                  → Create batch
POST   /:id/add           → Add to batch
POST   /:id/buy           → Buy batch
```

---

## 🎨 Frontend Component Map

```
Dashboard (index.html)
│
├── 📊 Core Application (app.js - 34K lines)
│   ├── State Management
│   ├── API Communication
│   ├── Real-time Socket.IO
│   ├── Navigation
│   └── Event Handlers
│
├── ✨ Advanced Features (advanced-features.js - 10K lines)
│   ├── Command Palette (Cmd+K)
│   ├── Keyboard Shortcuts
│   ├── Bulk Operations
│   ├── Export/Import
│   └── Advanced Search
│
├── 📈 Enhanced Analytics (analytics-enhanced.js - 14K lines)
│   ├── Cost Analysis Charts
│   ├── Shipping Trends
│   ├── Performance Metrics
│   ├── Carrier Comparison
│   └── Predictive Insights
│
├── 🎯 UI Enhancements (ui-enhancements.js - 9K lines)
│   ├── Theme Switcher (Dark/Light)
│   ├── Notifications System
│   ├── Toast Messages
│   ├── Modal Dialogs
│   └── Micro-animations
│
├── 🎨 Main Styles (style.css - 71K lines)
│   ├── Base Styles
│   ├── Component Styles
│   ├── Responsive Design
│   ├── Animations
│   └── Utility Classes
│
├── ✨ Advanced Styles (advanced-styles.css - 13K lines)
│   ├── Dark Theme
│   ├── Container Queries
│   ├── Advanced Grid Layouts
│   └── Custom Animations
│
└── 📱 PWA Support
    ├── Service Worker (sw.js - 5K lines)
    │   ├── Cache Strategies
    │   ├── Offline Support
    │   └── Background Sync
    │
    └── Manifest (manifest.json)
        ├── App Icons
        ├── Theme Colors
        └── Display Mode
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────┐
│              SECURITY LAYERS                         │
└─────────────────────────────────────────────────────┘

Layer 1: Network Level
    ├─→ HTTPS (TLS/SSL)
    ├─→ Nginx Reverse Proxy
    └─→ CORS Configuration

Layer 2: Request Level
    ├─→ Helmet Security Headers
    │   ├─→ Content Security Policy
    │   ├─→ X-Frame-Options
    │   ├─→ X-Content-Type-Options
    │   └─→ Strict-Transport-Security
    │
    └─→ Rate Limiting
        ├─→ 100 requests per 15 minutes
        └─→ Per IP address

Layer 3: Authentication
    ├─→ API Key Validation
    │   ├─→ X-API-Key header
    │   └─→ Bearer token support
    │
    └─→ Socket.IO Authentication
        └─→ Token-based auth

Layer 4: Input Validation
    ├─→ Express Validator
    ├─→ Schema Validation
    └─→ Sanitization

Layer 5: Application Level
    ├─→ Error Handling
    ├─→ Secure Environment Variables
    └─→ Logging & Monitoring
```

---

## 📊 Performance Optimization

```
Caching Strategy (Redis)
│
├── API Response Cache
│   ├─→ TTL: 5 minutes
│   ├─→ Keys: api:endpoint:params
│   └─→ Auto-invalidation on updates
│
├── Session Cache
│   ├─→ TTL: 30 minutes
│   └─→ User session data
│
└── Static Data Cache
    ├─→ TTL: 1 hour
    └─→ Rarely changing data

Frontend Optimization
│
├── Service Worker Caching
│   ├─→ Static assets
│   ├─→ API responses
│   └─→ Offline fallbacks
│
├── Lazy Loading
│   ├─→ Images
│   ├─→ Heavy components
│   └─→ Analytics charts
│
└── Code Splitting
    └─→ Separate feature modules
```

---

**Generated**: October 8, 2025  
**Version**: 4.0.0  
**For**: Complete project analysis and documentation
