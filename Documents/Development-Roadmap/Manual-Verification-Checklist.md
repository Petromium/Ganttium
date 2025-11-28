# Manual Verification Checklist

**Phase:** 2 - Verification & Testing  
**Date:** 2025-01-XX  
**Purpose:** Comprehensive manual testing checklist for all critical features

---

## 1. Authentication & Authorization ✅

### Registration & Login
- [ ] User can register with email/password
- [ ] User receives email verification (if enabled)
- [ ] User can log in with email/password
- [ ] User can log in with Google OAuth
- [ ] Invalid credentials show appropriate error messages
- [ ] Rate limiting prevents brute force attacks (test with multiple failed attempts)

### Password Management
- [ ] User can request password reset
- [ ] Password reset email is sent (check inbox)
- [ ] Password reset link works
- [ ] Password reset token expires after 1 hour
- [ ] User can change password while logged in

### Two-Factor Authentication (2FA)
- [ ] User can enable 2FA
- [ ] QR code is generated correctly
- [ ] User can verify 2FA setup
- [ ] User is prompted for 2FA code after login (if enabled)
- [ ] User can use backup codes
- [ ] User can disable 2FA

### Session Management
- [ ] User session persists across page refreshes
- [ ] User session expires after 7 days of inactivity
- [ ] User can log out successfully
- [ ] Logged-out user cannot access protected routes

---

## 2. User Management ✅

### User Invitations
- [ ] Admin/Owner can invite new users
- [ ] Invitation email is sent (check inbox)
- [ ] Invitation link works
- [ ] Invitation token expires after 7 days
- [ ] User can accept invitation
- [ ] User is assigned correct role after acceptance

### Role Management
- [ ] Owner can change user roles
- [ ] Admin can change user roles (except owner)
- [ ] Cannot change last owner's role
- [ ] Cannot remove last owner
- [ ] Cannot remove yourself from organization

### Bulk Operations
- [ ] Bulk import users from CSV
- [ ] CSV import handles duplicates correctly
- [ ] CSV import creates invitations for new users
- [ ] Export users to CSV works correctly
- [ ] Exported CSV contains all expected fields

### Activity Logs
- [ ] User activities are logged (invitations, role changes, removals)
- [ ] Activity logs can be retrieved via API
- [ ] Activity logs show correct details (IP, user agent, timestamps)

---

## 3. Project Management ✅

### CRUD Operations
- [ ] Create new project with all fields
- [ ] Edit existing project
- [ ] Delete project (with confirmation)
- [ ] View project list
- [ ] Filter/search projects
- [ ] Project codes are unique within organization

### Project Access
- [ ] Only organization members can access projects
- [ ] Role-based permissions are enforced
- [ ] Non-members cannot access projects

---

## 4. Task Management (WBS) ✅

### Task CRUD
- [ ] Create task with all fields (name, description, dates, effort, etc.)
- [ ] Edit task
- [ ] Delete task (with confirmation)
- [ ] Create subtasks (hierarchy)
- [ ] View task hierarchy correctly

### Scheduling
- [ ] Automatic date calculation based on dependencies
- [ ] Task duration calculation based on effort and resources
- [ ] Baseline setting works correctly
- [ ] Schedule recalculation propagates correctly
- [ ] Critical path is calculated correctly

### Task Views
- [ ] List view displays all tasks
- [ ] Kanban view groups tasks by status
- [ ] Gantt chart displays correctly
- [ ] Calendar view shows tasks on correct dates
- [ ] Filtering and search work correctly

### Dependencies
- [ ] Create task dependencies
- [ ] Dependency types work correctly (FS, SS, FF, SF)
- [ ] Deleting a task updates dependent tasks
- [ ] Circular dependencies are prevented

---

## 5. Resource Management ✅

### Resource CRUD
- [ ] Create resource (human, material, equipment)
- [ ] Edit resource
- [ ] Delete resource
- [ ] Assign resource to task
- [ ] Remove resource from task

### Resource Allocation
- [ ] Resource availability is tracked
- [ ] Over-allocation warnings appear
- [ ] Resource costs are calculated correctly

---

## 6. Cost Management ✅

### Cost Items
- [ ] Create cost item
- [ ] Edit cost item
- [ ] Delete cost item
- [ ] Link cost item to task
- [ ] Link cost item to change request

### Cost Tracking
- [ ] Budget vs Actual is calculated correctly
- [ ] Committed costs are tracked
- [ ] Forecasted costs are tracked
- [ ] Cost variance is calculated correctly
- [ ] Cost Breakdown Structure (CBS) displays correctly

### Multi-Currency
- [ ] Exchange rates sync from ECB daily
- [ ] Currency conversion works correctly
- [ ] Multi-currency projects display correctly
- [ ] Exchange rate history is stored

---

## 7. Procurement ✅

### Requisitions
- [ ] Create procurement requisition
- [ ] Edit requisition
- [ ] Delete requisition
- [ ] Requisition number is auto-generated
- [ ] Requisition workflow works (draft → submitted → approved → ordered → received)

### Resource Requirements
- [ ] Create resource requirement for task
- [ ] Check inventory before sourcing
- [ ] Allocate inventory to projects/tasks
- [ ] Track inventory allocations
- [ ] Return inventory when project completes

---

## 8. Change Management ✅

### Change Requests
- [ ] Create change request
- [ ] Edit change request
- [ ] Delete change request
- [ ] Change request code is auto-generated
- [ ] Link change request to tasks
- [ ] Link change request to cost items

