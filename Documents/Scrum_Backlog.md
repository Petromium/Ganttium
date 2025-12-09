## 🏃 Sprint 6: Production-Ready EPC Project Templates
**Goal:** Create 20 comprehensive, production-ready EPC project templates with realistic WBS hierarchies, tasks, dependencies, risks, and document templates.

### Template Development Standards:
- **WBS Hierarchy:** Maximum 5 levels deep (Level 0-4)
- **Task Count:** 50-200 tasks per template (realistic for EPC projects)
- **Dependencies:** Proper FS/SS/FF/SF relationships with lag
- **Risks:** 10-30 risks per template with mitigation plans
- **Documents:** 5-15 document templates (metadata only)
- **Estimated Hours:** Realistic based on industry standards
- **Baseline Dates:** Calculated from dependencies and durations
- **Disciplines:** Proper EPC discipline assignments (Civil, Structural, Mechanical, Electrical, Instrumentation, Piping, Process, HSE, QA/QC, Procurement, Construction, Commissioning, Management)

| ID | Story | Story Points | Priority | Status |
|----|-------|--------------|----------|--------|
| **SP6-T01** | **Template: Solar PV Farm (100MW)** | As a Project Manager, I want a comprehensive Solar PV Farm template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates, so that I can start a new solar project with minimal manual input. | 13 | High | 🔴 Pending |
| **SP6-T02** | **Template: Wind Farm (Onshore)** | As a Project Manager, I want a comprehensive Onshore Wind Farm template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T03** | **Template: Combined Cycle Power Plant** | As a Project Manager, I want a comprehensive Combined Cycle Power Plant template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T04** | **Template: Battery Energy Storage System (BESS)** | As a Project Manager, I want a comprehensive BESS template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T05** | **Template: Offshore Platform (Fixed)** | As a Project Manager, I want a comprehensive Offshore Platform template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T06** | **Template: Refinery Turnaround** | As a Project Manager, I want a comprehensive Refinery Turnaround template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T07** | **Template: Pipeline Construction (Cross-country)** | As a Project Manager, I want a comprehensive Pipeline Construction template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T08** | **Template: LNG Terminal** | As a Project Manager, I want a comprehensive LNG Terminal template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T09** | **Template: Highway Expansion** | As a Project Manager, I want a comprehensive Highway Expansion template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T10** | **Template: Railway Electrification** | As a Project Manager, I want a comprehensive Railway Electrification template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T11** | **Template: Port Terminal Expansion** | As a Project Manager, I want a comprehensive Port Terminal Expansion template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T12** | **Template: Water Treatment Plant** | As a Project Manager, I want a comprehensive Water Treatment Plant template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T13** | **Template: Petrochemical Complex** | As a Project Manager, I want a comprehensive Petrochemical Complex template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T14** | **Template: Steel Mill Modernization** | As a Project Manager, I want a comprehensive Steel Mill Modernization template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T15** | **Template: Cement Plant** | As a Project Manager, I want a comprehensive Cement Plant template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T16** | **Template: Pharmaceutical Manufacturing Facility** | As a Project Manager, I want a comprehensive Pharmaceutical Manufacturing Facility template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T17** | **Template: Open Pit Mine Development** | As a Project Manager, I want a comprehensive Open Pit Mine Development template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T18** | **Template: Mineral Processing Plant** | As a Project Manager, I want a comprehensive Mineral Processing Plant template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T19** | **Template: Data Center (Tier III)** | As a Project Manager, I want a comprehensive Data Center (Tier III) template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-T20** | **Template: Hospital Complex** | As a Project Manager, I want a comprehensive Hospital Complex template with realistic WBS (5 levels max), 150+ tasks with dependencies, 25 risks, and 12 document templates. | 13 | High | 🔴 Pending |
| **SP6-OPS01** | **CI/CD Hardening** | As a DevOps Engineer, I want GitHub Actions to lint, test, scan, and deploy every commit to main automatically so that Cloud Run stays production-ready. | 8 | Critical | 🟡 In Progress |
| **SP6-BUG01** | **Project Creation Reliability** | As a Delivery Lead, I want creating projects (blank, from templates, AI, JSON import) to succeed without 5xx errors so that onboarding new programs is not blocked. | 8 | Critical | 🟡 In Progress |

#### SP6-OPS01 Acceptance Criteria
```
Scenario: Automated delivery on main
  Given code is pushed to main
  When the CI/CD workflow runs
  Then lint, build, unit tests, Playwright tests, security scans, Docker build, and Cloud Run deploy execute
  And the pipeline fails if any stage errors

Scenario: Security coverage
  Given security workflows run on push or schedule
  When CodeQL, npm audit, Snyk, and OWASP ZAP complete
  Then actionable reports are published and deployments block on configured severity
```

#### SP6-BUG01 Acceptance Criteria
```
Scenario: Create blank project
  Given I am an authenticated owner/admin
  When I submit the create-project form without template/AI/import
  Then the API responds 201 and the project is visible in the list

Scenario: Create from template
  Given public templates are available
  When I select a template and confirm creation
  Then template data loads without 5xx errors and the new project has seeded tasks/risks

Scenario: Create from AI and JSON import
  Given the AI assistant or JSON import wizard is used
  When the request completes
  Then the API returns success and audit logs capture the operation with no “503 Service Unavailable”
```
