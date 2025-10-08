# 🔗 MCP Server ↔ Dashboard Connection Diagram

## **How Everything is Connected**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          👤 USER'S BROWSER                              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  http://localhost:3000                                            │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  Dashboard UI (HTML/CSS/JS)                                 │ │ │
│  │  │  • index.html → Structure                                   │ │ │
│  │  │  • style.css  → Design                                      │ │ │
│  │  │  • app.js     → Logic                                       │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                            ↓                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  JavaScript makes API calls:                                │ │ │
│  │  │                                                             │ │ │
│  │  │  fetch('http://localhost:3000/api/shipments/create', {     │ │ │
│  │  │    method: 'POST',                                          │ │ │
│  │  │    headers: {                                               │ │ │
│  │  │      'Content-Type': 'application/json',                    │ │ │
│  │  │      'X-API-Key': localStorage.getItem('easypost_api_key')  │ │ │
│  │  │    },                                                        │ │ │
│  │  │    body: JSON.stringify(shipmentData)                       │ │ │
│  │  │  })                                                          │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                            ↓                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  WebSocket Connection:                                      │ │ │
│  │  │                                                             │ │ │
│  │  │  const socket = io('http://localhost:3000/shipments');      │ │ │
│  │  │                                                             │ │ │
│  │  │  socket.on('shipment:created', (data) => {                 │ │ │
│  │  │    // Update UI in real-time                               │ │ │
│  │  │  });                                                         │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                   ↕                                     │
│                      HTTP + WebSocket (Port 3000)                       │
│                                   ↕                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    🖥️  UNIFIED SERVER (Port 3000)                       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  src/server.js (Main Entry Point)                                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                   ↓                                     │
│  ┌─────────────────┬─────────────────┬─────────────────┬────────────┐ │
│  │                 │                 │                 │            │ │
│  │  Static Files   │   Dashboard     │   Main API      │  Socket.IO │ │
│  │  Middleware     │   API Routes    │   Routes        │  Handler   │ │
│  │                 │                 │                 │            │ │
│  └─────────────────┴─────────────────┴─────────────────┴────────────┘ │
│         ↓                  ↓                 ↓                ↓         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  1. Static File Serving                                           │ │
│  │     app.use(express.static(publicPath));                          │ │
│  │     → Serves: public/index.html, public/app.js, public/style.css │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  2. Dashboard API (No Auth Required)                              │ │
│  │     app.use('/api/dashboard', dashboardRoutes);                   │ │
│  │     → GET /api/dashboard/stats                                    │ │
│  │     → GET /api/dashboard/recent                                   │ │
│  │     → GET /api/dashboard/activities                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  3. Main API Routes (Auth Required)                               │ │
│  │     app.use('/api/shipments', validateApiKey, shipmentsRoutes);   │ │
│  │     app.use('/api/tracking', validateApiKey, trackingRoutes);     │ │
│  │     app.use('/api/addresses', validateApiKey, addressesRoutes);   │ │
│  │     app.use('/api/luma', validateApiKey, lumaAiRoutes);           │ │
│  │     app.use('/api/claims', validateApiKey, claimsRoutes);         │ │
│  │     app.use('/api/forge', validateApiKey, forgeRoutes);           │ │
│  │     app.use('/api/analytics', validateApiKey, analyticsRoutes);   │ │
│  │     app.use('/api/batch', validateApiKey, batchRoutes);           │ │
│  │                                                                   │ │
│  │     → 29 endpoints total                                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  4. Socket.IO (Real-time Updates)                                 │ │
│  │     const io = initializeSocketIO(httpServer);                    │ │
│  │     → Namespace: /shipments                                       │ │
│  │     → Namespace: /tracking                                        │ │
│  │     → Namespace: /notifications                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                   ↓                                     │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Service Layer                              │  │
│  │  ┌──────────────────┐     ┌──────────────────┐                 │  │
│  │  │ ShipmentService  │     │ TrackingService  │                 │  │
│  │  └──────────────────┘     └──────────────────┘                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                     │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      External Services                          │  │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐             │  │
│  │  │ EasyPost   │   │   Redis    │   │   Logs     │             │  │
│  │  │   API      │   │   Cache    │   │  Winston   │             │  │
│  │  └────────────┘   └────────────┘   └────────────┘             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## **Step-by-Step Request Flow**

