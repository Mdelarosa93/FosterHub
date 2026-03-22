# FosterHub API Endpoint Draft

## 1. Purpose

This document defines a starter API endpoint draft for FosterHub.

The goal is to map the product and data model into a practical backend interface that can support:
- multiple portals
- role/permission-aware access
- workflow-heavy operations
- modular domain boundaries

This is a logical API draft, not final code.

---

## 2. API Style Recommendation

### Recommended approach
- REST API
- JSON payloads
- versioned base path

### Suggested base path
`/api/v1`

### Why REST for MVP
- easier to implement/debug
- fits operational CRUD + workflow actions well
- works cleanly with Next.js frontend and NestJS backend
- simpler for small teams than GraphQL early on

---

## 3. Common API Conventions

## 3.1 Auth conventions
- authenticated endpoints require session or bearer token
- authorization is enforced server-side
- every request is evaluated against role + permission + case/context scope

## 3.2 Standard list query params
Common list endpoints may support:
- `page`
- `limit`
- `sort`
- `order`
- `search`
- `status`
- `teamId`
- `workerId`
- `caseId`
- `childId`

## 3.3 Response conventions
### Example success
```json
{
  "data": {},
  "meta": {}
}
```

### Example error
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

## 3.4 Resource naming
Use plural nouns for collections:
- `/cases`
- `/users`
- `/requests`

Use action endpoints only when the action is workflow-specific and not simple CRUD:
- `/requests/:id/approve`
- `/vendors/:id/approve`
- `/placement-requests/:id/respond`

---

# 4. Auth and Session Endpoints

