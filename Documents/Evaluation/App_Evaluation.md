# Application Evaluation – Ganttium EPC PMIS (V4 Planning)

## Story Alignment
- **Backlog Reference:** `SP6-T07 – Pipeline Construction Template` (Sprint 6, Scrum_Backlog.md). This evaluation provides the architectural due diligence required before extending the Pipeline template family into a fully productionized Template Catalog in V4.

### Acceptance Criteria (BDD)
```
Scenario: Deliver a defensible architecture dossier
  Given I am preparing the V4 planning handoff
  When I review the evaluation package
  Then I see vision, feature, architecture, tech stack, lessons, and deployment summaries
  And each section cites current-state constraints and OWASP/security posture

Scenario: Distinguish first-party code from installed packages
  Given stakeholders need to scope V4 effort
  When they read the tech stack and feature sections
  Then custom modules authored in this repo are clearly separated from third-party libraries
```

## Vision Summary
- **Source:** `Documents/Project_Charter.md`
- Purpose-built **Project Management Information System (PMIS)** for large Engineering/Procurement/Construction programs.
- Anchored around dual workspaces (PMO governance vs execution teams) with strict RBAC, compliance (PMBOK, ISO 9001/45001, GAAP/IFRS), and security-first posture.
- Scope targets multi-tenant SaaS (100 orgs × 100 projects) with EPC-focused capabilities: WBS, scheduling, risks/issues/change control, procurement, cost management, collaboration, AI assistance, knowledge base, and mobile-responsive PWA access.

## Feature & Capability Landscape
### First-Party (Authored in Repo)
1. **RBAC & Org/Project Isolation** – `server/middleware/rbac.ts`, `server/routes.ts` enforce Owner/Admin/Member/Viewer permissions plus tenant boundaries; extensive OWASP A01 coverage via Vitest suites (`tests/unit/rbac.test.ts` etc.).
2. **Project Data Model & Storage Layer** – `shared/schema.ts` + Drizzle storage wrappers (`server/storage.ts`) covering projects, tasks, risks, issues, costs, exchange rates, lessons learned, communication intelligence.
3. **AI Assistant Hooks** – `server/aiAssistant.ts` integrates project context and function-calling to create artifacts (risks/issues); knowledge base integration (AD-009).
4. **Import/Export Service** – `server/services/importExportService.ts` plus REST hooks for JSON export and schema-validated import (`server/routes.ts`, `tests/unit/importExport.test.ts`).
5. **Collaboration & Real-time** – WebSocket gateway (`server/websocket.ts`) backed by Redis pub/sub for task/risk updates and chat.
6. **Security Middleware Suite** – `server/middleware/security.ts` layering Helmet, rate limiting, CORS allowlists, input sanitization, environment validation per OWASP mandates.
7. **Knowledge Base/Lessons Learned** – Domain objects and UI wiring for lessons search, AI suggestions, and proactive risk mitigation (see AD-009).
8. **Communication Intelligence Metrics** – Structured schema + migrations (`migrations/0001-0002`), enabling tone/clarity/responsiveness tracking without emotional inference (AD-010).

### Installed Packages / External Dependencies
- **Frontend Framework & UI:** React 18, Vite, Tailwind CSS, shadcn/ui (Radix UI primitives), @dnd-kit for drag/drop, TanStack Query/Table, Wouter for routing.
- **Backend Framework:** Express.js, Helmet, express-session with connect-pg-simple, express-rate-limit, Zod/drizzle-zod for validation.
- **Data & Infra:** PostgreSQL (pg & drizzle-orm), Redis (ioredis), Google Cloud services (logging, monitoring, storage, secret manager), ECB API (exchange rates), OpenAI/Gemini SDKs, SendGrid, Twilio.
- **Tooling & Testing:** Vitest, Playwright, tsx, esbuild, Vite plugins, Testing Library, Supertest.

