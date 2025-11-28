# Master Development Prompt

Use this prompt to guide development and keep the AI assistant focused on the roadmap.

## Standard Prompt Template

```
You are my senior developer. We are executing the ProjectFlow development roadmap.

**Current Context:**
[State what you just finished or what issue you encountered]

**Current Phase:** Phase 1: MVP Completion
**Active Task:** [Select from Phase 1 tasks in 02-Phase-Execution-Plan.md]

**Files Recently Modified:**
[List files you've been working on]

**Issues Encountered:**
[Any blockers or problems]

**Next Steps:**
I want you to:
1. Review the roadmap in Documents/Development-Roadmap/
2. Identify the next uncompleted task in Phase 1
3. Proceed with implementing that task
4. Update the checklist in 02-Phase-Execution-Plan.md as you complete items
5. If you encounter issues, document them and suggest solutions

**Important:** Stay focused on the current phase. Do not drift to Phase 2+ features unless explicitly requested. If you notice we've drifted, redirect back to Phase 1 priorities.
```

## Quick Redirect Prompt (When Drifting)

```
We've drifted from the roadmap. Please:
1. Review Documents/Development-Roadmap/02-Phase-Execution-Plan.md
2. Identify the current phase and next uncompleted task
3. Resume work on that specific task
4. Do not add new features outside the current phase
5. Update 04-Active-Tasks-Tracker.md with current status
```

## Task-Specific Prompts

### For User Management (Phase 1.1):
```
Proceed with Phase 1.1: User Management System implementation.

Start with: [Specific subtask, e.g., "Create User Management API endpoints"]

Reference: Documents/Development-Roadmap/02-Phase-Execution-Plan.md section 1.1

Current Status: [What's been done so far]

Deliverables:
- API endpoints for user CRUD operations
- User invitation system
- Permission matrix UI
- RBAC middleware

Update the checklist in 02-Phase-Execution-Plan.md as you complete each item.
```

### For Change Requests (Phase 1.2):
```
Proceed with Phase 1.2: Change Management System implementation.

Start with: [Specific subtask, e.g., "Build Change Request UI page"]

Reference: Documents/Development-Roadmap/02-Phase-Execution-Plan.md section 1.2

Current Status: [What's been done so far]

Deliverables:
- ChangeRequestsPage.tsx (replace placeholder)
- Change Request CRUD modals
- Approval workflow UI
- Cost impact linkage

Update the checklist in 02-Phase-Execution-Plan.md as you complete each item.
```

### For Cost Management (Phase 1.3):
```
Proceed with Phase 1.3: Cost Management Enhancements.

Reference: Documents/Development-Roadmap/02-Phase-Execution-Plan.md section 1.3

Focus on:
- Budget vs Actual dashboard
- Cost forecasting
- Variance reporting

Update the checklist in 02-Phase-Execution-Plan.md as you complete each item.
```

### For Security (Phase 1.4):
```
Proceed with Phase 1.4: Security Hardening.

Reference: Documents/Development-Roadmap/02-Phase-Execution-Plan.md section 1.4

This is critical before production deployment. Implement:
- Helmet.js security headers
- Rate limiting
- Input sanitization
- Audit logging

Update the checklist in 02-Phase-Execution-Plan.md as you complete each item.
```

## Progress Check Prompt

```
Please provide a status update:
1. Review Documents/Development-Roadmap/02-Phase-Execution-Plan.md
2. Mark completed tasks with [x] in the checklist
3. Update Documents/Development-Roadmap/04-Active-Tasks-Tracker.md
4. Identify what's next in Phase 1
5. Estimate remaining time for current phase
6. Flag any blockers or dependencies
7. List any technical debt or shortcuts taken that need revisiting
```

## Issue Resolution Prompt

```
We encountered an issue during development:

**Issue:** [Describe the problem]
**Context:** [What were you working on]
**Error Messages:** [If any]
**Files Involved:** [List files]

Please:
1. Investigate the root cause
2. Propose a solution
3. Implement the fix
4. Verify the fix works
5. Document the issue and solution in a note
6. Resume the planned task or adjust the plan if needed
```

## Completion Check Prompt

```
Please verify completion of Phase 1 task: [Task name]

Checklist:
- [ ] All subtasks in 02-Phase-Execution-Plan.md are marked complete
- [ ] Code is tested and working
- [ ] No console errors or warnings
- [ ] Documentation updated if needed
- [ ] 04-Active-Tasks-Tracker.md updated
- [ ] Ready to move to next task

If complete, proceed to next Phase 1 task.
If not, identify what's remaining.
```

## Context Restoration Prompt

```
I'm resuming development after a break. Please:

1. Review Documents/Development-Roadmap/04-Active-Tasks-Tracker.md
2. Review Documents/Development-Roadmap/02-Phase-Execution-Plan.md
3. Check git history/logs to see what was last worked on
4. Identify where we left off
5. Propose the next immediate action
6. Ensure we're still aligned with Phase 1 priorities
```