## 4.1 Authentication
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/accept-invite`
- `POST /auth/verify-mfa` *(later if MFA enabled)*

## 4.2 Current session/user
- `GET /auth/me`
- `GET /auth/my-permissions`
- `GET /auth/my-navigation`

### Notes
`/auth/my-navigation` can help drive role-aware frontend menus.

---

# 5. Organization, Users, Teams, Roles, Permissions

## 5.1 Organizations
- `GET /organizations/:id`
- `PATCH /organizations/:id`
- `GET /organizations/:id/settings`
- `PATCH /organizations/:id/settings`

## 5.2 Users
- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `POST /users/:id/deactivate`
- `POST /users/:id/reactivate`

## 5.3 Teams
- `GET /teams`
- `POST /teams`
- `GET /teams/:id`
- `PATCH /teams/:id`
- `GET /teams/:id/users`
- `POST /teams/:id/users`

## 5.4 Role templates
- `GET /role-templates`
- `POST /role-templates`
- `GET /role-templates/:id`
- `PATCH /role-templates/:id`
- `GET /role-templates/:id/permissions`
- `PUT /role-templates/:id/permissions`

## 5.5 Permissions
- `GET /permissions`

## 5.6 User role assignments
- `GET /users/:id/roles`
- `POST /users/:id/roles`
- `DELETE /users/:id/roles/:roleAssignmentId`

## 5.7 User permission overrides
- `GET /users/:id/permission-overrides`
- `POST /users/:id/permission-overrides`
- `PATCH /users/:id/permission-overrides/:overrideId`
- `DELETE /users/:id/permission-overrides/:overrideId`

---

# 6. Children, Cases, Assignments, Participants

## 6.1 Children
- `GET /children`
- `POST /children`
- `GET /children/:id`
- `PATCH /children/:id`

## 6.2 Cases
- `GET /cases`
- `POST /cases`
- `GET /cases/:id`
- `PATCH /cases/:id`
- `POST /cases/:id/close`
- `POST /cases/:id/reopen`

## 6.3 Case assignments
- `GET /cases/:id/assignments`
- `POST /cases/:id/assignments`
- `PATCH /cases/:id/assignments/:assignmentId`
- `DELETE /cases/:id/assignments/:assignmentId`

## 6.4 Case participants
- `GET /cases/:id/participants`
- `POST /cases/:id/participants`
- `PATCH /cases/:id/participants/:participantId`
- `DELETE /cases/:id/participants/:participantId`

## 6.5 Case contacts
- `GET /cases/:id/contacts`
- `POST /cases/:id/contacts`
- `PATCH /cases/:id/contacts/:contactId`
- `DELETE /cases/:id/contacts/:contactId`

## 6.6 Case timeline/activity
- `GET /cases/:id/activity`
- `GET /cases/:id/notes`
- `POST /cases/:id/notes`
- `PATCH /cases/:id/notes/:noteId`
- `DELETE /cases/:id/notes/:noteId`

---

# 7. Intake Endpoints

## 7.1 Intake records
- `GET /intake-records`
- `POST /intake-records`
- `GET /intake-records/:id`
- `PATCH /intake-records/:id`

## 7.2 Intake details
- `GET /intake-records/:id/details`
- `PUT /intake-records/:id/details`

## 7.3 Intake actions
- `POST /intake-records/:id/assign-worker`
- `POST /intake-records/:id/assign-placement-finder`
- `POST /intake-records/:id/start-placement-search`
- `POST /intake-records/:id/convert-to-case`

## 7.4 Participant invites
- `GET /cases/:id/invites`
- `POST /cases/:id/invites`
- `POST /cases/:id/invites/:inviteId/resend`
- `POST /cases/:id/invites/:inviteId/revoke`

---

# 8. Placement and Resource Home Endpoints

## 8.1 Resource homes
- `GET /resource-homes`
- `POST /resource-homes`
- `GET /resource-homes/:id`
- `PATCH /resource-homes/:id`
- `POST /resource-homes/:id/set-availability`

## 8.2 Resource home preferences
- `GET /resource-homes/:id/preferences`
- `PUT /resource-homes/:id/preferences`

## 8.3 Placement searches
- `GET /placement-searches`
- `POST /placement-searches`
- `GET /placement-searches/:id`
- `PATCH /placement-searches/:id`
- `POST /placement-searches/:id/pause`
- `POST /placement-searches/:id/resume`
- `POST /placement-searches/:id/complete`

## 8.4 Placement matches
- `GET /placement-searches/:id/matches`
- `POST /placement-searches/:id/generate-matches`
- `PATCH /placement-searches/:id/matches/:matchId`

## 8.5 Placement requests
- `GET /placement-requests`
- `POST /placement-requests`
- `GET /placement-requests/:id`
- `POST /placement-requests/:id/send`
- `POST /placement-requests/:id/close`

## 8.6 Placement request recipients / responses
- `GET /placement-requests/:id/recipients`
- `POST /placement-requests/:id/respond` *(resource parent response)*
- `POST /placement-requests/:id/shortlist/:resourceHomeId`

## 8.7 Placements
- `GET /placements`
- `POST /placements`
- `GET /placements/:id`
- `PATCH /placements/:id`
- `POST /placements/:id/end`

---

# 9. Messaging and Communications Endpoints

## 9.1 Conversation threads
- `GET /threads`
- `POST /threads`
- `GET /threads/:id`
- `PATCH /threads/:id`

## 9.2 Thread participants
- `GET /threads/:id/participants`
- `POST /threads/:id/participants`
- `DELETE /threads/:id/participants/:participantId`

## 9.3 Messages
- `GET /threads/:id/messages`
- `POST /threads/:id/messages`
- `PATCH /threads/:id/messages/:messageId`
- `POST /threads/:id/messages/:messageId/read`

## 9.4 Attachments
- `POST /messages/:id/attachments`
- `DELETE /messages/:id/attachments/:attachmentId`

## 9.5 Inbox and communication views
- `GET /communications/inbox`
- `GET /communications/unread-count`
- `GET /communications/filters`

## 9.6 Broadcasts *(Phase 2 or later depending on scope)*
- `GET /broadcast-campaigns`
- `POST /broadcast-campaigns`
- `GET /broadcast-campaigns/:id`
- `PATCH /broadcast-campaigns/:id`
- `POST /broadcast-campaigns/:id/send`
- `POST /broadcast-campaigns/:id/cancel`
- `GET /broadcast-campaigns/:id/recipients`

---

# 10. Requests and Approvals Endpoints

## 10.1 Requests
- `GET /requests`
- `POST /requests`
- `GET /requests/:id`
- `PATCH /requests/:id`

## 10.2 Request actions
- `POST /requests/:id/submit`
- `POST /requests/:id/approve`
- `POST /requests/:id/deny`
- `POST /requests/:id/request-more-info`
- `POST /requests/:id/complete`
- `POST /requests/:id/reassign`

## 10.3 Request participants
- `GET /requests/:id/participants`
- `POST /requests/:id/participants`

## 10.4 Request comments
- `GET /requests/:id/comments`
- `POST /requests/:id/comments`
- `PATCH /requests/:id/comments/:commentId`
- `DELETE /requests/:id/comments/:commentId`

## 10.5 Request documents
- `GET /requests/:id/documents`
- `POST /requests/:id/documents`
- `DELETE /requests/:id/documents/:documentLinkId`

---

# 11. Scheduling Endpoints

## 11.1 Appointments
- `GET /appointments`
- `POST /appointments`
- `GET /appointments/:id`
- `PATCH /appointments/:id`
- `POST /appointments/:id/cancel`
- `POST /appointments/:id/reschedule`
- `POST /appointments/:id/confirm-attendance`

## 11.2 Appointment participants
- `GET /appointments/:id/participants`
- `POST /appointments/:id/participants`
- `PATCH /appointments/:id/participants/:participantId`
- `DELETE /appointments/:id/participants/:participantId`

## 11.3 Calendar views
- `GET /calendar/my`
- `GET /calendar/team`
- `GET /calendar/case/:caseId`

---

# 12. Document Endpoints

## 12.1 Document uploads and metadata
- `POST /documents/upload`
- `GET /documents/:id`
- `DELETE /documents/:id`

## 12.2 Document access / download
- `GET /documents/:id/download`

## 12.3 Generic document linking
- `POST /document-links`
- `DELETE /document-links/:id`

### Note
Some teams may prefer attaching documents through the domain-specific endpoints instead of a generic document-links API. Both approaches can coexist.

---

# 13. Vendor Endpoints

## 13.1 Vendors
- `GET /vendors`
- `POST /vendors`
- `GET /vendors/:id`
- `PATCH /vendors/:id`
- `POST /vendors/:id/approve`
- `POST /vendors/:id/deny`
- `POST /vendors/:id/suspend`
- `POST /vendors/:id/set-visibility`

## 13.2 Vendor contacts
- `GET /vendors/:id/contacts`
- `POST /vendors/:id/contacts`
- `PATCH /vendors/:id/contacts/:contactId`
- `DELETE /vendors/:id/contacts/:contactId`

## 13.3 Vendor applications
- `GET /vendor-applications`
- `POST /vendor-applications`
- `GET /vendor-applications/:id`
- `PATCH /vendor-applications/:id`
- `POST /vendor-applications/:id/submit`
- `POST /vendor-applications/:id/request-more-info`
- `POST /vendor-applications/:id/approve`
- `POST /vendor-applications/:id/deny`

## 13.4 Vendor requirements and submissions
- `GET /vendor-requirements`
- `POST /vendor-requirements`
- `PATCH /vendor-requirements/:id`
- `GET /vendor-applications/:id/submissions`
- `POST /vendor-applications/:id/submissions`
- `PATCH /vendor-applications/:id/submissions/:submissionId`
- `POST /vendor-applications/:id/submissions/:submissionId/review`

## 13.5 Vendor recommendations
- `GET /vendor-recommendations`
- `POST /vendor-recommendations`
- `GET /vendor-recommendations/:id`
- `PATCH /vendor-recommendations/:id`
- `POST /vendor-recommendations/:id/approve-for-outreach`
- `POST /vendor-recommendations/:id/deny`
- `POST /vendor-recommendations/:id/convert-to-application`

## 13.6 Vendor offerings *(Phase 2 or later)*
- `GET /vendor-offerings`
- `POST /vendor-offerings`
- `GET /vendor-offerings/:id`
- `PATCH /vendor-offerings/:id`
- `POST /vendor-offerings/:id/publish`
- `POST /vendor-offerings/:id/archive`

---

# 14. Financial Endpoints

## 14.1 Invoices *(Phase 2 likely)*
- `GET /invoices`
- `POST /invoices`
- `GET /invoices/:id`
- `PATCH /invoices/:id`
- `POST /invoices/:id/submit`
- `POST /invoices/:id/approve`
- `POST /invoices/:id/deny`
- `POST /invoices/:id/mark-paid`

## 14.2 Invoice line items
- `GET /invoices/:id/line-items`
- `POST /invoices/:id/line-items`
- `PATCH /invoices/:id/line-items/:lineItemId`
- `DELETE /invoices/:id/line-items/:lineItemId`

## 14.3 Reimbursements
- `GET /reimbursements`
- `POST /reimbursements`
- `GET /reimbursements/:id`
- `PATCH /reimbursements/:id`
- `POST /reimbursements/:id/submit`
- `POST /reimbursements/:id/approve`
- `POST /reimbursements/:id/deny`
- `POST /reimbursements/:id/mark-paid`

---

# 15. Reporting and Dashboard Endpoints

## 15.1 Dashboard summaries
- `GET /dashboards/admin`
- `GET /dashboards/manager`
- `GET /dashboards/worker`
- `GET /dashboards/resource-parent`
- `GET /dashboards/vendor`

## 15.2 Operational reports
- `GET /reports/cases`
- `GET /reports/placements`
- `GET /reports/requests`
- `GET /reports/vendors`
- `GET /reports/workers`

## 15.3 Saved views
- `GET /saved-views`
- `POST /saved-views`
- `PATCH /saved-views/:id`
- `DELETE /saved-views/:id`

---

# 16. Outreach / Recruitment Endpoints

## 16.1 Recruitment leads *(later phase)*
- `GET /recruitment-leads`
- `POST /recruitment-leads`
- `GET /recruitment-leads/:id`
- `PATCH /recruitment-leads/:id`
- `POST /recruitment-leads/:id/assign`
- `POST /recruitment-leads/:id/convert`

## 16.2 Recruitment activities
- `GET /recruitment-leads/:id/activities`
- `POST /recruitment-leads/:id/activities`

## 16.3 Campaigns *(later phase)*
- `GET /campaigns`
- `POST /campaigns`
- `GET /campaigns/:id`
- `PATCH /campaigns/:id`
- `POST /campaigns/:id/schedule`
- `POST /campaigns/:id/send`
- `GET /campaigns/:id/metrics`

---

# 17. Audit and System Endpoints

## 17.1 Audit logs
- `GET /audit-logs`
- `GET /audit-logs/:id`

## 17.2 Health / diagnostics *(internal only)*
- `GET /health`
- `GET /ready`
- `GET /metrics` *(internal / monitoring only)*

---

# 18. Recommended MVP Endpoint Set

If FosterHub must stay tightly scoped at first, these are the most important endpoint groups:

## MVP essential domains
- `/auth/*`
- `/users/*`
- `/role-templates/*`
- `/permissions/*`
- `/cases/*`
- `/children/*`
- `/intake-records/*`
- `/placement-searches/*`
- `/placement-requests/*`
- `/resource-homes/*`
- `/threads/*`
- `/requests/*`
- `/appointments/*`
- `/vendors/*`
- `/vendor-applications/*`
- `/dashboards/*`

That gives you enough to support the core DHR + worker + resource parent + vendor onboarding workflows.

---

# 19. Example Workflow Mapping

## 19.1 Child intake workflow
1. `POST /intake-records`
2. `PUT /intake-records/:id/details`
3. `POST /intake-records/:id/assign-worker`
4. `POST /intake-records/:id/start-placement-search`
5. `POST /intake-records/:id/convert-to-case`

## 19.2 Placement request workflow
1. `POST /placement-searches`
2. `POST /placement-searches/:id/generate-matches`
3. `POST /placement-requests`
4. `POST /placement-requests/:id/send`
5. `POST /placement-requests/:id/respond`
6. `POST /placements`

## 19.3 Resource parent request workflow
1. `POST /requests`
2. `POST /requests/:id/submit`
3. `POST /requests/:id/request-more-info` or `/approve` or `/deny`

## 19.4 Vendor onboarding workflow
1. `POST /vendors`
2. `POST /vendor-applications`
3. `POST /vendor-applications/:id/submissions`
4. `POST /vendor-applications/:id/approve`
5. `POST /vendors/:id/set-visibility`

---

# 20. Final Recommendation

The API should be built as a role-aware, workflow-friendly REST API with:
- strong backend authorization
- domain-based route grouping
- a mix of CRUD and workflow action endpoints
- clean support for multiple portals

The most important rule is:
**permissions and context filtering must live in the backend, not just in the frontend.**

That will keep FosterHub consistent, secure, and maintainable as the product grows.