### **Scenario: User Creates a Shipment**

```
┌───────────────────────────────────────────────────────────────┐
│ STEP 1: User Opens Dashboard                                 │
└───────────────────────────────────────────────────────────────┘
  Browser → http://localhost:3000
           ↓
  Server (Express) → Checks routes
           ↓
  Static Middleware → Serves public/index.html
           ↓
  Browser → Loads HTML, CSS, JS
           ↓
  Dashboard → Renders UI

┌───────────────────────────────────────────────────────────────┐
│ STEP 2: User Fills Shipment Form                             │
└───────────────────────────────────────────────────────────────┘
  User → Enters from/to addresses
      → Enters package dimensions
      → Clicks "Create Shipment"
           ↓
  app.js → handleCreateShipment()

┌───────────────────────────────────────────────────────────────┐
│ STEP 3: Dashboard Sends API Request                          │
└───────────────────────────────────────────────────────────────┘
  app.js → fetch('http://localhost:3000/api/shipments/create', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'X-API-Key': localStorage.getItem('easypost_api_key')
             },
             body: JSON.stringify({
               from_address: { ... },
               to_address: { ... },
               parcel: { ... }
             })
           })

┌───────────────────────────────────────────────────────────────┐
│ STEP 4: Server Receives Request                              │
└───────────────────────────────────────────────────────────────┘
  Request → Hits server at /api/shipments/create
           ↓
  Express Router → Matches route
           ↓
  validateApiKey Middleware → Checks X-API-Key header
           ↓
  If valid → Continue
  If invalid → Return 403 Forbidden

┌───────────────────────────────────────────────────────────────┐
│ STEP 5: Route Handler Processes Request                      │
└───────────────────────────────────────────────────────────────┘
  shipmentsRoutes → createShipment handler
           ↓
  Validates input data
           ↓
  ShipmentService.createShipment(data)
           ↓
  Calls EasyPost API
           ↓
  Receives shipment data with rates

┌───────────────────────────────────────────────────────────────┐
│ STEP 6: Server Sends Response                                │
└───────────────────────────────────────────────────────────────┘
  Server → JSON response
           {
             success: true,
             data: {
               id: 'shp_...',
               rates: [...],
               ...
             }
           }
           ↓
  Browser receives response

┌───────────────────────────────────────────────────────────────┐
│ STEP 7: Dashboard Updates UI                                 │
└───────────────────────────────────────────────────────────────┘
  app.js → Updates currentShipment
        → Displays rates in modal
        → User can now select rate

┌───────────────────────────────────────────────────────────────┐
│ STEP 8: Real-time Update (WebSocket)                         │
└───────────────────────────────────────────────────────────────┘
  Server → io.to('/shipments').emit('shipment:created', {
             shipment: { ... }
           })
           ↓
  All connected clients receive event
           ↓
  Dashboard → Updates shipments list in real-time
           → Shows notification "New shipment created"
```

---

## **Authentication Flow**

```
┌───────────────────────────────────────────────────────────────┐
│ 1. User Enters API Key in Settings                           │
└───────────────────────────────────────────────────────────────┘
  Dashboard → Gets API key from user
           → localStorage.setItem('easypost_api_key', key)

┌───────────────────────────────────────────────────────────────┐
│ 2. Dashboard Makes API Call                                   │
└───────────────────────────────────────────────────────────────┘
  app.js → getApiKey() {
             return localStorage.getItem('easypost_api_key');
           }
        → Adds to headers: 'X-API-Key': this.getApiKey()

┌───────────────────────────────────────────────────────────────┐
│ 3. Server Validates API Key                                   │
└───────────────────────────────────────────────────────────────┘
  validateApiKey Middleware:
    1. Extract: req.header('X-API-Key')
    2. Check: apiKey === process.env.EASYPOST_API_KEY
    3. If valid → next()
    4. If invalid → res.status(403).json({ error: 'Invalid' })

┌───────────────────────────────────────────────────────────────┐
│ 4. Request Proceeds or Gets Rejected                          │
└───────────────────────────────────────────────────────────────┘
  Valid → Route handler executes
  Invalid → Error response returned
```

---