## Structure & Architecture
- **Pattern:** Monolithic TypeScript codebase with clear layering (client React SPA + Express API + PostgreSQL/Redis) per `Documents/Architecture_Map.md`.
- **Client:** Entry at `client/src/main.tsx`, router `client/src/App.tsx`, contexts under `client/src/contexts`, feature pages under `client/src/pages`, shadcn-based components under `client/src/components`.
- **Server:** `server/app.ts` composes middleware, registers `server/routes.ts`, wires services (AI, PDF, email, exchange rates). Storage layer centralizes DB access. Websocket server handles realtime.
- **Shared Contracts:** `shared/schema.ts` defines Drizzle schemas reused on both server and tooling; Zod schemas (some pending) enforce validation.
- **Data Flow:** Security middleware → Auth → RBAC → Route handlers → Storage → PostgreSQL (plus Redis/WebSocket). Documented flows for HTTP, WebSocket, AI, knowledge base.
- **Cross-Cutting Concerns:** Cloud logging/monitoring services, audit middleware, scheduler for nightly exchange rate sync, environment validation guarding secrets/loading.

## Application Content Framework (Pages, Components, Relationships)
### Page Inventory (`client/src/pages`)
- **Workspace & Navigation:** `Dashboard.tsx`, `PMODashboardPage.tsx`, `PMOCalendarPage.tsx`, `AdminDashboard.tsx`, `LandingPage.tsx`, `not-found.tsx`.
- **Project Delivery:** `ProjectsPage.tsx`, `ProgramsPage.tsx`, `WBSPage.tsx`, `GanttPage.tsx`, `KanbanPage.tsx`, `CalendarPage.tsx`, `ResourcesPage.tsx`, `Resource`/`StakeholdersPage.tsx`.
- **Discipline Modules:** `RisksPage.tsx`, `IssuesPage.tsx`, `ChangeRequestsPage.tsx`, `CostPage.tsx`, `RACIMatrixPage.tsx`, `LessonsLearnedPage.tsx`, `DocumentsPage.tsx`, `ReportsPage.tsx`, `BugReportPage.tsx`, `BugReportsStatusPage.tsx`.
- **Enabling Functions:** `SettingsPage.tsx`, `UserManagementPage.tsx`, `ContactsPage.tsx`, `EmailTemplatesPage.tsx`, `PaymentPage.tsx`, `UserGuidePage.tsx`, `AIAssistantPage.tsx`, `ChatPage.tsx`, `Login/Forgot/ResetPassword` auth pages.

### Component System (`client/src/components`)
- **Global Layout & Navigation:** `TopBar.tsx`, `AppSidebar.tsx`, `RightSidebar.tsx`, `BottomSelectionToolbar.tsx`, `FloatingAIButton.tsx`, `CommandPalette.tsx`.
- **Feature Modules:**
  - **AI & Chat:** `ai/*` modals, `AIAssistantPreviewSidebar.tsx`, `chat/*` family (inputs, windows, message bubbles, file handlers).
  - **Dashboarding:** `dashboard/*`, `epc/*`, `widgets/*` for KPI visualization (S-Curves, gauges, drag/drop widgets).
  - **Modals & Editors:** `modals/*`, `TaskModal.tsx`, `ProjectEditModal.tsx`, `ImportFieldMapper.tsx`, `TemplateSelector.tsx`, `Resource` and `Risk` helper components.
  - **Settings & Org:** `settings/*`, `OrganizationsSection.tsx`, `PushNotificationSettings.tsx`.
- **UI Toolkit:** `components/ui/*` wraps Radix + shadcn primitives (buttons, tables, dialogs, sheets, charts). These are third-party derived but customized; business widgets compose these primitives.

### Relationships & Data Flow
- **Routing → Contexts → Pages:** `client/src/App.tsx` wires Auth/Project contexts. Pages consume contexts and TanStack Query hooks to call REST endpoints/websockets.
- **Pages → Feature Components:** Each page orchestrates domain-specific components (e.g., `RisksPage` uses `RiskSuggestions.tsx`, `EditRiskModal.tsx`; `SettingsPage` uses `settings/TagManagement.tsx`, `OrganizationsSection.tsx`).
- **Components → Services:** Components leverage hooks (`client/src/hooks`) to hit API clients defined in `client/src/lib`. Real-time updates propagate via `useWebSocket.ts`.
- **Server Contracts:** The same domains align with backend routes (`/api/projects`, `/api/risks`, `/api/import-export`, etc.) and storage modules. UI changes often mirror adjustments in `server/routes.ts` and `server/storage.ts`.
- **AI & Knowledge Base Integration:** Chat/AI components call `/api/ai/*`, which trigger `server/aiAssistant.ts` and knowledge base search (Lessons Learned) before mutating storage—maintaining human-in-the-loop previews (AIAssistantPreviewSidebar + AIActionPreviewModal).

