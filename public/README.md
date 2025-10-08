# 🌐 EasyPost Web Dashboard

**Modern shipping management interface with real-time updates**

---

## 📋 Overview

The EasyPost Web Dashboard is a modern, responsive web interface for managing shipments, tracking packages, and monitoring your shipping operations in real-time.

---

## ✨ Features

### **Design & UX**
- 🎨 Modern 2025 design with Mocha Mousse color palette
- 🌓 Dark/Light mode support
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Fast and performant
- 🎭 Smooth animations and transitions

### **Functionality**
- 📦 Shipment management
- 🔍 Real-time tracking
- 📊 Analytics dashboard
- 🔔 Live notifications
- ⌨️ Command palette (Cmd+K / Ctrl+K)
- 🔄 Real-time updates via Socket.IO

---

## 🚀 Quick Start

### **Start the Web Dashboard**

```bash
# Start web dashboard server
npm run web

# Or start both API and web dashboard
npm run both
```

The dashboard will be available at:
- **URL**: http://localhost:8080
- **API**: http://localhost:3000 (backend)

---

## 📁 File Structure

```
public/
├── index.html      # Main HTML file
├── app.js          # JavaScript functionality
├── style.css       # Styling and design
└── README.md       # This file
```

---

## ⚙️ Configuration

### **Environment Variables**

```bash
# Web dashboard port (default: 8080)
WEB_PORT=8080

# Web dashboard host
WEB_HOST=0.0.0.0
```

### **Backend API**

The dashboard connects to the backend API server:
- Default: `http://localhost:3000`
- Configure in `app.js` if needed

---

## 🎨 Design Features

### **Color Palette**
- **Mocha Mousse**: #A47C48 (Primary)
- **Backgrounds**: Gradient from #FAFBFC to #F5F7FA
- **Text**: #1F2937 (dark) / #F9FAFB (light mode)
- **Accents**: Blues, greens, and warm tones

### **Typography**
- **Body**: Inter font family
- **Code**: JetBrains Mono
- **Modern sizing and spacing**

### **Components**
- Bento grid layouts
- Glass-morphism effects
- Micro-animations
- Status indicators
- Progress bars
- Interactive cards

---

## 🔌 Real-time Features

### **Socket.IO Integration**

The dashboard uses Socket.IO for real-time updates:

```javascript
// Socket.IO namespaces
const trackingSocket = io('/tracking');
const shipmentsSocket = io('/shipments');
const notificationsSocket = io('/notifications');
```

### **Real-time Updates**
- Live tracking updates
- Shipment status changes
- Notifications
- Dashboard statistics

---

## 🛠️ Development

### **Local Development**

```bash
# Start with hot reload
npm run web

# Or start both servers
npm run both
```

### **Build for Production**

```bash
# Build assets
npm run build

# Or build web specifically
npm run build:web
```

### **Customization**

1. **Edit HTML**: `public/index.html`
2. **Edit Styles**: `public/style.css`
3. **Edit Scripts**: `public/app.js`
4. **Edit Server**: `src/web-server.js`

---

## 📊 Dashboard Sections

### **1. Overview Dashboard**
- Quick stats
- Recent activity
- Performance metrics
- Today's highlights

### **2. Shipments**
- Create new shipments
- View all shipments
- Manage labels
- Track packages

### **3. Tracking**
- Real-time tracking
- Delivery status
- Tracking history
- Map view (if enabled)

### **4. Analytics**
- Shipping statistics
- Cost analysis
- Carrier performance
- Trends and insights

### **5. Settings**
- Account preferences
- API configuration
- Theme settings
- Notifications

---

## 🎯 Key Bindings

| Key | Action |
|-----|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Cmd+/` / `Ctrl+/` | Toggle theme |
| `Cmd+,` / `Ctrl+,` | Open settings |
| `ESC` | Close modal/palette |

---

## 🔐 Security

- CORS configured for local development
- Helmet security headers
- Rate limiting on API
- Input validation
- XSS protection

---

## 📱 Progressive Web App (PWA)

The dashboard is configured as a PWA:
- Installable on desktop and mobile
- Offline support (when configured)
- App-like experience
- Push notifications (when configured)

---

## 🐳 Docker

The web dashboard is included in the Docker image:

```bash
# Build with web dashboard
docker build -t easypost-mcp:latest .

# Run web dashboard container
docker run -d \
  -p 8080:8080 \
  -e WEB_PORT=8080 \
  --env-file .env \
  easypost-mcp:latest
```

---

## 🧪 Testing

### **Manual Testing**
1. Open http://localhost:8080
2. Check all dashboard sections
3. Test real-time updates
4. Verify responsive design

### **Automated Testing**
```bash
# Run web tests
npm run test:web
```

---

## 📚 Documentation

- **API Docs**: See main README.md
- **Architecture**: docs-project/PROJECT-STRUCTURE.md
- **Quick Start**: docs-project/QUICK-START.md

---

## 🎨 Screenshots

*(Add screenshots of your dashboard here)*

---

## 🔄 Updates

### **Version 4.0.0** (Current)
- Modern 2025 design
- Real-time Socket.IO integration
- Command palette
- Dark/Light mode
- Responsive design
- Performance optimizations

---

## 💡 Tips

1. **Use Command Palette**: Press Cmd+K for quick actions
2. **Customize Theme**: Toggle between dark and light modes
3. **Real-time Updates**: Keep Socket.IO connected for live data
4. **Mobile Friendly**: Access dashboard from any device

---

## 🐛 Troubleshooting

### **Dashboard won't load**
- Check if web server is running (`npm run web`)
- Verify port 8080 is available
- Check browser console for errors

### **Real-time updates not working**
- Ensure backend API is running
- Check Socket.IO connection in browser console
- Verify WebSocket is not blocked by firewall

### **Styling issues**
- Clear browser cache
- Check for CSS conflicts
- Verify style.css is loaded

---

## 🤝 Contributing

To contribute to the web dashboard:
1. Make changes to files in `public/`
2. Test locally
3. Build for production
4. Submit pull request

---

**Made with ❤️ for modern shipping and logistics**

**Version**: 4.0.0  
**Last Updated**: October 7, 2025

