# Test Strategy & Quality Assurance

> **Purpose:** Define testing commands, mocking patterns, regression protocols, and quality assurance standards.

---

## Testing Mandate

**Core Principle:** **No Code Without Tests** - Every logic change requires accompanying tests.

### Test Requirements
1. **Unit Tests:** For isolated logic/utilities
2. **Integration Tests:** For API endpoints, database queries, and module interactions
3. **E2E Tests:** For critical user workflows
4. **Security Tests:** For OWASP Top 10 vulnerabilities

### Regression Prevention
- Explicitly check for backward compatibility
- Do not break existing public interfaces unless strictly authorized
- Run full test suite before merging changes

### Mocking Policy
- Mock external services (APIs, DBs) to ensure tests are fast and deterministic
- Strictly define the expected interface contract
- Use test fixtures for consistent test data

---

## Testing Frameworks

### Unit & Integration Tests: Vitest
**Configuration:** `vitest.config.ts`  
**Test Directory:** `tests/unit/`  
**Setup File:** `tests/setup.ts`

**Features:**
- TypeScript support
- Code coverage reporting (v8 provider)
- Path aliases configured (`@`, `@shared`)
- Global test environment setup

### E2E Tests: Playwright
**Configuration:** `playwright.config.ts`  
**Test Directory:** `tests/e2e/`  
**Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

**Features:**
- Parallel test execution
- Screenshot on failure
- Trace on retry
- Auto-start dev server

---

## Test Strategy & Protocol

### 1. Testing Pyramid

* **Unit Tests:** Located in `tests/unit/`. Run via `npm test`.

* **Integration Tests:** Located in `tests/e2e/`. Run via `npm run test:e2e`.

### 2. Debugging Protocol

* **Debug Mode:** Use the "Attach to Running Chrome" launch config on port 9222.

* **AI Debugging:** The `chrome-devtools` MCP server is active.

    * **Console Errors:** AI must read browser console logs via MCP before suggesting fixes.

    * **Network:** AI must inspect fetch headers via MCP if API calls fail.

---

## Test Commands

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

### Coverage Targets
- **Unit Tests:** Minimum 70% coverage for new code
- **Critical Paths:** Minimum 90% coverage (auth, payments, data access)
- **Integration Tests:** Cover all API endpoints

---

## Test Structure

### Unit Test Structure
```
tests/unit/
  ├── auth.test.ts          # Authentication tests
  ├── storage.test.ts       # Database storage tests
  ├── security/             # Security specific tests
  │   ├── injection.test.ts # A03: Injection
  │   └── auth.test.ts      # A07: Auth failures
  └── [module].test.ts      # Module-specific tests
```

### E2E Test Structure
```
tests/e2e/
  ├── auth.spec.ts          # Authentication flows
  ├── projects.spec.ts      # Project management flows
  └── [feature].spec.ts     # Feature-specific flows
```

### Test Fixtures
```
tests/fixtures/
  ├── auth.ts               # Authentication helpers
  └── db.ts                 # Database helpers
```

---

## Mocking Patterns

### Database Mocking
**Pattern:** Use test database with fixtures

```typescript
import { createTestUser, createTestOrganization } from '../fixtures/db';

describe('User Management', () => {
  it('should create user', async () => {
    const org = await createTestOrganization();
    const user = await createTestUser();
    // Test logic
  });
});
```

### External API Mocking
**Pattern:** Mock HTTP requests using Vitest mocks

```typescript
import { vi } from 'vitest';

// Mock external API
vi.mock('../../server/exchangeRateService', () => ({
  fetchExchangeRates: vi.fn().mockResolvedValue({
    USD: 1.0,
    EUR: 0.85,
  }),
}));
```

### Authentication Mocking
**Pattern:** Use test fixtures for authenticated requests

```typescript
import { createAuthenticatedUser } from '../fixtures/auth';

describe('Protected Route', () => {
  it('should require authentication', async () => {
    const { user, organization } = await createAuthenticatedUser();
    // Test with authenticated user
  });
});
```

---

## OWASP Top 10 Security Testing

### A01:2021 – Broken Access Control

