# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## 📋 Available Workflows

### 1. **CI - Continuous Integration** (`ci.yml`)
**Triggers**: Push to any branch, Pull requests to main/staging

**What it does**:
- ✅ Lints code with ESLint
- ✅ Runs tests
- ✅ Security audit
- ✅ Builds application
- ✅ Lints Dockerfile

**Purpose**: Ensures code quality on every push and pull request.

---

### 2. **Deploy to Staging** (`deploy-staging.yml`)
**Triggers**: Push to main/staging branches, Manual dispatch

**What it does**:
- ✅ Builds and tests application
- ✅ Builds Docker images
- ✅ Pushes to GitHub Container Registry
- ✅ Security scans with Trivy
- ✅ Deploys to staging environment
- ✅ Health checks
- ✅ Sends deployment notifications
- ✅ Auto-rollback on failure

**Purpose**: Automated deployment to staging environment.

---

### 3. **Release** (`release.yml`)
**Triggers**: Push tags (v*.*.*), Manual dispatch

**What it does**:
- ✅ Creates GitHub release
- ✅ Generates changelog
- ✅ Builds multi-platform Docker images (amd64, arm64)
- ✅ Pushes to GitHub Container Registry with version tags
- ✅ Security scans
- ✅ Sends release notifications

**Purpose**: Automated release creation and Docker image publishing.

---

## 🔧 Required Secrets

Configure these secrets in: **Settings → Secrets and variables → Actions**

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub | All workflows |
| `DEPLOYMENT_WEBHOOK_URL` | Slack/Discord webhook for notifications | Staging, Release (optional) |

---

## 🚀 Usage Examples

### Trigger CI Workflow
```bash
# Automatically runs on any push
git push origin feature/my-feature

# Or on pull request
gh pr create --title "My Feature"
```

### Deploy to Staging
```bash
# Automatically deploys when pushing to main
git push origin main

# Or manually trigger
gh workflow run deploy-staging.yml
```

### Create a Release
```bash
# Create and push a tag
git tag -a v4.0.1 -m "Release v4.0.1"
git push origin v4.0.1

# Or manually trigger
gh workflow run release.yml -f version=v4.0.1
```

---

## 📊 Monitoring Workflows

### View Workflow Runs
```bash
# List all workflow runs
gh run list

# View specific workflow
gh run list --workflow=ci.yml

# Watch a running workflow
gh run watch
```

### Check Workflow Status
Visit: https://github.com/YOUR_USERNAME/easypost-mcp-2025/actions

---

## 🐳 Docker Images

Workflows publish images to GitHub Container Registry:

```bash
# Pull staging image
docker pull ghcr.io/YOUR_USERNAME/easypost-mcp-2025:staging-latest

# Pull release image
docker pull ghcr.io/YOUR_USERNAME/easypost-mcp-2025:latest
docker pull ghcr.io/YOUR_USERNAME/easypost-mcp-2025:v4.0.0
```

---

## 🔍 Troubleshooting

### Workflow Failures

**Check logs**:
```bash
# View failed run
gh run view --log-failed

# View specific job
gh run view JOB_ID --log
```

**Common issues**:
1. **Missing secrets**: Add required secrets in repository settings
2. **Docker build fails**: Check Dockerfile syntax
3. **Health checks timeout**: Increase timeout values
4. **Permission denied**: Check workflow permissions in settings

### Enable Workflows

If workflows are disabled:
1. Go to **Settings → Actions → General**
2. Set **Actions permissions** to "Allow all actions"
3. Enable **Read and write permissions** for `GITHUB_TOKEN`

---

## 📝 Workflow Files

| File | Lines | Purpose |
|------|-------|---------|
| `ci.yml` | 140 | Continuous integration checks |
| `deploy-staging.yml` | 246 | Staging deployment |
| `release.yml` | 195 | Release automation |

**Total**: 581 lines of automated CI/CD! 🎉

---

## 🔒 Security Features

- ✅ Trivy security scanning
- ✅ Dependency review
- ✅ npm audit
- ✅ Hadolint for Dockerfile
- ✅ SARIF upload to GitHub Security

---

## 🎯 Next Steps

1. **Configure secrets** in repository settings
2. **Push code** to trigger CI workflow
3. **Create a tag** to trigger release workflow
4. **Monitor** workflow runs in Actions tab
5. **Review** security scan results

---

**Last Updated**: 2025-10-08  
**Repository**: bischoff99/easypost-mcp-2025  
**Status**: ✅ Production Ready
