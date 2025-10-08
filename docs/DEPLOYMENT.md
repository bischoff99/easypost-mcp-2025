# EasyPost MCP Server 2025 - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Local Docker Deployment](#local-docker-deployment)
5. [GitHub Actions CI/CD](#github-actions-cicd)
6. [Staging Deployment](#staging-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Overview

The EasyPost MCP Server 2025 is deployed as a multi-container Docker application consisting of:

- **MCP Server** (port 3000): Model Context Protocol server for AI integrations
- **Web Dashboard** (port 8080): Modern web interface with analytics
- **Redis** (port 6379): Cache and session storage
- **Nginx** (port 80/443): Reverse proxy and load balancer

### Architecture Diagram

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │ :80, :443
│ (Proxy)     │
└─────────────┘
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│  MCP    │   │   Web   │   │  Redis  │
│ Server  │◄──┤Dashboard│◄──┤  Cache  │
│  :3000  │   │  :8080  │   │  :6379  │
└─────────┘   └─────────┘   └─────────┘
```

---

## Prerequisites

### Required Software
- **Docker**: 24.0+ (with Docker Compose v2)
- **Node.js**: 22.x LTS (for local development)
- **npm**: 11.x
- **Git**: 2.x

### Required Accounts & Credentials
- EasyPost API Key (staging/production)
- GitHub account (for CI/CD)
- Container registry access (GitHub Container Registry)

### Verify Installation
```bash
# Check Docker
docker --version  # Should be 24.0+
docker-compose --version  # Should be 2.x

# Check Node.js
node --version  # Should be v22.x
npm --version  # Should be 11.x
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/easypost-mcp-server-2025.git
cd easypost-mcp-server-2025
```

### 2. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env.staging

# Edit with your values
nano .env.staging
```

### 3. Required Environment Variables
```bash
# Minimum required for staging
EASYPOST_API_KEY=EZAK_test_your_staging_key_here
NODE_ENV=staging
PORT=3000
WEB_PORT=8080
REDIS_URL=redis://redis:6379
SESSION_SECRET=your_random_32_char_secret_here
JWT_SECRET=your_random_32_char_jwt_secret_here
```

---

## Local Docker Deployment

### Quick Start
```bash
# 1. Build and start all services
docker-compose -f docker-compose.staging.yml up --build -d

# 2. Check service health
./scripts/health-check.sh localhost

# 3. View logs
docker-compose -f docker-compose.staging.yml logs -f

# 4. Access services
# - MCP Server: http://localhost:3000/health
# - Web Dashboard: http://localhost:8080
# - Redis: localhost:6379
```

### Using npm Scripts
```bash
# Build and start
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Run health checks
npm run health:staging
```

### Manual Build Steps
```bash
# Build specific service
docker-compose -f docker-compose.staging.yml build mcp-server
docker-compose -f docker-compose.staging.yml build web-dashboard

# Start specific service
docker-compose -f docker-compose.staging.yml up -d mcp-server

# View service status
docker-compose -f docker-compose.staging.yml ps

# Execute commands in container
docker-compose -f docker-compose.staging.yml exec mcp-server sh
```

---

## GitHub Actions CI/CD

### Setup GitHub Secrets

Navigate to: `Repository Settings > Secrets and variables > Actions`

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EASYPOST_API_KEY_STAGING` | EasyPost API key for staging | `EZAK_test_...` |
| `DOCKER_REGISTRY_TOKEN` | GitHub token for GHCR | Auto-provided |
| `STAGING_SERVER_SSH_KEY` | SSH private key | `-----BEGIN RSA...` |
| `STAGING_SERVER_HOST` | Staging server hostname | `staging.yourdomain.com` |
| `DEPLOYMENT_WEBHOOK_URL` | Slack/Discord webhook | `https://hooks.slack...` |

### Workflow Triggers

The CI/CD pipeline triggers on:
1. **Push to `main` or `staging` branch**: Automatic deployment
2. **Pull Request to `main`**: Build and test only (no deploy)
3. **Manual dispatch**: Deploy on demand

### Workflow Stages

```
┌─────────────┐
│   Trigger   │
│ (Push/PR)   │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Build & Test    │
│ • Lint code      │
│ • Run tests      │
│ • Security audit │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Docker Build    │
│ • Build image    │
│ • Security scan  │
│ • Push to GHCR   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Deploy Staging   │
│ • Pull images    │
│ • Start services │
│ • Health checks  │
│ • Smoke tests    │
└──────────────────┘
```

### Monitor Deployments

View deployment status:
- **Actions Tab**: https://github.com/your-org/your-repo/actions
- **Environments**: https://github.com/your-org/your-repo/deployments

---

## Staging Deployment

### Automated Deployment (Recommended)
```bash
# Use the deployment script
./scripts/deploy-staging.sh
```

This script:
1. Validates prerequisites
2. Builds Docker images
3. Stops old containers gracefully
4. Starts new containers
5. Performs health checks
6. Runs smoke tests
7. Reports deployment status

### Manual Deployment
```bash
# 1. Pull latest code
git checkout staging
git pull origin staging

# 2. Build images
docker-compose -f docker-compose.staging.yml build --pull

# 3. Deploy
docker-compose -f docker-compose.staging.yml up -d --force-recreate

# 4. Verify health
curl http://localhost:3000/health
curl http://localhost:8080/health

# 5. Check logs
docker-compose -f docker-compose.staging.yml logs -f
```

### Post-Deployment Verification

```bash
# Run comprehensive health checks
./scripts/health-check.sh localhost

# Check container status
docker-compose -f docker-compose.staging.yml ps

# View resource usage
docker stats

# Test API endpoints
curl http://localhost:3000/health
curl http://localhost:8080/health
curl http://localhost/health  # Nginx
```

---

## Monitoring & Logging

### View Logs

```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.staging.yml logs -f mcp-server
docker-compose -f docker-compose.staging.yml logs -f web-dashboard
docker-compose -f docker-compose.staging.yml logs -f redis

# Last N lines
docker-compose -f docker-compose.staging.yml logs --tail=100 mcp-server
```

### Log Files

Logs are persisted in:
- `./logs/app.log` - Application logs
- `./logs/web-error.log` - Web dashboard errors
- `./logs/web-combined.log` - All web dashboard logs

### Monitoring Endpoints

- **MCP Server Health**: `http://localhost:3000/health`
- **Web Dashboard Health**: `http://localhost:8080/health`
- **Nginx Health**: `http://localhost/health`

### Metrics (if enabled)

- **Prometheus**: `http://localhost:3000/metrics`
- **Container Metrics**: `docker stats`

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :8080

# Stop conflicting services
docker-compose -f docker-compose.staging.yml down

# Or kill specific process
kill -9 <PID>
```

#### 2. Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs mcp-server

# Inspect container
docker inspect easypost-mcp-staging

# Remove and recreate
docker-compose -f docker-compose.staging.yml down -v
docker-compose -f docker-compose.staging.yml up --build -d
```

#### 3. Health Check Failures
```bash
# Check if services are running
docker-compose -f docker-compose.staging.yml ps

# Verify environment variables
docker-compose -f docker-compose.staging.yml exec mcp-server env | grep EASYPOST

# Test health endpoint manually
docker-compose -f docker-compose.staging.yml exec mcp-server curl localhost:3000/health
```

#### 4. Redis Connection Issues
```bash
# Check Redis is running
docker-compose -f docker-compose.staging.yml ps redis

# Test Redis connection
docker-compose -f docker-compose.staging.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.staging.yml logs redis
```

#### 5. Build Failures
```bash
# Clear Docker cache
docker builder prune -af

# Rebuild from scratch
docker-compose -f docker-compose.staging.yml build --no-cache

# Check Dockerfile syntax
docker build --target production -t test .
```

---

## Rollback Procedures

### Quick Rollback
```bash
# Use the rollback script
./scripts/rollback.sh
```

### Manual Rollback
```bash
# Stop current deployment
docker-compose -f docker-compose.staging.yml down

# Pull previous images (if tagged)
docker pull ghcr.io/your-org/easypost-mcp:staging-previous

# Start previous version
docker-compose -f docker-compose.staging.yml up -d

# Verify health
./scripts/health-check.sh localhost
```

### Emergency Rollback (GitHub Actions)

1. Go to Actions tab
2. Find successful previous deployment
3. Click "Re-run jobs"
4. Or push a revert commit:
```bash
git revert HEAD
git push origin staging
```

---

## Security Best Practices

1. **Never commit `.env.staging` or `.env` files**
2. **Use GitHub Secrets for sensitive data**
3. **Rotate API keys regularly**
4. **Keep Docker images updated**
5. **Run security scans** (Trivy in CI/CD)
6. **Use HTTPS in production** (Let's Encrypt)
7. **Limit network exposure** (firewall rules)
8. **Monitor logs for suspicious activity**

---

## Performance Optimization

### Docker Resources
```yaml
# Add to docker-compose.staging.yml services
resources:
  limits:
    cpus: '1.0'
    memory: 512M
  reservations:
    cpus: '0.5'
    memory: 256M
```

### Caching Strategy
- Use Docker layer caching
- Enable npm cache in CI/CD
- Use Redis for application caching
- Enable nginx cache for static assets

---

## Useful Commands

```bash
# Quick deployment
npm run deploy:staging

# View logs
npm run logs:staging

# Health check
npm run health:staging

# Rollback
npm run rollback:staging

# Restart services
docker-compose -f docker-compose.staging.yml restart

# Scale services (if needed)
docker-compose -f docker-compose.staging.yml up -d --scale mcp-server=2

# Cleanup unused images
docker system prune -a

# View resource usage
docker stats
```

---

## Support

For issues or questions:
- Check logs first: `npm run logs:staging`
- Review health checks: `npm run health:staging`
- Consult this documentation
- Check GitHub Actions logs
- Contact DevOps team

---

Last Updated: October 7, 2025
Version: 4.0.0