```typescript
describe('Security: Broken Access Control', () => {
  it('should prevent cross-organization data access', async () => {
    const { user1, org1 } = await createAuthenticatedUser();
    const { user2, org2 } = await createAuthenticatedUser();
    const project2 = await createTestProject(org2.id);
    
    // User1 tries to access User2's project
    const response = await request(app)
      .get(`/api/projects/${project2.id}`)
      .set('Cookie', user1.sessionCookie);
    
    expect(response.status).toBe(403);
  });

  it('should prevent role escalation', async () => {
    const { user, org } = await createAuthenticatedUser({ role: 'admin' });
    
    // Admin tries to change their own role to owner
    const response = await request(app)
      .patch(`/api/organizations/${org.id}/users/${user.id}`)
      .set('Cookie', user.sessionCookie)
      .send({ role: 'owner' });
    
    expect(response.status).toBe(403);
  });
});
```

### A02:2021 – Cryptographic Failures

```typescript
describe('Security: Cryptographic Failures', () => {
  it('should hash passwords with bcrypt', async () => {
    const password = 'TestPassword123!';
    const hashed = await bcrypt.hash(password, 10);
    
    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt format
  });

  it('should not expose sensitive data in error messages', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrong' });
    
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.message).not.toContain('password');
  });
});
```

### A03:2021 – Injection

```typescript
describe('Security: Injection Attacks', () => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1' UNION SELECT * FROM users--",
  ];

  sqlInjectionPayloads.forEach(payload => {
    it(`should prevent SQL injection: ${payload}`, async () => {
      const response = await request(app)
        .get(`/api/projects?search=${encodeURIComponent(payload)}`)
        .set('Cookie', authenticatedCookie);
      
      expect(response.status).toBe(200);
      // Verify users table still exists
      const users = await storage.getUsers();
      expect(users).toBeDefined();
    });
  });

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
  ];

  xssPayloads.forEach(payload => {
    it(`should prevent XSS: ${payload}`, async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Cookie', authenticatedCookie)
        .send({ name: payload, organizationId: 1 });
      
      // Response should be sanitized
      expect(response.body.name).not.toContain('<script>');
      expect(response.body.name).not.toContain('javascript:');
    });
  });
});
```

### A07:2021 – Identification and Authentication Failures

```typescript
describe('Security: Authentication Failures', () => {
  it('should rate limit authentication attempts', async () => {
    const attempts = 6; // Exceeds limit of 5
    const responses = [];
    
    for (let i = 0; i < attempts; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
      responses.push(response.status);
    }
    
    // Last attempt should be rate limited
    expect(responses[responses.length - 1]).toBe(429);
  });

  it('should enforce password complexity', async () => {
    const weakPasswords = ['123', 'password', 'abc'];
    
    for (const password of weakPasswords) {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    }
  });
});
```

### A10:2021 – Server-Side Request Forgery (SSRF)

```typescript
describe('Security: SSRF Prevention', () => {
  it('should block internal network access', async () => {
    const maliciousUrls = [
      'http://localhost:5432', // Database
      'http://127.0.0.1/admin',
      'http://169.254.169.254/latest/meta-data', // AWS metadata
    ];
    
    for (const url of maliciousUrls) {
      const response = await request(app)
        .post('/api/external-fetch')
        .set('Cookie', authenticatedCookie)
        .send({ url });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not allowed');
    }
  });
});
```

---

## Test Maintenance

### Test Review Checklist
- [ ] Tests are independent (no shared state)
- [ ] Tests are deterministic (same input = same output)
- [ ] Tests are fast (< 1s per test)
- [ ] Tests are readable (clear names, good structure)
- [ ] Tests cover edge cases
- [ ] Tests cover error scenarios

### Test Naming Convention
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

---

## Known Test Issues

### Current Limitations
- Test database setup incomplete
- Some tests require manual database setup
- E2E tests require running dev server manually
- Coverage reporting not fully configured

### Planned Improvements
- [ ] Automated test database setup/teardown
- [ ] Docker-based test environment
- [ ] CI/CD pipeline integration
- [ ] Test data factories for complex scenarios

---

## Testing Best Practices

### DO ✅
- Write tests before fixing bugs (TDD when possible)
- Test behavior, not implementation
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies
- Clean up test data

### DON'T ❌
- Don't test implementation details
- Don't write flaky tests (time-dependent, random)
- Don't skip error scenarios
- Don't share test state between tests
- Don't test third-party libraries
- Don't write slow tests unnecessarily

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

---
**Last Updated:** 2025-01-04  
**Maintainer:** Technical Lead  
**Review Frequency:** Quarterly or when testing strategy changes
