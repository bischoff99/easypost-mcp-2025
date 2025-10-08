# Contributing to EasyPost MCP Server 2025

First off, thank you for considering contributing to EasyPost MCP Server 2025! 🎉

## 📋 **Table of Contents**

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## 🤝 **Code of Conduct**

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

**In short**:
- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 **How Can I Contribute?**

### **Reporting Bugs**

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected vs actual** behavior
- **Environment details** (OS, Node version, etc.)
- **Logs and screenshots** if applicable

Use the bug report template: [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)

### **Suggesting Enhancements**

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear use case** for the enhancement
- **Proposed implementation** (if you have ideas)
- **Expected impact** on users
- **Alternatives considered**

Use the feature request template: [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)

### **Pull Requests**

- Fill in the PR template
- Include relevant issue numbers
- Follow coding standards
- Add/update tests
- Update documentation

---

## 🛠️ **Development Setup**

### **1. Fork and Clone**

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/easypost-mcp-2025.git
cd easypost-mcp-2025
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Configure Environment**

```bash
cp .env.example .env
# Edit .env and add your EasyPost API key
```

### **4. Start Development Server**

```bash
# Option 1: Local development
npm run dev

# Option 2: Docker development (recommended)
npm run dev:docker
```

### **5. Run Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
node --test tests/api/shipments.test.js
```

---

## 🔄 **Pull Request Process**

### **Before Submitting**

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -m "✨ Add amazing feature"
   ```
   
   Use conventional commits:
   - `✨ feat:` New feature
   - `🐛 fix:` Bug fix
   - `📚 docs:` Documentation
   - `🎨 style:` Formatting
   - `♻️ refactor:` Code refactoring
   - `⚡ perf:` Performance improvement
   - `🧪 test:` Adding tests

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Add screenshots if UI changes

### **During Review**

- Be responsive to feedback
- Make requested changes promptly
- Keep commits organized
- Update PR description if scope changes

### **After Merge**

- Delete your feature branch
- Pull latest changes from main
- Celebrate your contribution! 🎉

---

## 📏 **Coding Standards**

### **JavaScript/TypeScript**

```javascript
// ✅ Good
async function createShipment(data) {
  try {
    const shipment = await shipmentService.create(data);
    logger.info('Shipment created', { id: shipment.id });
    return shipment;
  } catch (error) {
    logger.error('Failed to create shipment', { error: error.message });
    throw error;
  }
}

// ❌ Bad
function createShipment(data) {
  return shipmentService.create(data);
}
```

### **Code Style**

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Yes (required)
- **Line length**: 100 characters max
- **Trailing commas**: Yes
- **Async/await**: Preferred over promises

### **Naming Conventions**

- **Functions**: camelCase (`createShipment`, `getTracking`)
- **Classes**: PascalCase (`ShipmentService`, `RouteOptimizer`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Files**: kebab-case (`shipment-service.js`, `route-optimizer.js`)

---

## 🧪 **Testing Guidelines**

### **Test Coverage Requirements**

- **Minimum**: 80% code coverage
- **Target**: 95% code coverage
- **All new features**: Must include tests
- **Bug fixes**: Must include regression tests

### **Test Structure**

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

describe('ShipmentService', () => {
  let service;

  before(async () => {
    service = new ShipmentService();
  });

  it('should create shipment with valid data', async () => {
    const data = { /* valid shipment data */ };
    const result = await service.createShipment(data);
    
    assert.ok(result.success);
    assert.ok(result.data.id);
  });

  it('should throw error with invalid data', async () => {
    const data = { /* invalid data */ };
    
    await assert.rejects(
      () => service.createShipment(data),
      /Invalid shipment data/
    );
  });
});
```

### **Types of Tests**

- **Unit Tests**: Test individual functions/classes
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Load and stress testing

---

## 📚 **Documentation**

### **Code Documentation**

```javascript
/**
 * Create a new shipment with rate shopping
 * @param {Object} shipmentData - Shipment data
 * @param {Object} shipmentData.to_address - Destination address
 * @param {Object} shipmentData.from_address - Origin address
 * @param {Object} shipmentData.parcel - Package details
 * @returns {Promise<Object>} Created shipment with rates
 * @throws {Error} If shipment creation fails
 */
async function createShipment(shipmentData) {
  // Implementation
}
```

### **Update Documentation**

When making changes, update:

- `README.md` - If API changes
- `ARCHITECTURE.md` - If architecture changes
- `CHANGELOG.md` - For all changes
- API docs - For endpoint changes
- Code comments - For complex logic

---

## 🎯 **Areas for Contribution**

### **Good First Issues**

Look for issues labeled `good first issue` - these are great for newcomers!

Examples:
- Documentation improvements
- Adding tests
- UI enhancements
- Bug fixes

### **Help Wanted**

Issues labeled `help wanted` are important features that need contributors:

- GraphQL API layer
- Mobile app development
- Advanced monitoring
- Marketplace integrations

### **Current Priorities**

1. **GraphQL API** (v4.2.0)
2. **Monitoring & Observability** (v4.2.0)
3. **Load Testing** (v4.3.0)
4. **Mobile Apps** (v4.4.0)

---

## 📞 **Getting Help**

- **Questions**: Use [GitHub Discussions](https://github.com/bischoff99/easypost-mcp-2025/discussions)
- **Bugs**: Create an issue with bug report template
- **Features**: Create an issue with feature request template
- **Chat**: Join our [Discord server](https://discord.gg/easypost)

---

## 🏆 **Recognition**

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Monthly contributor spotlight
- Swag for significant contributions!

---

## 📜 **License**

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EasyPost MCP Server 2025! 🙏

**Questions?** Feel free to ask in [Discussions](https://github.com/bischoff99/easypost-mcp-2025/discussions)!
