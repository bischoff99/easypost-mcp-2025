#!/bin/bash

# EasyPost MCP Server 2025 - Rollback Script
# Quickly rollback to previous deployment

set -e

echo "⏪ EasyPost MCP Server - Rollback to Previous Version"
echo "====================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

PROJECT_ROOT="/mnt/c/Users/bischoff/Desktop/web"
COMPOSE_FILE="docker-compose.staging.yml"

cd "$PROJECT_ROOT" || exit 1

# Confirmation
print_warning "This will rollback the staging deployment to the previous version!"
read -p "Are you sure? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

# Stop current containers
print_warning "Stopping current containers..."
docker-compose -f "$COMPOSE_FILE" down

# Pull previous images (if tagged)
print_warning "Rolling back to previous images..."
docker-compose -f "$COMPOSE_FILE" pull || true

# Restart with previous version
print_warning "Starting previous version..."
docker-compose -f "$COMPOSE_FILE" up -d

echo ""
print_warning "Waiting for services to start..."
sleep 15

# Health check
if curl -sf "http://localhost:3000/health" > /dev/null 2>&1; then
    print_success "MCP Server rolled back successfully"
else
    print_error "MCP Server rollback failed"
    exit 1
fi

if curl -sf "http://localhost:8080/health" > /dev/null 2>&1; then
    print_success "Web Dashboard rolled back successfully"
else
    print_error "Web Dashboard rollback failed"
    exit 1
fi

echo ""
print_success "🎉 Rollback Complete!"
echo ""
echo "📊 Current Status:"
docker-compose -f "$COMPOSE_FILE" ps

