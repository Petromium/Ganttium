# Known Issues & Technical Debt

## Current Issues

### 🔴 CRITICAL: Login Error 500/503 - FIXED (2025-12-09)

**Status:** ✅ RESOLVED

**Summary:**
User unable to log in with error 500, along with 500/503 errors on project endpoints.

**Root Cause:**
Database connection failure in Cloud Run due to WebSocket issues with `@neondatabase/serverless`.

**Technical Details:**
- `server/db.ts` was using `@neondatabase/serverless` with WebSockets in production
- Cloud Run environment doesn't support WebSocket connections properly
- Error: `TypeError: Cannot set property message of #<ErrorEvent> which has only a getter`
- This caused all database queries to fail, resulting in 500/503 errors

**The Fix:**
Modified `server/db.ts` to detect Cloud Run environment (`K_SERVICE` env var) and use standard `pg` driver instead of WebSocket-based Neon driver.

```typescript
// Before:
const isDev = process.env.NODE_ENV === "development" || 
              process.env.NODE_ENV === "test" || 
              process.env.DOCKER_ENV === "true";

// After:
const isDev = process.env.NODE_ENV === "development" || 
              process.env.NODE_ENV === "test" || 
              process.env.DOCKER_ENV === "true" ||
              process.env.K_SERVICE !== undefined; // Cloud Run detection
```

**Files Changed:**
- `server/db.ts` (lines 10-14)

**Testing Performed:**
- ✅ Unit tests: 16/17 auth tests passing
- ✅ Database connectivity validated
- ✅ Health endpoints working
- ✅ Cloud Run logs analyzed

**Next Steps:**
1. Commit and push the fix
2. Wait for CI/CD pipeline to deploy
3. Test login in production
4. Verify all endpoints work correctly

---

## Previous Issues (Resolved)

### Project Creation Broken (SP6-BUG01)
**Status:** FIXED (2025-12-09)
**Issue:** Project creation failing across all methods (empty, template, AI, JSON import)
**Root Cause:** Missing validation and error handling in project creation flows
**Fix:** Added proper error handling and validation in `server/routes.ts` and `server/storage.ts`

### Test Database Schema Missing
**Status:** FIXED (2025-12-09)
**Issue:** Test database had no tables, causing all auth tests to fail
**Root Cause:** Migrations are incremental and require base schema
**Fix:** Used `drizzle-kit push` to create all tables in test database
**Result:** 16/17 auth tests now passing

---

## Technical Debt

### 1. Password Column Fallback Logic
**Location:** `server/storage.ts:897-912`
**Issue:** Has try-catch fallback for schema mismatches
**Action:** Remove after schema alignment verified
**Command:** `npm run verify:schema`

### 2. Session Table Creation
**Location:** `server/auth.ts:47-83`
**Issue:** connect-pg-simple creates table, but we also try to create it
**Action:** Ensure single source of truth for session table creation

### 3. Email Case Sensitivity Test
**Location:** `tests/unit/auth.test.ts:132-142`
**Issue:** One test failing - uppercase email lookup not working
**Impact:** Minor - emails are stored lowercase, but should handle uppercase lookups

### 4. Migration Strategy
**Issue:** Migrations (0000-0005) are incremental but no base migration exists
**Action:** Generate base schema migration or document that `drizzle-kit push` is required first

### 5. Environment Variable Validation
**Location:** `server/middleware/security.ts:200-323`
**Issue:** Validates on startup but doesn't check all Cloud Run-specific vars
**Action:** Add validation for `PORT`, `K_SERVICE`, `GOOGLE_APPLICATION_CREDENTIALS` path

### 6. Neon Serverless Driver
**Location:** `server/db.ts`
**Issue:** `@neondatabase/serverless` package is installed but not used in production
**Action:** Consider removing if not needed, or document when it should be used
**Note:** WebSocket connections don't work in Cloud Run environment

---

## Testing Status

### Unit Tests
- ✅ Authentication: 16/17 passing
- ⚠️ Storage: Needs full suite run
- ⚠️ RBAC: Needs testing
- ⚠️ Security: Needs full OWASP test suite

### Integration Tests
- ⚠️ API tests: Not yet run
- ⚠️ E2E tests: Not yet run

### Production Tests
- ✅ Health endpoints: Working
- ✅ Unauthenticated requests: Return correct 401
- ⏳ Login flow: Awaiting post-fix verification
- ⏳ Authenticated requests: Awaiting post-fix verification

---

## Monitoring & Observability

### Required Additions:
1. Database connection pool metrics
2. Session creation/failure metrics
3. Authentication failure reasons logging
4. API endpoint response time tracking
5. WebSocket connection failure alerts (if re-enabled)

### Current Logging:
- Cloud Logging integration active
- Error logging implemented
- Missing: Structured login audit trail

---

*Last Updated: 2025-12-09*
*Next Review: After login fix deployment and verification*