## **Real-time Update Flow (Socket.IO)**

```
┌───────────────────────────────────────────────────────────────┐
│ 1. Dashboard Connects to Socket.IO                            │
└───────────────────────────────────────────────────────────────┘
  app.js → io('http://localhost:3000/shipments')
        → Connection established

┌───────────────────────────────────────────────────────────────┐
│ 2. Server Event Occurs                                         │
└───────────────────────────────────────────────────────────────┘
  New shipment created
  Tracking update received
  Claim status changed

┌───────────────────────────────────────────────────────────────┐
│ 3. Server Emits Event                                          │
└───────────────────────────────────────────────────────────────┘
  io.to('/shipments').emit('shipment:created', data)
  io.to('/tracking').emit('tracker:updated', data)
  io.to('/notifications').emit('notification', data)

┌───────────────────────────────────────────────────────────────┐
│ 4. All Connected Clients Receive                              │
└───────────────────────────────────────────────────────────────┘
  Dashboard → socket.on('shipment:created', (data) => {
                // Update UI immediately
                this.addShipmentToList(data);
                this.showNotification('New shipment!');
              })
```

---

## **File Structure Mapping**

```
Server Side (src/server.js)
├── Express Setup
│   ├── Static files → Serves public/*
│   ├── Routes → /api/shipments, /api/tracking, etc.
│   └── WebSocket → Socket.IO namespaces
│
└── Sends to Browser

Browser Side (public/)
├── index.html
│   ├── Structure → Dashboard layout
│   ├── Sections → 8 main sections
│   └── Modals → 6 interactive modals
│
├── app.js
│   ├── API Calls → fetch() to server
│   ├── Socket.IO → Real-time connection
│   └── UI Logic → Event handlers
│
└── style.css
    ├── Layout → Responsive design
    ├── Themes → Dark/Light mode
    └── Components → Forms, tables, charts

Same Server = No CORS Issues! ✅
```

---

## **Why This Works**

### **✅ Same Origin Policy**
```
Dashboard: http://localhost:3000
API:       http://localhost:3000/api/shipments
           ↑                    ↑
           Same protocol, host, and port = Same Origin!
```

### **✅ No CORS Configuration Needed**
```javascript
// NOT NEEDED!
// app.use(cors({
//   origin: 'http://localhost:8080'
// }));

// Because everything is same origin!
```

### **✅ WebSocket Works Seamlessly**
```javascript
// Dashboard connects to same server
const socket = io(window.location.origin);

// No proxy, no configuration
// Just works! ✅
```

### **✅ API Key in Headers**
```javascript
// Dashboard sends API key
fetch('/api/shipments/create', {
  headers: {
    'X-API-Key': apiKey
  }
})

// Server validates
if (apiKey === process.env.EASYPOST_API_KEY) {
  // ✅ Authorized
} else {
  // ❌ 403 Forbidden
}
```

---

## **Common Scenarios**

### **Scenario 1: Dashboard Loads**
```
Browser → GET http://localhost:3000
Server → express.static() → Serves public/index.html
Browser → Renders dashboard
```

### **Scenario 2: API Call**
```
Dashboard → POST http://localhost:3000/api/shipments/create
Server → validateApiKey() → shipmentsRoutes → ShipmentService
Server → Returns JSON response
Dashboard → Updates UI
```

### **Scenario 3: Real-time Update**
```
Server → Event occurs
Server → io.emit('event', data)
Dashboard → socket.on('event', callback)
Dashboard → Updates UI without refresh
```

### **Scenario 4: Static File**
```
Browser → GET http://localhost:3000/app.js
Server → express.static() → Serves public/app.js
Browser → Executes JavaScript
```

---

## **Key Takeaways**

1. **One Server** = Everything on port 3000
2. **Same Origin** = No CORS headaches
3. **Unified Auth** = One API key for everything
4. **Real-time** = Socket.IO on same connection
5. **Simple Deployment** = One Docker container
6. **Better Performance** = Shared resources

---

**The Answer**: Yes, the MCP server is **directly integrated** with the web dashboard. They're not just "linked" - they're **unified** into a single, cohesive server! 🚀

---

**Last Updated**: October 8, 2025  
**Version**: 4.0.0  
**Status**: ✅ Fully Integrated