### Approval Workflow
- [ ] Create approval workflow
- [ ] Add approvers in sequence
- [ ] Approver receives notification email
- [ ] Approver can approve/reject
- [ ] Workflow progresses through sequence correctly
- [ ] Change request status updates correctly

### Analytics
- [ ] Change request dashboard displays correctly
- [ ] Charts show correct data
- [ ] Metrics are calculated correctly
- [ ] Filtering works correctly

---

## 9. Risks & Issues ✅

### Risks
- [ ] Create risk
- [ ] Edit risk
- [ ] Delete risk
- [ ] Link risk to task
- [ ] Risk matrix displays correctly
- [ ] Risk status updates correctly

### Issues
- [ ] Create issue
- [ ] Edit issue
- [ ] Delete issue
- [ ] Link issue to task
- [ ] Issue log displays correctly
- [ ] Issue status updates correctly

---

## 10. Documents ✅

### Document Management
- [ ] Upload document
- [ ] View document
- [ ] Download document
- [ ] Delete document
- [ ] Link document to task
- [ ] Document categories work correctly
- [ ] File size limits are enforced

---

## 11. Reports ✅

### Report Generation
- [ ] Generate project status report (PDF)
- [ ] Generate risk register report (PDF)
- [ ] Generate issue log report (PDF)
- [ ] Generate EVA report (PDF)
- [ ] Reports contain correct data
- [ ] Reports are formatted correctly

### Email Reports
- [ ] Send report via email
- [ ] Report email contains correct attachments
- [ ] Email is sent to correct recipients

---

## 12. Chat & Collaboration ✅

### Chat Features
- [ ] Create conversation
- [ ] Send message
- [ ] Receive message in real-time (WebSocket)
- [ ] Typing indicators work
- [ ] Unread count updates correctly
- [ ] Task-specific chats work
- [ ] Deep linking to task chats works

### Notifications
- [ ] Email notifications are sent for:
  - [ ] Task assignment
  - [ ] Change request submitted
  - [ ] Change request approval needed
  - [ ] Change request approved/rejected
  - [ ] Risk identified
  - [ ] Issue created

---

## 13. Import/Export ✅

### Project Import/Export
- [ ] Export project to JSON
- [ ] Import project from JSON
- [ ] Imported project matches exported project
- [ ] Import handles errors gracefully

### CSV Import/Export
- [ ] Export contacts to CSV
- [ ] Import contacts from CSV
- [ ] Export users to CSV
- [ ] Import users from CSV
- [ ] CSV templates download correctly
- [ ] Import validates data correctly

---

## 14. Analytics & Dashboards ✅

### Project Dashboard
- [ ] Project metrics display correctly
- [ ] Charts render correctly
- [ ] Data is up-to-date
- [ ] Filters work correctly

### PMO Dashboard
- [ ] Cross-project metrics display correctly
- [ ] Organization-level analytics work
- [ ] Date range filters work

### Change Request Analytics
- [ ] Change request dashboard displays correctly
- [ ] Metrics are calculated correctly
- [ ] Charts show correct data

---

## 15. Security ✅

### Rate Limiting
- [ ] API rate limiting works (test by sending many requests)
- [ ] Auth rate limiting prevents brute force (5 attempts)
- [ ] Password reset rate limiting works (3 attempts/hour)
- [ ] Upload rate limiting works (20 uploads/hour)

### CORS
- [ ] CORS allows configured origins
- [ ] CORS blocks unconfigured origins (in production)

### Security Headers
- [ ] Helmet.js security headers are present
- [ ] CSP headers are set correctly
- [ ] HSTS headers are set correctly

### Input Validation
- [ ] Invalid inputs are rejected
- [ ] SQL injection attempts are prevented
- [ ] XSS attempts are prevented

---

## 16. Multi-Tenant Isolation ✅

### Organization Isolation
- [ ] Users cannot access other organizations' data
- [ ] Projects are isolated by organization
- [ ] Contacts are isolated by organization
- [ ] Cross-organization data leakage is prevented

---

## 17. Performance ✅

### Load Testing
- [ ] Application handles 50+ concurrent users
- [ ] Database queries are optimized
- [ ] Page load times are acceptable (<3s)
- [ ] API response times are acceptable (<500ms)

### WebSocket Performance
- [ ] Real-time updates work with multiple users
- [ ] WebSocket connections are stable
- [ ] Redis Pub/Sub works correctly (multi-pod scenario)

---

## 18. Mobile Responsiveness ✅

### Mobile Views
- [ ] Application works on iPhone SE (375x667)
- [ ] Application works on larger mobile devices
- [ ] Touch targets are appropriate size
- [ ] Navigation works on mobile
- [ ] Forms are usable on mobile

---

## 19. Browser Compatibility ✅

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Mobile

---

## 20. Error Handling ✅

### Error Messages
- [ ] User-friendly error messages are displayed
- [ ] Technical errors are logged but not exposed
- [ ] 404 pages work correctly
- [ ] 500 errors are handled gracefully

---

## Notes

- **Date Completed:** ___________
- **Tested By:** ___________
- **Issues Found:** ___________
- **Critical Issues:** ___________
- **Recommendations:** ___________

---

## Sign-off

- [ ] All critical features verified
- [ ] No critical bugs found
- [ ] Ready for production deployment

**Reviewed By:** ___________  
**Date:** ___________

