# Scrum Backlog & Sprint Plan

**Philosophy:** "Trust but Verify."
We are currently in the **Hardening Phase**. Existing features are treated as "Unverified" until they have passed the TDD/BDD audit.

---

## 🏃 Sprint 1: Foundation & Pipeline (Current)
**Goal:** Establish the CI/CD pipeline, enforce strict type checking, and verify the Core Architecture.

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP1-01** | **CI/CD Pipeline:** As a DevOps Engineer, I want a `cloudbuild.yaml` that fails on any linting or test error, so that no bad code reaches production. | 5 | Critical | ✅ Complete |
| **SP1-02** | **Type Safety:** As a Developer, I want strict TypeScript checking (no `any`, no ignore) in the build process, so that runtime errors are minimized. | 8 | Critical | ✅ Complete |
| **SP1-03** | **Test Infrastructure:** As a QA, I want the Test Database to spin up/down automatically in Docker, so that tests are isolated and reproducible. | 5 | Critical | ✅ Complete |

**Update:** 
- Massive Schema Mismatch in `server/storage.ts` resolved.
- Client-side type errors in key modules (`Tasks`, `Resources`, `ChangeRequests`) fixed.
- CI/CD Build (`npm run build`) verified locally.

---

## 🏃 Sprint 2: Authentication & Security (Hardening)
// ... rest of file unchanged ...