## Tech Stack Summary
- **Languages & Build:** TypeScript end-to-end, Vite for client bundling, esbuild for server bundle, tsx for scripts.
- **Runtime:** Node.js 22 (currently), browser-based PWA.
- **Persistence:** PostgreSQL (Cloud SQL target) with Drizzle migrations, Redis for cache/sessions, Google Cloud Storage for files.
- **Security Controls:** Helmet CSP/HSTS, RBAC middleware, bcrypt hashing (cost 12), 2FA (speakeasy/qrcode), rate limiting, sanitized logging, OWASP-aligned test suites.
- **Observability:** Google Cloud Logging/Monitoring integrations, structured logs, health endpoints (`/health`, `/api/health`).
- **Distinguishing Custom vs Installed:** Custom modules (routes, services, middleware, storage, schedulers, AI orchestrations, UI flows) sit atop the dependency stack enumerated in `package.json`. Third-party libraries supply UI primitives, auth adapters, ORM, and SDKs; business logic, domain modeling, security policies, and workflows are bespoke.

## Lessons Learned (Key Findings for V4)
1. **Secret Management Pitfalls:** OAuth outage (Issue #010) traced to newline corruption during secret rotation; adopt file-based secret updates and enhanced error surfacing.
2. **Schema Drift & Raw SQL Debt:** Issue #007/#008 highlight mismatches between `shared/schema.ts` and the live database, forcing raw SQL fallbacks and disabled validation. V4 must prioritize schema reconciliation before extending templates.
3. **RBAC Enforcement Wins:** Multiple sprints invested in automated RBAC and OWASP A01 coverage; keep middleware-centric approach and ensure new routes reuse test harnesses.
4. **Import/Export Complexity:** Recent service refactor (manual tests + Vitest) uncovered migration failures during test setup (missing base tables); underscores need for deterministic migrations and seeded reference data.
5. **CI/CD Compliance:** Prior lapses (reported in `Documents/cursor_ci_cd.md`) demonstrated risk when .cursorrules and production testing steps are skipped. V4 deliveries must continue strict Trust-but-Verify workflow with TDD before implementation.
6. **Operational Knowledge:** Notes.md emphasizes communication intelligence boundaries, knowledge base reuse, and multi-tenant isolation—must be preserved to avoid regressions.

## Deployment & Operational Strategy
- **Containerization:** Docker multi-stage builds, Docker Compose orchestration for app/db/redis; production target is GCP Cloud Run.
- **Pre-Commit Production Simulation (per repo mandate & `Documents/cursor_ci_cd.md`):**
  1. `docker-compose down && docker-compose build --no-cache && docker-compose up -d`
  2. Verify containers via `docker-compose ps`, tail logs `docker-compose logs -f app`, ensure DB/Redis connections established and no env validation errors.
  3. Health probes: `curl http://localhost:8080/health` and `/api/health`; confirm port 8080 binding.
  4. Run unit/E2E/security test suites (Vitest + Playwright) plus security scripts (npm audit).
- **Environment Controls:** Strict validation of `ALLOWED_ORIGINS`, 32+ char secrets, enforced PORT=8080 for Cloud Run, TLS enforcement pending (A02-003).
- **Observability & Recovery:** Google Cloud Logging/Monitoring clients, audit logs for sensitive actions, daily exchange-rate scheduler, backup scripts (`server/scripts/backupDatabase.ts`).
- **Future Enhancements:** Need documented dependency update policy, threat modeling artifacts, SSRF defenses, encryption at rest, and automated audit trails (per OWASP backlog).

## Readiness Guidance for V4 Team
- Leverage this evaluation to prioritize schema alignment, threat modeling, and dependency hygiene before adding new EPC templates.
- Maintain separation of responsibilities: first-party domain services continue to enforce EPC business logic; third-party packages provide frameworks only.
- Ensure any V4 feature works within the documented deployment process and OWASP checklist before being marked complete.

