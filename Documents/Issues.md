# Known Issues & Technical Debt

## Current Issues

*No critical issues at this time.*

---

## Resolved Issues

### 🟢 CRITICAL: CORS 403 "Origin not allowed" - FIXED (2025-12-10)

**Status:** ✅ FULLY RESOLVED

**Summary:**
All API requests in production returning `403: {"message":"Origin not allowed"}`. Users could not create projects, import data, or use AI features.

**Root Cause Analysis:**
- `ALLOWED_ORIGINS` environment variable was **NOT SET** in Cloud Run deployment
- The `server/middleware/security.ts` CORS middleware requires explicit origin allowlist
- Without `ALLOWED_ORIGINS`, all cross-origin requests were rejected

**Evidence:**
- Console errors: `403: {"message":"Origin not allowed"}` on `/api/projects`, `/api/ai/conversations`
- Network requests: All API calls returning 403 Forbidden

**The Fix:**
Set the `ALLOWED_ORIGINS` environment variable in Cloud Run:

```bash
gcloud run services update ganttium \
  --region us-central1 \
  --set-env-vars="ALLOWED_ORIGINS=https://ganttium-303401483984.us-central1.run.app"
```

**Files Involved:**
- `server/middleware/security.ts:115-141` - CORS configuration
- Cloud Run environment variables

**Verification Performed:**
- ✅ CORS preflight (OPTIONS) returns proper headers
- ✅ `/api/projects` returns 200 OK
- ✅ `/api/organizations` returns 200 OK
- ✅ Dashboard loads with full project data
- ✅ Projects page shows 2 projects with budgets
- ✅ Create Project dialog opens correctly

**Why This Was Missed:**
1. Initial deployment focused on secrets (DATABASE_URL, SESSION_SECRET, etc.)
2. `ALLOWED_ORIGINS` is a configuration variable, not a secret
3. Error message "Origin not allowed" was being displayed but confused with other issues
4. Previous investigations focused on database/auth, not CORS

**Prevention:**
1. Add `ALLOWED_ORIGINS` to deployment checklist
2. Update `Documents/Vault.md` to list all required environment variables (secrets + config)
3. Add CORS health check to CI/CD pipeline

---

### 🟢 CRITICAL: Database Access Error 500 - FIXED (2025-12-10)

**Status:** ✅ FULLY RESOLVED

**Summary:**
User unable to access projects or create new projects. All API endpoints returning 500 errors with database query failures.

**Root Cause Analysis:**

This issue had **TWO** distinct root causes that were masking each other:

#### Root Cause #1: WebSocket Connection Failure (Fixed 2025-12-09)
- `server/db.ts` was using `@neondatabase/serverless` with WebSockets in production
- Cloud Run environment doesn't support WebSocket connections properly
- Error: `TypeError: Cannot set property message of #<ErrorEvent> which has only a getter`
- **Fix:** Added `K_SERVICE` detection to use standard `pg` driver in Cloud Run

#### Root Cause #2: Database Schema Drift (Fixed 2025-12-10)
- **THE TRUE ROOT CAUSE** - Production Neon database was missing columns defined in Drizzle schema
- `shared/schema.ts` defined columns that didn't exist in production
- Error: `error: column "baseline_cost" does not exist`
- This caused all SELECT queries to fail after the WebSocket fix was deployed

**Missing Columns in Production:**

`projects` table was missing:
- `baseline_cost` (EPC Performance Metrics)
- `actual_cost`
- `earned_value`
- `updated_at`

`tasks` table was missing 19+ columns:
- `assigned_to_name`, `discipline`, `discipline_label`, `area_code`
- `weight_factor`, `constraint_type`, `constraint_date`
- `baseline_start`, `baseline_finish`, `actual_start_date`, `actual_finish_date`
- `work_mode`, `is_milestone`, `is_critical_path`
- `baseline_cost`, `actual_cost`, `earned_value`, `updated_at`

`project_templates` table was completely missing.

**The Fix:**
Applied database migrations directly to production Neon database:

```sql
-- Migration 0006: Add missing columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS baseline_cost NUMERIC DEFAULT '0';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT '0';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS earned_value NUMERIC DEFAULT '0';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- (Plus 19 additional columns for tasks table)
-- (Plus project_templates table creation)
```

**Files Changed:**
- `server/db.ts` (lines 10-14) - K_SERVICE detection
- `migrations/0006_add_missing_columns.sql` - Schema sync migration
- `migrations/0007_add_project_templates.sql` - Templates table

**Verification Performed:**
- ✅ Health endpoints: Working (`/api/health` returns 200 OK)
- ✅ Dashboard loading: Project Dashboard displays correctly
- ✅ Projects loading: "50MW Riverside Solar Power Plant" loads with $75M budget
- ✅ EVM Metrics: CPI 1.00, SPI 1.00 displaying correctly
- ✅ All navigation: Full sidebar accessible
- ✅ No 500 errors on database queries

**Why Previous 12+ Fix Attempts Failed:**
1. WebSocket error was catching attention, but was only PART of the problem
2. After fixing WebSocket issue, the schema drift error was exposed
3. Cloud Run logs showed the true error: `column "baseline_cost" does not exist`
4. Previous fixes addressed symptoms (driver choice, config) not root cause (schema drift)

**Prevention:**
1. Always run `drizzle-kit push` before deploying schema changes
2. Add schema validation to CI/CD pipeline
3. Compare `shared/schema.ts` with production DB before deployments
4. Log full database error details, not just generic 500

---

### 🟢 WebSocket Error in Cloud Run - FIXED (2025-12-09)

**Status:** ✅ RESOLVED

**Summary:**
WebSocket connections from `@neondatabase/serverless` fail in Cloud Run environment.

**Root Cause:**
Cloud Run doesn't properly support long-lived WebSocket connections used by Neon's serverless driver.

**The Fix:**
Modified `server/db.ts` to detect Cloud Run environment and use standard `pg` driver:

```typescript
const isDev = process.env.NODE_ENV === "development" || 
              process.env.NODE_ENV === "test" || 
              process.env.DOCKER_ENV === "true" ||
              process.env.K_SERVICE !== undefined; // Cloud Run detection
```

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

### 0. Missing Google Analytics Configuration (Low Priority)
**Location:** Client-side JavaScript
**Issue:** Console warning: "Missing Google Analytics Measurement ID: VITE_GA_MEASUREMENT_ID"
**Impact:** Minor - analytics not tracking, but app functions correctly
**Action:** Set `VITE_GA_MEASUREMENT_ID` environment variable for production analytics

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
**Issue:** Migrations are incremental - production was missing many columns
**Action:** CRITICAL - Always verify schema alignment before deployments
**Added:** `migrations/0006_add_missing_columns.sql`, `migrations/0007_add_project_templates.sql`
**Lesson:** Need to add schema validation to CI/CD pipeline

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
- ✅ Login flow: VERIFIED WORKING (2025-12-10)
- ✅ Authenticated requests: VERIFIED WORKING (2025-12-10)
- ✅ Dashboard loading: Full dashboard renders correctly
- ✅ Project data: Projects load with correct budget/metrics

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

*Last Updated: 2025-12-10 07:00 UTC*
*Status: All critical issues resolved. Application fully functional.*
*Latest Fix: CORS configuration - ALLOWED_ORIGINS now set in Cloud Run.*
