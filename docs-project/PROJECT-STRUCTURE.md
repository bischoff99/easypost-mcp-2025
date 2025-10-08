# EasyPost MCP Server 2025 - Project Structure

## 📁 Directory Structure

```
easypost-mcp-2025/
├── src/                          # Source code directory
│   ├── config/                   # Configuration management
│   │   └── index.js             # Centralized config with env validation
│   │
│   ├── lib/                      # Core libraries and utilities
│   │   ├── redis.js             # Redis connection pool & cache helpers
│   │   └── logger.js            # Winston logger with structured logging
│   │
│   ├── middleware/               # Express middleware
│   │   └── index.js             # Security, CORS, rate limiting, etc.
│   │
│   ├── services/                 # Business logic layer
│   │   ├── ShipmentService.js   # Shipment operations
│   │   └── TrackingService.js   # Tracking operations
│   │
│   ├── sockets/                  # Socket.IO implementation
│   │   ├── index.js             # Socket.IO server initialization
│   │   └── namespaces/          # Socket.IO namespaces
│   │       ├── tracking.js      # Real-time tracking updates
│   │       ├── shipments.js     # Shipment lifecycle events
│   │       ├── notifications.js # User notifications
│   │       └── analytics.js     # Real-time analytics
│   │
│   ├── controllers/              # Request handlers (to be added)
│   ├── routes/                   # Express routes (to be added)
│   ├── models/                   # Data models (to be added)
│   ├── utils/                    # Utility functions
│   ├── constants/                # Application constants
│   └── server.js                 # Main server entry point
│
├── web/                          # Frontend static files
├── logs/                         # Application logs
├── nginx/                        # Nginx configuration
├── scripts/                      # Utility scripts
├── tests/                        # Test files
├── docs/                         # Documentation
│
├── .dockerignore                 # Docker ignore patterns
├── .env.example                  # Environment variables template
├── Dockerfile                    # Docker build configuration
├── docker-compose.staging.yml   # Docker Compose for staging
├── package.json                  # Node.js dependencies
└── README.md                     # Project documentation
```

## 🏗️ Architecture Overview

### **Configuration Layer** (`src/config/`)
- **Centralized configuration** management
- Environment variable validation
- Type-safe configuration object
- Feature flags support

### **Library Layer** (`src/lib/`)
- **Redis**: Connection pooling, caching utilities, transaction support
- **Logger**: Structured logging with Winston, multiple transports

### **Middleware Layer** (`src/middleware/`)
- **Security**: Helmet, CORS
- **Performance**: Compression, rate limiting
- **Logging**: Request/response logging
- **Error handling**: Centralized error handling

### **Service Layer** (`src/services/`)
- **Business logic** encapsulation
- **API integration** with EasyPost
- **Caching strategies**
- **Error handling and logging**

### **Socket.IO Layer** (`src/sockets/`)
- **Namespace-based** architecture
- **Real-time communication** for:
  - Tracking updates
  - Shipment lifecycle
  - Notifications
  - Analytics (optional)

## 🔧 Key Technologies

### Backend
- **Node.js 22.x** - Latest LTS runtime
- **Express 5.1.0** - Web framework with latest features
- **Socket.IO 4.8.0** - Real-time WebSocket communication
- **Redis 4.7.0** - Caching and session storage
- **Winston 3.x** - Structured logging

### EasyPost Integration
- **@easypost/api 8.0.0** - Official EasyPost SDK

### Security & Performance
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **compression** - Response compression
- **CORS** - Cross-origin resource sharing

## 🚀 Best Practices Implemented

### 1. **Configuration Management**
```javascript
import config from './config/index.js';

// All config centralized and type-safe
console.log(config.redis.poolSize);
console.log(config.features.analytics);
```

### 2. **Redis Connection Pooling**
```javascript
import { cache } from './lib/redis.js';

// Simple cache operations
await cache.set('key', data, 3600);
const data = await cache.get('key');
```

### 3. **Structured Logging**
```javascript
import logger from './lib/logger.js';

// Context-rich logging
logger.info('User action', { userId, action, timestamp });
logger.logPerformance('api_call', duration, metadata);
```

### 4. **Socket.IO Namespaces**
```javascript
// Client-side
const trackingSocket = io('/tracking');
trackingSocket.emit('subscribe', trackingNumber);

// Server-side
namespace.to(`tracking:${trackingNumber}`).emit('update', data);
```

### 5. **Service Layer Pattern**
```javascript
import ShipmentService from './services/ShipmentService.js';

// Clean, testable business logic
const shipment = await ShipmentService.createShipment(data);
```

## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
EASYPOST_API_KEY=your_api_key_here

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=10

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
JWT_SECRET=your_secret_here
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
FEATURE_ANALYTICS=true
FEATURE_LUMA_AI=false
```

## 🔄 Migration from Old Structure

The old structure had files in the root:
- `server-2025.js` → `src/server.js`
- Inline configuration → `src/config/index.js`
- Mixed concerns → Separated into layers

Benefits:
- ✅ Better separation of concerns
- ✅ Easier testing and maintenance
- ✅ Scalable architecture
- ✅ Production-ready patterns

## 🧪 Testing Structure (To Be Added)

```
tests/
├── unit/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── integration/
│   ├── api/
│   └── sockets/
└── e2e/
```

## 📦 Deployment

### Docker Build
```bash
docker build -t easypost-mcp:latest .
```

### Docker Compose
```bash
docker-compose -f docker-compose.staging.yml up -d
```

## 🔐 Security Features

- ✅ Helmet.js security headers
- ✅ Rate limiting per IP
- ✅ CORS configuration
- ✅ Input validation (via middleware)
- ✅ Error sanitization in production
- ✅ Request ID tracking
- ✅ Security event logging

## 📊 Performance Features

- ✅ Redis connection pooling
- ✅ Response compression
- ✅ Auto-pipelining for Redis commands
- ✅ Efficient Socket.IO namespaces
- ✅ Request timing middleware
- ✅ Cache invalidation strategies

## 🎯 Next Steps

1. Add route handlers (`src/routes/`)
2. Add controllers (`src/controllers/`)
3. Add data models (`src/models/`)
4. Add comprehensive tests
5. Add API documentation (Swagger/OpenAPI)
6. Add monitoring and metrics (Prometheus)
7. Add health checks for all services

---

**Last Updated**: 2025-10-07
**Version**: 4.0.0

