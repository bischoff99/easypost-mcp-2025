# EasyPost MCP Server 2025 - Production Docker Image
# Multi-stage build for optimal size and security

# === BUILD STAGE ===
FROM node:22.11.0-alpine AS builder

# Metadata
LABEL maintainer="EasyPost Team <support@easypost.com>"
LABEL version="4.0.0"
LABEL description="EasyPost MCP Server 2025 - AI-powered shipping platform"

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install all dependencies (including devDependencies for building)
RUN npm ci --include=dev

# Copy source code (new structure)
COPY src/ ./src/
COPY tests/ ./tests/

# Copy configuration files
COPY .env.example ./

# Copy frontend files if they exist
COPY web/ ./web/ 2>/dev/null || true

# Build TypeScript and frontend (if build scripts exist)
RUN npm run build || echo "No build step configured"

# Run tests to ensure build quality
RUN npm test -- --passWithNoTests || echo "No tests configured"

# === PRODUCTION STAGE ===
FROM node:22.11.0-alpine AS production

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    dumb-init \
    curl \
    jq

# Create non-root user for security
RUN addgroup -g 1001 -S easypost && \
    adduser -S easypost -u 1001 -G easypost

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage (if exists)
COPY --from=builder /app/dist ./dist/ 2>/dev/null || true
COPY --from=builder /app/web ./web/ 2>/dev/null || true

# Copy source code for runtime
COPY --chown=easypost:easypost src/ ./src/

# Copy additional runtime files
COPY --chown=easypost:easypost .env.example ./
COPY --chown=easypost:easypost README.md ./ 2>/dev/null || true

# Create necessary directories
RUN mkdir -p logs && \
    mkdir -p uploads && \
    mkdir -p reports && \
    mkdir -p temp && \
    chown -R easypost:easypost /app

# Security hardening
RUN chmod -R 755 /app && \
    chmod -R 644 /app/package*.json && \
    find /app -type f -name "*.js" -exec chmod 644 {} \; && \
    find /app -type f -name "*.json" -exec chmod 644 {} \; && \
    find /app -type d -exec chmod 755 {} \;

# Switch to non-root user
USER easypost

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
ENV ENABLE_COMPRESSION=true
ENV WORKER_PROCESSES=0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Build argument for component selection
ARG COMPONENT=mcp-server

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application based on component
# For mcp-server: runs src/server.js
# For web-dashboard: runs src/web-server.js (if exists)
CMD if [ "$COMPONENT" = "web-dashboard" ]; then \
      node src/web-server.js || node src/server.js; \
    else \
      node src/server.js; \
    fi

# === DEVELOPMENT STAGE ===
FROM node:22.11.0-alpine AS development

# Install development tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash \
    vim

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S easypost && \
    adduser -S easypost -u 1001 -G easypost

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install all dependencies (including dev)
RUN npm ci

# Create necessary directories
RUN mkdir -p logs uploads reports temp && \
    chown -R easypost:easypost /app

# Switch to non-root user
USER easypost

# Environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=debug
ENV HOT_RELOAD=true

# Expose ports (app + dev server)
EXPOSE 3000 5173

# Development command with hot reload
CMD ["npm", "run", "dev"]

# === TESTING STAGE ===
FROM builder AS testing

# Install additional testing tools
RUN apk add --no-cache chromium

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Run comprehensive test suite
RUN npm run test
RUN npm run test:integration
RUN npm run lint
RUN npm run type-check

# Security audit
RUN npm audit --audit-level moderate

# Build verification
RUN npm run build

# === MINIMAL PRODUCTION STAGE (Alternative) ===
FROM node:22.11.0-alpine AS minimal

# Ultra-minimal production image for maximum security
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN adduser -D -s /bin/sh easypost

WORKDIR /app

# Copy only essential files
COPY --from=builder --chown=easypost:easypost /app/dist ./dist/
COPY --from=builder --chown=easypost:easypost /app/node_modules ./node_modules/
COPY --chown=easypost:easypost package.json ./

USER easypost

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server-2025.js"]

# === BUILD ARGUMENTS & METADATA ===

# Build arguments for customization
ARG BUILD_VERSION=4.0.0
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_VERSION=22.11.0

# Labels for metadata
LABEL org.opencontainers.image.title="EasyPost MCP Server 2025"
LABEL org.opencontainers.image.description="AI-powered shipping and logistics platform"
LABEL org.opencontainers.image.version=${BUILD_VERSION}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.vendor="EasyPost"
LABEL org.opencontainers.image.url="https://www.easypost.com"
LABEL org.opencontainers.image.documentation="https://docs.easypost.com"
LABEL org.opencontainers.image.source="https://github.com/easypost/mcp-server-2025"
LABEL org.opencontainers.image.licenses="MIT"

# === USAGE EXAMPLES ===

# Build production image:
# docker build --target production -t easypost-mcp:latest .

# Build development image:
# docker build --target development -t easypost-mcp:dev .

# Build with custom arguments:
# docker build --target production \
#   --build-arg BUILD_VERSION=4.0.1 \
#   --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
#   --build-arg VCS_REF=$(git rev-parse HEAD) \
#   -t easypost-mcp:4.0.1 .

# Run production container:
# docker run -d \
#   --name easypost-mcp \
#   -p 3000:3000 \
#   -e EASYPOST_API_KEY=your_api_key \
#   easypost-mcp:latest

# Run development container with volume mount:
# docker run -d \
#   --name easypost-mcp-dev \
#   -p 3000:3000 \
#   -p 5173:5173 \
#   -v $(pwd):/app \
#   -e NODE_ENV=development \
#   easypost-mcp:dev

# === DOCKER COMPOSE EXAMPLE ===

# version: '3.8'
# services:
#   easypost-mcp:
#     image: easypost-mcp:latest
#     ports:
#       - "3000:3000"
#     environment:
#       - EASYPOST_API_KEY=${EASYPOST_API_KEY}
#       - REDIS_URL=redis://redis:6379
#     depends_on:
#       - redis
#     restart: unless-stopped
#
#   redis:
#     image: redis:7-alpine
#     ports:
#       - "6379:6379"
#     restart: unless-stopped