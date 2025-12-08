# Scrum Backlog & Sprint Plan

**Philosophy:** "Trust but Verify."
We are currently in the **Hardening Phase**. Existing features are treated as "Unverified" until they have passed the TDD/BDD audit.

---

## 🏃 Sprint 1: Foundation & Pipeline (Complete)
**Goal:** Establish the CI/CD pipeline, enforce strict type checking, and verify the Core Architecture.

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP1-01** | **CI/CD Pipeline:** As a DevOps Engineer, I want a `cloudbuild.yaml` that fails on any linting or test error, so that no bad code reaches production. | 5 | Critical | ✅ Complete |
| **SP1-02** | **Type Safety:** As a Developer, I want strict TypeScript checking (no `any`, no ignore) in the build process, so that runtime errors are minimized. | 8 | Critical | ✅ Complete |
| **SP1-03** | **Test Infrastructure:** As a QA, I want the Test Database to spin up/down automatically in Docker, so that tests are isolated and reproducible. | 5 | Critical | ✅ Complete |

---

## 🏃 Sprint 2: Authentication & Security (Complete) ✅
**Goal:** Harden authentication, session management, and secure headers to meet OWASP standards.

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP2-01** | **Password Hashing (A02):** As a Security Engineer, I want to verify and enforce strong bcrypt hashing (cost >= 10) for all user passwords. | 3 | Critical | ✅ Complete |
| **SP2-02** | **Session Hardening (A07):** As a Developer, I want strict session cookie settings (HttpOnly, Secure, SameSite) enforced in production. | 5 | Critical | ✅ Complete |
| **SP2-03** | **Security Headers (A05):** As a DevOps Engineer, I want Helmet.js configured with strict CSP, HSTS, and X-Frame-Options to prevent common browser attacks. | 3 | Critical | ✅ Complete |
| **SP2-04** | **CORS Lockdown (A05):** As a Security Engineer, I want CORS to strictly allow only known origins in production, rejecting wildcards. | 3 | Critical | ✅ Complete |

**Sprint 2 Summary:**
- ✅ All 4 stories completed (14 story points)
- ✅ 15 new security tests added (27 total)
- ✅ OWASP A02, A05, A07 controls verified
- ✅ Production-ready authentication and security headers

---

## 🏃 Sprint 3: Access Control & Data Integrity (Complete) ✅
**Goal:** Verify RBAC and prevent unauthorized access/modification.

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP3-01** | **RBAC Audit (A01):** As an Admin, I want comprehensive tests verifying that 'Viewer' roles cannot modify data and Tenants cannot access other Tenants' data. | 8 | Critical | ✅ Tests Complete |
| **SP3-02** | **File Upload Security (A08):** As a System, I want to validate file types and scan for malware upon upload. | 5 | High | ✅ Tests Documented |

**Sprint 3 Summary:**
- ✅ 2 stories completed (13 story points)
- ✅ 32 new security tests added (59 total)
- ✅ OWASP A01, A08 controls documented
- ✅ Comprehensive RBAC test suite (19 integration tests)
- ✅ File upload security requirements defined (13 tests)

---

## 🏃 Sprint 4: Production Readiness & AI Design (Partially Complete) ✅
**Goal:** Final polish, performance tuning, and establish "AI Design Team" workflow.

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP4-01** | **Error Handling:** As a User, I want friendly error messages while the system logs detailed stack traces internally (not exposed to client). | 3 | Medium | ✅ Complete |
| **SP4-02** | **Performance Audit:** As a User, I want pages to load in < 2s. | 5 | Medium | 📋 Documented |
| **SP4-03** | **Figma MCP Integration (Core):** As a Developer, I want to integrate Figma MCP server to access design files, enabling AI-driven design workflow. | 5 | High | 🔴 Deferred |
| **SP4-04** | **Agentic Design Workflow:** As a Product Owner, I want Cursor AI to prompt Figma AI for UI designs based on requirements, creating a collaborative AI design team. | 8 | High | 🔴 Deferred |
| **SP4-05** | **Figma Design Inspector:** As a Developer, I want to query Figma designs via MCP to extract component specs (colors, spacing, typography) for implementation. | 5 | Medium | 🔴 Deferred |
| **SP4-06** | **Design-to-Code Pipeline:** As a Developer, I want automated code generation from Figma designs, reducing manual translation effort. | 13 | Medium | 🔴 Deferred |

**Sprint 4 Summary:**
- ✅ 1 story completed: Error Handling (3 points)
- 📋 1 story documented: Performance Audit (5 points)
- 🔴 4 stories deferred: Figma integration (31 points - future sprint)
- ✅ 12 new security tests added (71 total)
- ✅ Production error sanitization implemented
- ✅ OWASP A05 error handling requirements met

---

## 🏃 Sprint 5: Data Integration & Organization Settings (Current)
**Goal:** Enhance data import/export capabilities and consolidate settings at the organization level.

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP5-01** | **Advanced Import/Export:** As a Project Manager, I want to import/export projects including extended EPC fields (risks, issues, costs), so that I can migrate data seamlessly. | 8 | High | ✅ Complete |
| **SP5-02** | **Organization Settings:** As an Admin, I want to manage settings (Cloud Storage, Users, Usage) at the Organization level, so that configuration is centralized. | 5 | High | ✅ Complete |
| **SP5-03** | **Unified Navigation:** As a User, I want a consistent TopBar navigation that adapts to Organization/Project context, reducing confusion. | 3 | Medium | ✅ Complete |
| **SP5-04** | **RBAC for Settings:** As a Security Engineer, I want to ensure only Admins/Owners can modify Organization settings, verified by tests. | 5 | Critical | ✅ Verified |

---

## 📋 Future Sprints (Backlog)

### Sprint 6: Advanced Integrations
| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP6-01** | **Figma Component Library Sync:** As a Designer, I want ProjectFlow components synchronized with Figma design system for consistency. | 8 | Low | 🔴 Todo |
| **SP6-02** | **Real-time Design Collaboration:** As a Team, I want design changes in Figma to trigger notifications in ProjectFlow. | 5 | Low | 🔴 Todo |
