# ⚡ Quick Start Guide - EasyPost MCP Server 2025

Get up and running in 5 minutes!

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ **Node.js 22.x** or higher ([Download](https://nodejs.org/))
- ✅ **Redis 7.x** or higher ([Install](https://redis.io/download))
- ✅ **EasyPost API Key** ([Get yours](https://www.easypost.com/account/api-keys))
- ✅ **Git** (for cloning)

---

## 🚀 Installation (5 minutes)

### Step 1: Clone and Install Dependencies (2 min)

```bash
# Clone the repository
cd ~/projects
git clone https://github.com/your-org/easypost-mcp-2025.git
cd easypost-mcp-2025

# Install dependencies
npm install
```

### Step 2: Configure Environment (1 min)

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env
```

**Minimal required configuration**:
```bash
# Add your EasyPost API key
EASYPOST_API_KEY=EZAK...your_key_here

# Redis connection (default should work locally)
REDIS_URL=redis://localhost:6379

# Set environment
NODE_ENV=development
```

### Step 3: Start Redis (30 sec)

```bash
# Option A: Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Option B: Local Redis
redis-server

# Option C: Already running? Skip this step!
```

### Step 4: Start the Server (30 sec)

```bash
# Development mode with hot reload
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║  🚀 Server is running!                                    ║
║                                                           ║
║  HTTP Server:  http://0.0.0.0:3000                       ║
║  Environment:  development                                ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 5: Verify Installation (30 sec)

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-10-07T...",
#   "uptime": 12.34,
#   "environment": "development"
# }
```

---

## 🎯 Your First API Call

### Create a Shipment

Create a file `test-shipment.js`:

```javascript
import ShipmentService from './src/services/ShipmentService.js';

async function createTestShipment() {
  try {
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

    console.log('✅ Shipment created!');
    console.log('ID:', shipment.id);
    console.log('Available rates:', shipment.rates.length);
    console.log('Cheapest rate:', shipment.rates[0]?.rate);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestShipment();
```

Run it:
```bash
node test-shipment.js
```

---

## 🔌 Real-time Tracking (Socket.IO)

### Client-side Example

Create `test-socket.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>EasyPost Real-time Tracking</title>
  <script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
</head>
<body>
  <h1>Real-time Tracking Test</h1>
  <input id="trackingNumber" placeholder="Enter tracking number" />
  <button onclick="subscribe()">Subscribe</button>
  <div id="status"></div>
  <div id="updates"></div>

  <script>
    const socket = io('http://localhost:3000/tracking');
    
    socket.on('connect', () => {
      console.log('Connected to tracking namespace');
      document.getElementById('status').innerHTML = 
        '✅ Connected to server';
    });

    function subscribe() {
      const trackingNumber = 
        document.getElementById('trackingNumber').value;
      
      socket.emit('subscribe', trackingNumber, (response) => {
        if (response.success) {
          document.getElementById('status').innerHTML = 
            `✅ Subscribed to ${trackingNumber}`;
        }
      });
    }

    socket.on('update', (data) => {
      const updates = document.getElementById('updates');
      updates.innerHTML = `
        <h3>Tracking Update</h3>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      ` + updates.innerHTML;
    });
  </script>
</body>
</html>
```

Open in browser:
```bash
open test-socket.html
# or just drag it to your browser
```

---

## 📊 Check the Logs

```bash
# View real-time logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log

# View debug logs (if LOG_LEVEL=debug)
tail -f logs/debug.log
```

---

## 🐳 Docker Quick Start (Alternative)

If you prefer Docker:

```bash
# Build
docker build -t easypost-mcp:latest .

# Run
docker run -d \
  -p 3000:3000 \
  -e EASYPOST_API_KEY=your_key \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  --name easypost-mcp \
  easypost-mcp:latest

# Check logs
docker logs -f easypost-mcp

# Stop
docker stop easypost-mcp
```

---

## 🔧 Common Issues & Solutions

### Issue: Redis Connection Failed

**Error**: `Error: Redis Client Error: connect ECONNREFUSED`

**Solution**:
```bash
# Make sure Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Issue: Port 3000 Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Option 1: Stop the process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
PORT=3001 npm run dev
```

### Issue: EasyPost API Key Invalid

**Error**: `Unauthorized: Invalid API Key`

**Solution**:
1. Check your `.env` file
2. Get a valid API key from [EasyPost Dashboard](https://www.easypost.com/account/api-keys)
3. Use **Test API Key** (starts with `EZAK`) for testing
4. Make sure there are no spaces or quotes around the key

---

## 📚 Next Steps

Now that you're running, explore:

1. **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)** - Understand the architecture
2. **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Learn about the improvements
3. **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** - See all features

### Learn by Example

```bash
# Check out the service examples
cat src/services/ShipmentService.js
cat src/services/TrackingService.js

# See Socket.IO namespaces
cat src/sockets/namespaces/tracking.js
cat src/sockets/namespaces/shipments.js

# Review middleware configuration
cat src/middleware/index.js
```

### Available Features

✅ **Shipment Management**
- Create shipments
- Buy shipping labels
- Get rates
- Refund shipments

✅ **Tracking**
- Real-time tracking updates
- Tracking history
- Status parsing

✅ **Real-time Communication**
- Tracking namespace
- Shipments namespace
- Notifications namespace
- Analytics namespace (optional)

✅ **Caching**
- Redis connection pooling
- Automatic caching strategies
- Cache invalidation

✅ **Logging**
- Structured Winston logs
- Multiple transports
- Log rotation
- Performance logging

---

## 🎓 Development Tips

### Hot Reload
```bash
# Uses Node.js --watch flag for instant reload
npm run dev
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Or edit .env
LOG_LEVEL=debug
```

### Check Configuration
```javascript
// In your code
import config from './src/config/index.js';

console.log('Redis Pool Size:', config.redis.poolSize);
console.log('Features:', config.features);
console.log('Environment:', config.env);
```

### Test Redis Connection
```bash
# Use Redis CLI
redis-cli

# Test connection
127.0.0.1:6379> PING
PONG

# Check keys created by the app
127.0.0.1:6379> KEYS *

# Get a specific key
127.0.0.1:6379> GET shipment:shp_123
```

---

## 🎉 Success Checklist

- [ ] ✅ Server starts without errors
- [ ] ✅ Health endpoint responds
- [ ] ✅ Redis connection established
- [ ] ✅ Logs are being written to `logs/`
- [ ] ✅ Can create a test shipment
- [ ] ✅ Socket.IO namespaces connect
- [ ] ✅ Tracking updates work

---

## 💡 Pro Tips

1. **Use VS Code**: Install the REST Client extension for easy API testing
2. **Monitor Redis**: Use `redis-cli MONITOR` to see all Redis operations
3. **Check Logs**: Keep a terminal with `tail -f logs/combined.log` open
4. **Hot Reload**: Make changes and see them instantly with `npm run dev`
5. **Docker Compose**: For production-like setup, use docker-compose

---

## 🆘 Getting Help

**Something not working?**

1. Check the logs: `logs/error.log`
2. Verify Redis: `redis-cli ping`
3. Test health endpoint: `curl http://localhost:3000/health`
4. Check environment variables in `.env`
5. Review error messages carefully

**Still stuck?**
- 📧 Email: support@example.com
- 🐛 GitHub Issues: Report bugs
- 💬 Discussions: Ask questions

---

## ⏱️ Estimated Time Investment

- **Quick Start**: 5 minutes
- **First Shipment**: +5 minutes
- **Socket.IO Test**: +5 minutes
- **Understanding Architecture**: +30 minutes
- **Building Your App**: The rest is up to you! 🚀

---

**🎊 Congratulations! You're ready to build amazing shipping experiences! 🎊**

---

**Happy Shipping! 📦✨**

