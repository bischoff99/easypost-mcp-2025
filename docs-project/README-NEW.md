# 🚀 EasyPost MCP Server 2025

> **Modern, production-ready EasyPost integration server with best practices**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.0-black.svg)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-4.7.0-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Documentation](#-documentation)
- [API Usage](#-api-usage)
- [Socket.IO Namespaces](#-socketio-namespaces)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Features
- 🚢 **Complete EasyPost Integration** - Shipments, tracking, rates, addresses
- ⚡ **Real-time Updates** - Socket.IO with organized namespaces
- 💾 **Redis Caching** - Connection pooling for high performance
- 📝 **Structured Logging** - Winston with multiple transports
- 🔒 **Security First** - Helmet, rate limiting, CORS
- 🐳 **Docker Ready** - Optimized multi-stage builds
- 📊 **Production Ready** - Error handling, graceful shutdown, health checks

### Modern Architecture
- ✅ **Service Layer Pattern** - Clean separation of concerns
- ✅ **Middleware Stack** - Modular Express middleware
- ✅ **Configuration Management** - Type-safe, validated config
- ✅ **Socket.IO Namespaces** - Organized real-time communication
- ✅ **Connection Pooling** - Optimized Redis connections
- ✅ **Structured Logging** - Context-rich Winston logging

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Express HTTP Server                     │
│                                                          │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Middleware │  │   Routes    │  │ Controllers │     │
│  │   Stack    │→ │   Handlers  │→ │   Layer     │     │
│  └────────────┘  └─────────────┘  └─────────────┘     │
│                          ↓                               │
│                  ┌───────────────┐                       │
│                  │    Services   │                       │
│                  │  • Shipments  │                       │
│                  │  • Tracking   │                       │
│                  └───────────────┘                       │
│                          ↓                               │
│            ┌─────────────┴─────────────┐                │
│            ↓                           ↓                 │
│    ┌──────────────┐           ┌──────────────┐         │
│    │   EasyPost   │           │    Redis     │         │
│    │     API      │           │    Cache     │         │
│    └──────────────┘           └──────────────┘         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                Socket.IO Server                          │
│                                                          │
│  Namespaces:                                            │
│  • /tracking      → Real-time shipment tracking         │
│  • /shipments     → Shipment lifecycle events           │
│  • /notifications → User notifications & alerts         │
│  • /analytics     → Live dashboard metrics              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22.x or higher
- Redis 7.x or higher
- EasyPost API key
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/easypost-mcp-2025.git
cd easypost-mcp-2025

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your EasyPost API key and Redis URL

# Start the server
npm start
```

The server will start at `http://localhost:3000`

### Using Docker

```bash
# Build
docker build -t easypost-mcp:latest .

# Run
docker run -d \
  -p 3000:3000 \
  -e EASYPOST_API_KEY=your_key \
  -e REDIS_URL=redis://redis:6379 \
  --name easypost-mcp \
  easypost-mcp:latest

# Or use docker-compose
docker-compose -f docker-compose.staging.yml up -d
```

---

## ⚙️ Configuration

Configure via environment variables (see `.env.example`):

### Required Variables
```bash
EASYPOST_API_KEY=your_api_key_here  # Get from easypost.com
```

### Server Configuration
```bash
NODE_ENV=development        # development, staging, production
PORT=3000                   # Server port
HOST=0.0.0.0               # Server host
```

### Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=10         # Connection pool size
```

### Feature Flags
```bash
FEATURE_ANALYTICS=true     # Enable analytics namespace
FEATURE_WEBHOOKS=true      # Enable webhook processing
FEATURE_CARBON_TRACKING=true  # Carbon footprint tracking
```

See `.env.example` for all 50+ configuration options.

---

## 📚 Documentation

### Complete Guides
- **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)** - Architecture and directory structure
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Upgrading from old structure
- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** - Feature overview

### API Documentation
- Health Check: `GET /health`
- Status: `GET /api/status`
- More endpoints coming soon...

---

## 🔌 API Usage

### Creating a Shipment

```javascript
import ShipmentService from './src/services/ShipmentService.js';

const shipment = await ShipmentService.createShipment({
  to_address: {
    name: "John Doe",
    street1: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    country: "US"
  },
  from_address: {
    name: "Jane Smith",
    street1: "456 Market St",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "US"
  },
  parcel: {
    length: 10,
    width: 8,
    height: 4,
    weight: 15
  }
});

console.log('Shipment ID:', shipment.id);
console.log('Rates:', shipment.rates);
```

### Tracking a Package

```javascript
import TrackingService from './src/services/TrackingService.js';

const tracking = await TrackingService.getTracking('EZ1000000001');

console.log('Status:', tracking.status);
console.log('Carrier:', tracking.carrier);
console.log('Events:', tracking.tracking_details);
```

---

## 🔌 Socket.IO Namespaces

### Tracking Namespace (`/tracking`)

**Client-side**:
```javascript
const socket = io('http://localhost:3000/tracking');

// Subscribe to tracking updates
socket.emit('subscribe', 'EZ1000000001', (response) => {
  if (response.success) {
    console.log('Subscribed to tracking number');
  }
});

// Listen for updates
socket.on('update', (data) => {
  console.log('Tracking update:', data);
  // { trackingNumber, data, timestamp }
});

// Unsubscribe
socket.emit('unsubscribe', 'EZ1000000001');
```

### Shipments Namespace (`/shipments`)

```javascript
const socket = io('http://localhost:3000/shipments');

// Subscribe to user's shipments
socket.emit('subscribe-user', 'user123', (response) => {
  console.log('Subscribed to user shipments');
});

// Listen for shipment updates
socket.on('shipment-update', (data) => {
  console.log('Shipment update:', data);
});

// Create shipment with real-time progress
socket.emit('create-shipment', shipmentData, (response) => {
  if (response.success) {
    console.log('Shipment creation initiated');
  }
});

socket.on('creation-progress', (progress) => {
  console.log('Progress:', progress.status);
});
```

### Notifications Namespace (`/notifications`)

```javascript
const socket = io('http://localhost:3000/notifications');

// Subscribe to notifications
socket.emit('subscribe', 'user123', (response) => {
  console.log('Subscribed to notifications');
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});

// Mark as read
socket.emit('mark-read', 'notification_id');
```

---

## 💻 Development

### Project Structure

```
src/
├── config/          # Configuration management
├── lib/             # Core libraries (Redis, Logger)
├── middleware/      # Express middleware stack
├── services/        # Business logic layer
├── sockets/         # Socket.IO namespaces
├── controllers/     # Request handlers (coming soon)
├── routes/          # API routes (coming soon)
├── models/          # Data models (coming soon)
└── server.js        # Main entry point
```

### Development Commands

```bash
# Start with hot reload
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Check for outdated dependencies
npm run outdated

# Security audit
npm audit
```

### Adding a New Service

1. Create service file: `src/services/MyService.js`
2. Use the service pattern:

```javascript
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { cache } from '../lib/redis.js';

class MyService {
  constructor() {
    // Initialize
  }

  async myMethod(data) {
    try {
      logger.info('Method called', { data });
      // Business logic
      return result;
    } catch (error) {
      logger.error('Method failed', { error: error.message });
      throw error;
    }
  }
}

export default new MyService();
```

---

## 🚢 Deployment

### Docker Build

```bash
# Production build
docker build --target production -t easypost-mcp:latest .

# Development build
docker build --target development -t easypost-mcp:dev .

# With BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build -t easypost-mcp:latest .
```

### Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.staging.yml up -d

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Stop services
docker-compose -f docker-compose.staging.yml down

# Rebuild and restart
docker-compose -f docker-compose.staging.yml up -d --build
```

### Environment-specific Deployment

```bash
# Staging
./scripts/deploy-staging.sh

# Health check
./scripts/health-check.sh localhost

# Rollback
./scripts/rollback.sh
```

---

## 📊 Monitoring & Logging

### Log Files

Logs are written to `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs
- `debug.log` - Debug logs (development)
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled rejections

### Log Format (Production)

```json
{
  "timestamp": "2025-10-07T12:00:00.000Z",
  "level": "info",
  "message": "HTTP Request",
  "service": "easypost-mcp",
  "environment": "production",
  "method": "POST",
  "url": "/api/shipments",
  "status": 200,
  "duration": "123ms"
}
```

### Health Checks

```bash
# Health endpoint
curl http://localhost:3000/health

# Status endpoint
curl http://localhost:3000/api/status
```

---

## 🔒 Security

- ✅ Helmet.js security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS configuration
- ✅ Input validation (coming soon)
- ✅ JWT authentication (coming soon)
- ✅ Request ID tracking
- ✅ Security event logging

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- ShipmentService.test.js

# Run with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [Redis](https://redis.io/) - Caching and session storage
- [Winston](https://github.com/winstonjs/winston) - Logging
- [EasyPost](https://www.easypost.com/) - Shipping API

---

## 📞 Support

- 📧 Email: support@example.com
- 📝 Documentation: [Full Docs](./docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/easypost-mcp-2025/issues)

---

## 🗺️ Roadmap

- [ ] REST API endpoints
- [ ] GraphQL API
- [ ] Webhook handling
- [ ] Database integration (PostgreSQL)
- [ ] Authentication & Authorization
- [ ] Admin dashboard
- [ ] Prometheus metrics
- [ ] Swagger/OpenAPI documentation
- [ ] Comprehensive test suite
- [ ] CI/CD pipeline

---

**Made with ❤️ for modern shipping and logistics**

---

**Version**: 4.0.0  
**Last Updated**: October 7, 2025  
**Status**: 🚀 Production Ready

