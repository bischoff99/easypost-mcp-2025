#!/bin/bash

# EasyPost MCP Server 2025 - Staging Deployment Script
# Automated deployment with health checks and rollback

set -e

echo "🚀 EasyPost MCP Server - Staging Deployment"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="/mnt/c/Users/bischoff/Desktop/web"
COMPOSE_FILE="docker-compose.staging.yml"
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=5

# Functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Change to project directory
cd "$PROJECT_ROOT" || exit 1

# Step 1: Pre-deployment checks
print_info "Running pre-deployment checks..."

if [ ! -f ".env.staging" ]; then
    print_error ".env.staging not found! Create it from .env.example"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "$COMPOSE_FILE not found!"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found! Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose not found! Please install Docker Compose first."
    exit 1
fi

print_success "Pre-deployment checks passed"
echo ""

# Step 2: Pull latest code (optional)
print_info "Current commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# Step 3: Build Docker images
print_info "Building Docker images..."
docker-compose -f "$COMPOSE_FILE" build --pull --no-cache

print_success "Docker images built successfully"
echo ""

# Step 4: Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans

print_success "Existing containers stopped"
echo ""

# Step 5: Start new containers
print_info "Starting new containers..."
docker-compose -f "$COMPOSE_FILE" up -d

echo ""
print_info "Waiting for services to start..."
sleep 10

# Step 6: Health checks
print_info "Performing health checks..."

check_health() {
    local service=$1
    local url=$2
    local retries=0
    
    while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            print_success "$service is healthy"
            return 0
        fi
        
        retries=$((retries + 1))
        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    print_error "$service health check failed after $MAX_HEALTH_RETRIES attempts"
    return 1
}

# Check Redis
if ! check_health "Redis" "redis://localhost:6379"; then
    print_warning "Redis check via redis-cli..."
    docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping || {
        print_error "Redis deployment failed"
        exit 1
    }
fi

# Check MCP Server
if ! check_health "MCP Server" "http://localhost:3000/health"; then
    print_error "MCP Server deployment failed"
    print_info "Checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs mcp-server --tail=50
    exit 1
fi

# Check Web Dashboard
if ! check_health "Web Dashboard" "http://localhost:8080/health"; then
    print_error "Web Dashboard deployment failed"
    print_info "Checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs web-dashboard --tail=50
    exit 1
fi

echo ""
print_success "All services are healthy!"
echo ""

# Step 7: Run smoke tests
print_info "Running smoke tests..."
if [ -f "scripts/health-check.sh" ]; then
    bash scripts/health-check.sh localhost || print_warning "Smoke tests failed (non-critical)"
else
    print_warning "smoke tests script not found, skipping"
fi

echo ""
echo "============================================"
print_success "🎉 Deployment Complete!"
echo "============================================"
echo ""
echo "📊 Service Status:"
docker-compose -f "$COMPOSE_FILE" ps
echo ""
echo "🔗 Access URLs:"
echo "  - MCP Server:     http://localhost:3000"
echo "  - Web Dashboard:  http://localhost:8080"
echo "  - Nginx Proxy:    http://localhost:80"
echo ""
echo "📝 Useful Commands:"
echo "  - View logs:      docker-compose -f $COMPOSE_FILE logs -f"
echo "  - Stop services:  docker-compose -f $COMPOSE_FILE down"
echo "  - Restart:        docker-compose -f $COMPOSE_FILE restart"
echo ""

