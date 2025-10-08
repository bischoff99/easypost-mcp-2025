# 🔧 Troubleshooting Guide - Dashboard Not Loading

**Issue**: Web dashboard not loading  
**Date**: October 7, 2025

---

## ✅ **Diagnostics Completed**

### **Server Status** ✅
```bash
✅ Web server running on port 8080
✅ Health endpoint responding
✅ Redis connected  
✅ HTML being served correctly
✅ JavaScript being served correctly
✅ CSS being served correctly
```

### **Files Verified** ✅
```bash
✅ public/index.html (227 lines) - Real data version
✅ public/app.js (558 lines) - Real data integration  
✅ public/style.css - Being served
```

---

## 🔍 **What "Not Loading" Means**

The dashboard might have different issues. Let's check each:

### **Scenario 1: Blank White Page**
**Cause**: JavaScript error preventing page render

**Solution**:
```bash
# Open browser console (F12)
# Check for errors in Console tab
# Common issues:
# - Socket.IO not loaded
# - CSS not loading  
# - JavaScript syntax error
```

### **Scenario 2: Shows "Loading..." Forever**
**Cause**: API endpoints not responding

**Test**:
```bash
# Check if API is working
curl http://localhost:8080/api/dashboard/stats

# Should return JSON with your shipment data
```

**Solution**:
- Ensure both servers running: `npm run both`
- Check Redis is running: `redis-cli ping`
- Check logs: `tail -f logs/error.log`

### **Scenario 3: Connection Refused**
**Cause**: Server not running

**Solution**:
```bash
# Start the servers
npm run both

# Check if running
curl http://localhost:8080/health
```

### **Scenario 4: Shows Demo Data Instead of Real Data**
**Cause**: Wrong version of files

**Solution**:
```bash
# Run activation script
./activate-real-data.sh

# Or manually
cd public
mv index.html index-demo.html
mv app.js app-demo.js  
cp index-real-data.html index.html
cp app-real-data.js app.js
```

---

## 🧪 **Quick Diagnostic**

Run this diagnostic:

```bash
# 1. Check server running
curl http://localhost:8080/health

# 2. Check HTML loads
curl http://localhost:8080/ | head -10

# 3. Check API works  
curl http://localhost:8080/api/dashboard/stats

# 4. Check Redis
redis-cli ping

# 5. Check logs
tail -20 logs/error.log
```

---

## ✅ **Step-by-Step Fix**

### **Step 1: Ensure Servers Running**
```bash
# Stop any existing processes
pkill -f "node src/server.js"
pkill -f "node src/web-server.js"

# Start fresh
npm run both
```

### **Step 2: Verify Redis**
```bash
# Check if running
docker ps | grep redis

# If not running, start it
docker run -d -p 6379:6379 --name easypost-redis redis:7-alpine

# Test connection
redis-cli ping
# Should return: PONG
```

### **Step 3: Test Endpoints**
```bash
# Health check
curl http://localhost:8080/health

# Dashboard stats (real data!)
curl http://localhost:8080/api/dashboard/stats

# Recent shipments
curl http://localhost:8080/api/dashboard/shipments/recent?limit=5
```

### **Step 4: Open in Browser**
```bash
# Open dashboard
open http://localhost:8080

# Or manually visit:
# http://localhost:8080
```

### **Step 5: Check Browser Console**
Press `F12` in browser, go to Console tab, check for:
- ✅ No red errors
- ✅ "Connected to tracking namespace"
- ✅ "Dashboard data loaded"

---

## 🌐 **Browser-Specific Issues**

### **Firefox/Chrome/Safari**
```bash
# Clear cache
# Chrome/Firefox: Ctrl+Shift+Delete
# Safari: Cmd+Option+E

# Hard refresh
# Chrome/Firefox: Ctrl+Shift+R
# Safari: Cmd+Shift+R
```

### **Check Browser Console**
Look for these messages:
```javascript
✅ "🚀 Initializing EasyPost Dashboard with real data..."
✅ "✅ Connected to tracking namespace"
✅ "✅ Dashboard data loaded"
```

If you see errors:
- Check network tab (F12 → Network)
- Look for failed requests (red)
- Check response codes

---

## 📋 **Common Issues & Solutions**

### **Issue: Port 8080 Already in Use**
```bash
# Check what's using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
WEB_PORT=8081 npm run web
```

### **Issue: CORS Errors**
```bash
# Check if API and Web are on same origin
# API: http://localhost:3000
# Web: http://localhost:8080

# If different, update app.js:
const API_BASE_URL = 'http://localhost:3000';
```

### **Issue: Socket.IO Not Connecting**
```bash
# Check browser console for:
# "Socket.IO connection error"

# Fix: Ensure servers running
npm run both

# Check Socket.IO endpoint
curl http://localhost:8080/socket.io/
```

### **Issue: API Returns Errors**
```bash
# Test API directly
curl http://localhost:8080/api/dashboard/stats

# If 500 error, check:
# - EasyPost API key valid
# - Redis running
# - Server logs: tail -f logs/error.log
```

---

## 💡 **What Should Work**

When dashboard loads correctly, you should see:

1. **Page Title**: "EasyPost Dashboard 2025 - Real Data"
2. **Header**: "📦 EasyPost Dashboard"
3. **Statistics Cards** with real numbers:
   - Total Shipments
   - Active Tracking
   - Delivered Today
   - Total Cost

4. **Tables**:
   - Recent Shipments (your actual shipments)
   - Active Tracking (your packages)

5. **Browser Console**:
   - No red errors
   - "✅ Connected to tracking namespace"
   - "✅ Dashboard data loaded"

---

## 🧪 **Test Real Data Loading**

Open browser, press F12, paste in console:

```javascript
// Test if dashboard object exists
console.log(window.dashboard);

// Test API directly
fetch('/api/dashboard/stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d));

// Test Socket.IO
console.log('Socket:', io);
```

---

## 📞 **Get Help**

If still not working:

1. **Check server logs**:
   ```bash
   tail -50 logs/error.log
   tail -50 logs/combined.log
   ```

2. **Test API integration**:
   ```bash
   node test-api-integration.js
   ```

3. **Browser Developer Tools**:
   - F12 → Console (check for errors)
   - F12 → Network (check failed requests)
   - F12 → Application (check if files loaded)

---

## ✅ **Quick Fix Command**

```bash
# Full restart
pkill -f node
redis-cli shutdown || true
docker stop easypost-redis || true
docker rm easypost-redis || true

# Fresh start
docker run -d -p 6379:6379 --name easypost-redis redis:7-alpine
npm run both

# Wait 5 seconds, then open:
# http://localhost:8080
```

---

**Status**: Server is running ✅  
**Files**: Being served correctly ✅  
**Next**: Check browser console for specific error



