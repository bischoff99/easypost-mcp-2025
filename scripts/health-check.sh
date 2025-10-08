#!/bin/bash

# EasyPost MCP Server 2025 - Health Check Script
# Comprehensive health verification for all services

set -e

HOST="${1:-localhost}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

echo "🔍 EasyPost MCP Server - Health Check"
echo "======================================"
echo "Target: $HOST"
echo ""

FAILED=0

# Check MCP Server
print_info "Checking MCP Server..."
if response=$(curl -sf "http://$HOST:3000/health" 2>&1); then
    print_success "MCP Server is healthy"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    print_error "MCP Server health check failed"
    FAILED=1
fi
echo ""

# Check Web Dashboard
print_info "Checking Web Dashboard..."
if response=$(curl -sf "http://$HOST:8080/health" 2>&1); then
    print_success "Web Dashboard is healthy"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    print_error "Web Dashboard health check failed"
    FAILED=1
fi
echo ""

# Check Redis (if accessible)
print_info "Checking Redis..."
if docker-compose -f docker-compose.staging.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis health check failed"
    FAILED=1
fi
echo ""

# Check Nginx (if running)
print_info "Checking Nginx..."
if curl -sf "http://$HOST:80/health" > /dev/null 2>&1; then
    print_success "Nginx is healthy"
else
    print_info "Nginx not responding (may not be running)"
fi
echo ""

# Summary
echo "======================================"
if [ $FAILED -eq 0 ]; then
    print_success "All health checks passed!"
    exit 0
else
    print_error "Some health checks failed!"
    exit 1
fi

