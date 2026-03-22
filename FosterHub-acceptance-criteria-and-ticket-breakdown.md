# FosterHub Acceptance Criteria and Ticket Breakdown

## 1. Purpose

This document converts the FosterHub MVP epics and user stories into a more execution-ready format.

It is intended to help with:
- product clarification
- design handoff
- engineering planning
- QA preparation
- sprint ticket creation

This is still a draft planning artifact, not a final Jira export.

---

## 2. Format

For each area, this document includes:
- a feature / story title
- ticket-style description
- acceptance criteria
- suggested subtasks / implementation tickets

The emphasis is on MVP execution.

---

# 3. Epic 1 — Auth, Users, Roles, and Permissions

## Ticket 1.1 — User Invitation Flow

### Description
Allow administrators to invite new users into FosterHub with a starting role template.

### Acceptance Criteria
- Admin can create an invite by entering at least an email and role template.
- Invite is stored with a pending status.
- Invited user receives an invitation link.
- Invite link can be accepted only once.
- Expired or revoked invites cannot be used.
- Admin can see invite status.

### Suggested Subtasks
- create invite data model / token flow
- build invite creation API
- build invite email template/service integration
- build invite acceptance UI
- build invite status admin view

---

## Ticket 1.2 — Login and Session Management

### Description
Allow users to log in and out securely.

### Acceptance Criteria
- User can log in with valid credentials.
- Invalid credentials return a clear error.
- Authenticated user session is persisted securely.
- User can log out successfully.
- Protected routes reject unauthorized access.

### Suggested Subtasks
- implement auth backend endpoints
- implement password hashing / verification
- implement frontend login form
- add route guards
- add session expiration handling

---

## Ticket 1.3 — Role Template Management

### Description
Allow administrators to manage reusable role templates.

### Acceptance Criteria
- Admin can view role templates.
- Admin can create a role template.
- Admin can edit a role template.
- Role template can be assigned to users.
- Role template displays linked permissions.

### Suggested Subtasks
- create role template CRUD endpoints
- create permissions association UI
- create admin role template screen

---

## Ticket 1.4 — Permission Assignment and Overrides

### Description
Support both role-based permissions and user-specific overrides.

### Acceptance Criteria
- User permissions are resolved from role template + overrides.
- Admin can add a permission override to a user.
- Admin can remove a permission override.
- Resolved permissions affect backend authorization.
- Restricted actions are blocked even if called directly.

### Suggested Subtasks
- implement permission resolution service
- implement override endpoints
- implement permission evaluation middleware/guards
- implement user permissions admin UI

---

## Ticket 1.5 — Role-Aware Navigation

### Description
Show each user the navigation relevant to their permissions.

### Acceptance Criteria
- Navigation differs by role/permissions.
- Users do not see restricted nav items.
- Navigation updates if permissions change.
- Hidden nav alone does not replace backend authorization.

### Suggested Subtasks
- create navigation config by permission
- add my-navigation endpoint
- implement route-aware frontend nav rendering

---

# 4. Epic 2 — Case Core and Child Records

## Ticket 2.1 — Create Child Record

### Description
Allow authorized users to create a child record.

### Acceptance Criteria
- Authorized user can create a child record with required fields.
- Validation errors are shown for missing required data.
- Child record is stored successfully.
- Child record is visible only to authorized users.

### Suggested Subtasks
- child model/migration
- child create/read/update endpoints
- child form UI
- validation rules

---

## Ticket 2.2 — Create and View Case Record

### Description
Allow authorized users to create and view case records linked to children.

### Acceptance Criteria
- Case can be created for a child.
- Case number is unique per organization.
- Authorized users can view case detail.
- Unauthorized users cannot access case detail.
- Case detail shows key summary information.

### Suggested Subtasks
- case model/migration
- case CRUD endpoints
- case list UI
- case detail shell UI
- organization-level uniqueness constraint

---

## Ticket 2.3 — Case Assignments

### Description
Allow cases to be assigned to workers and internal staff roles.

### Acceptance Criteria
- Authorized user can assign worker/supervisor/placement finder roles.
- Assignment history is recorded.
- Active assignments are visible on case detail.
- Worker sees assigned cases in their case list.

### Suggested Subtasks
- case_assignments schema/endpoints
- assignment panel UI
- worker filtered case query
- timeline/audit event creation

---

## Ticket 2.4 — Case Notes and Timeline

### Description
Provide note-taking and activity visibility on cases.

### Acceptance Criteria
- Authorized user can add a case note.
- Case notes appear in chronological order.
- Timeline shows key system and user actions.
- Visibility rules prevent external users from seeing internal-only notes.

### Suggested Subtasks
- notes schema/endpoints
- activity event logging
- notes UI
- visibility filtering

---

# 5. Epic 3 — Intake Workflow

## Ticket 3.1 — Intake Record Creation

### Description
Allow DHR users to create intake records before or during case creation.

### Acceptance Criteria
- Authorized user can create an intake record.
- Intake status defaults appropriately.
- Intake appears in intake queue.
- Intake can store summary/urgency/county information.

### Suggested Subtasks
- intake schema/endpoints
- intake queue UI
- intake create form
- list filtering by status/urgency

---

## Ticket 3.2 — Intake Detail and Status Management

### Description
Capture additional intake information and track progress through the workflow.

### Acceptance Criteria
- User can update intake details.
- Intake status can be changed only through valid transitions.
- Intake detail shows assignment and progress clearly.
- Intake history is logged.

### Suggested Subtasks
- intake details schema/endpoints
- intake status transition logic
- intake detail UI
- activity logging

---

## Ticket 3.3 — Intake Assignment Actions

### Description
Allow DHR to assign a worker and placement finder from the intake workflow.

### Acceptance Criteria
- User can assign a worker from intake detail.
- User can assign a placement finder from intake detail.
- Assigned users appear clearly on the intake screen.
- Assignment actions create corresponding activity events.

### Suggested Subtasks
- intake assignment action endpoints
- assignee selector UI
- assignment event tracking

---

## Ticket 3.4 — Convert Intake to Case

### Description
Allow an intake record to become an active case.

### Acceptance Criteria
- Intake can be converted into a case.
- Child and case records are linked correctly.
- Intake status reflects conversion.
- Duplicate accidental conversion is prevented.

### Suggested Subtasks
- intake-to-case service
- conversion button/UI
- transaction safety handling
- post-conversion redirect behavior

---

# 6. Epic 4 — Worker Portal

## Ticket 4.1 — Worker Dashboard

### Description
Provide workers with a dashboard summarizing their work.

### Acceptance Criteria
- Worker sees assigned case count.
- Worker sees unread messages.
- Worker sees upcoming appointments.
- Worker sees pending/open requests.
- Dashboard loads only worker-authorized data.

### Suggested Subtasks
- worker dashboard endpoint
- summary cards UI
- open item widgets
- dashboard loading/error states

---

## Ticket 4.2 — Worker Case List

### Description
Provide workers with a filtered list of their assigned cases.

### Acceptance Criteria
- Worker sees only assigned cases unless expanded permissions exist.
- Worker can search/filter by case status and open items.
- Case list links to case detail.
- Case list loads efficiently.

### Suggested Subtasks
- assigned cases query
- list filters/search UI
- pagination/sorting
- row-level navigation

---

## Ticket 4.3 — Worker Calendar

### Description
Allow workers to see appointments in a calendar view.

### Acceptance Criteria
- Worker can view appointments by date range.
- Calendar shows appointment title, time, and linked case/child.
- Worker can open appointment detail.
- Unauthorized appointments are not shown.

### Suggested Subtasks
- appointments query
- calendar UI
- appointment detail drawer/page
- date filtering

---

# 7. Epic 5 — Resource Parent Portal

## Ticket 5.1 — Parent Portal Shell and Dashboard

### Description
Create the caregiver-facing portal shell and dashboard.

### Acceptance Criteria
- Resource parent can log in to a parent-specific experience.
- Parent dashboard shows children in home, messages, requests, and appointments.
- Parent cannot see internal-only features/navigation.
- Dashboard reflects only the parent’s linked children/cases.

### Suggested Subtasks
- parent route shell
- parent dashboard endpoint
- dashboard cards/widgets
- parent permission/visibility checks

---

## Ticket 5.2 — Parent Child List and Detail

### Description
Allow resource parents to view children in their placement and approved information.

### Acceptance Criteria
- Parent sees only children linked through active placement/case relationship.
- Parent can open a child detail page.
- Child detail shows only approved information.
- Restricted case/internal information is hidden.

### Suggested Subtasks
- parent child query logic
- child detail page UI
- permission-filtered field rendering
- child overview components

---

## Ticket 5.3 — Parent Resources and Contacts

### Description
Provide parents with quick access to important support resources.

### Acceptance Criteria
- Parent can access emergency phone numbers and key contacts.
- Parent can see worker contact info where allowed.
- Resources page is accessible from parent navigation.

### Suggested Subtasks
- resources page UI
- contact/resource content model or config
- quick links on dashboard

---

# 8. Epic 6 — Messaging and Communication

## Ticket 6.1 — Thread Creation and Messaging

### Description
Allow authorized users to communicate through threads inside FosterHub.

### Acceptance Criteria
- Authorized user can create or access a thread.
- User can send messages in a thread.
- Messages persist and load in order.
- Only participants/authorized users can access the thread.

### Suggested Subtasks
- threads schema/endpoints
- messages schema/endpoints
- thread view UI
- message composer UI
- participant authorization checks

---

## Ticket 6.2 — Inbox and Unread Indicators

### Description
Provide users with an inbox experience and unread visibility.

### Acceptance Criteria
- User can see message threads in an inbox view.
- Unread count is visible.
- Opening a thread can mark messages as read.
- Inbox is scoped to user participation/permissions.

### Suggested Subtasks
- inbox query endpoint
- unread count endpoint
- read-state logic
- inbox UI list

---

## Ticket 6.3 — Case-Linked Communication Context

### Description
Show relevant case context around messages where appropriate.

### Acceptance Criteria
- Worker can identify the linked child/case for contextual threads.
- Messages tied to a case can be viewed from case detail.
- Parent-facing thread context stays simple and not overly bureaucratic.

### Suggested Subtasks
- case-thread linking logic
- case detail thread section
- context badge/components

---

# 9. Epic 7 — Requests and Approvals

## Ticket 7.1 — New Request Submission

### Description
Allow users such as resource parents to submit structured requests.

### Acceptance Criteria
- Submitter can create a request with required fields.
- Request can be saved as draft or submitted.
- Submitted request receives a status.
- Request is visible in the correct queue after submission.

### Suggested Subtasks
- request form schema/backend validation
- request create/submit endpoints
- request form UI
- status logic

---

## Ticket 7.2 — Request Review Queue

### Description
Allow workers/DHR reviewers to process incoming requests from a queue.

### Acceptance Criteria
- Authorized reviewer can see relevant requests.
- Queue supports filtering by status/type/child.
- Request detail shows summary, attachments, and comments.
- Unauthorized reviewers cannot access restricted requests.

### Suggested Subtasks
- request queue endpoint
- filters/search
- request detail UI
- reviewer permission guards

---

## Ticket 7.3 — Request Decisions

### Description
Allow authorized users to approve, deny, or ask for more information.

### Acceptance Criteria
- Reviewer can approve a request.
- Reviewer can deny a request with a reason.
- Reviewer can request more information.
- Status changes are tracked in history.
- Submitter can see updated status.

### Suggested Subtasks
- request decision endpoints
- reason capture UI
- history panel
- notifications on decision state change

---

## Ticket 7.4 — Request Comments and Documents

### Description
Allow users to comment on requests and attach supporting files.

### Acceptance Criteria
- Authorized users can add request comments.
- Authorized users can attach documents.
- Request detail shows comments and attached files.
- Visibility rules apply correctly.

### Suggested Subtasks
- request comments endpoints/UI
- request document linking endpoints/UI
- file upload integration

---

# 10. Epic 8 — Placement Workflow

## Ticket 8.1 — Resource Home Management

### Description
Allow DHR to manage foster/resource home records, availability, and preferences.

### Acceptance Criteria
- Authorized user can create and update resource home records.
- Capacity and current availability can be stored.
- Preferences/restrictions can be saved.
- Resource home data can be searched/filtered.

### Suggested Subtasks
- resource home schema/endpoints
- preferences schema/endpoints
- resource home admin UI
- search/filter UI

---

## Ticket 8.2 — Placement Search

### Description
Allow DHR/placement staff to start and manage placement searches.

### Acceptance Criteria
- Authorized user can create a placement search for a case.
- Placement search stores search criteria and urgency.
- Placement search can be active, paused, or completed.
- Eligible homes can be retrieved using basic filters.

### Suggested Subtasks
- placement search schema/endpoints
- match generation logic (basic)
- placement search UI
- criteria filter UI

---

## Ticket 8.3 — Placement Requests and Responses

### Description
Allow placement staff to send placement requests and capture responses from homes.

### Acceptance Criteria
- Placement request can be created and sent.
- Selected homes are recorded as recipients.
- Resource parent can respond with supported response types.
- Placement staff can review responses.
- No duplicate recipient rows for same request/home.

### Suggested Subtasks
- placement request endpoints
- recipient tracking
- parent-facing response action UI
- response review UI

---

## Ticket 8.4 — Record Placement Outcome

### Description
Allow staff to record the selected placement.

### Acceptance Criteria
- Authorized user can create a placement record.
- Placement links case to resource home.
- Placement start date is stored.
- Parent/case visibility updates correctly once placement is active.

### Suggested Subtasks
- placement record endpoints
- placement create UI
- placement side effects for visibility/portal access

---

# 11. Epic 9 — Vendor Onboarding Basics

## Ticket 9.1 — Vendor Invite and Portal Access

### Description
Allow DHR to invite vendors and allow vendors to access the onboarding portal.

### Acceptance Criteria
- DHR can create/invite vendor.
- Vendor can set up account from invite.
- Vendor sees onboarding status after login.
- Invalid/expired invite is handled clearly.

### Suggested Subtasks
- vendor invite flow
- vendor user association logic
- vendor portal auth routing
- onboarding status summary UI

---

## Ticket 9.2 — Vendor Onboarding Checklist and Submissions

### Description
Allow vendors to submit required onboarding items.

### Acceptance Criteria
- Vendor can see required onboarding items.
- Vendor can upload documents for required items.
- Submission status is tracked.
- Missing items remain visible until completed.

### Suggested Subtasks
- vendor requirements endpoints
- vendor submission endpoints
- onboarding checklist UI
- submission status components

---

## Ticket 9.3 — Vendor Review Queue and Decisioning

### Description
Allow DHR to review vendor submissions and approve/deny vendors.

### Acceptance Criteria
- Reviewer can see vendor applications in a queue.
- Reviewer can inspect vendor submissions.
- Reviewer can approve or deny the vendor/application.
- Reviewer can set vendor visibility public/private.
- Decision is recorded clearly.

### Suggested Subtasks
- vendor review queue endpoint/UI
- application detail/review UI
- decision actions
- visibility setting control

---

## Ticket 9.4 — Parent-Facing Approved Vendor Directory

### Description
Allow resource parents to browse approved public vendors.

### Acceptance Criteria
- Parent sees only public approved vendors.
- Vendor list supports basic browsing/search.
- Vendor details are viewable.
- Private/internal vendors are not shown.

### Suggested Subtasks
- parent vendor directory endpoint
- vendor card/list UI
- vendor detail page
- visibility filtering logic

---

# 12. Epic 10 — Documents and File Handling

## Ticket 10.1 — General File Upload Service

### Description
Provide a reusable upload flow for documents across cases, requests, and vendors.

### Acceptance Criteria
- Authorized user can upload supported file types.
- File metadata is stored.
- File is stored in object storage.
- Upload errors are shown clearly.

### Suggested Subtasks
- object storage integration
- upload endpoint
- frontend upload component
- validation for size/type

---

## Ticket 10.2 — Document Linking and Visibility

### Description
Allow uploaded documents to be linked to relevant entities with visibility rules.

### Acceptance Criteria
- Document can be linked to case/request/vendor application.
- Visibility scope can be assigned where applicable.
- Unauthorized users cannot download restricted documents.
- Authorized users can download linked documents.

### Suggested Subtasks
- document_links endpoints/service
- secure download endpoint
- visibility checks
- linked document UI components

---

# 13. Epic 11 — Dashboards and Reporting Basics

## Ticket 11.1 — Admin Dashboard Summary

### Description
Provide admins/managers with key operational counts and alerts.

### Acceptance Criteria
- Dashboard shows counts for open intakes, placements, requests, and vendor reviews.
- Dashboard data respects organization and permission scope.
- Dashboard loads within acceptable performance targets.

### Suggested Subtasks
- dashboard summary queries
- admin dashboard UI
- caching or optimization if needed

---

## Ticket 11.2 — Worker Dashboard Summary

### Description
Provide workers with a useful daily operational summary.

### Acceptance Criteria
- Dashboard shows my cases, my messages, my appointments, and open requests.
- Counts and lists reflect real-time or near-real-time data.
- Dashboard is scoped to the logged-in worker.

### Suggested Subtasks
- worker dashboard endpoint
- worker summary cards/widgets
- open item lists

---

# 14. Epic 12 — Auditability and Safety

## Ticket 12.1 — Audit Logging for Sensitive Actions

### Description
Log key system actions for accountability and review.

### Acceptance Criteria
- Permission changes are logged.
- Request decisions are logged.
- Vendor decisions are logged.
- Placement decisions are logged.
- Logs include actor, action, and timestamp.

### Suggested Subtasks
- audit log schema
- audit log service
- hook logging into major decision actions
- basic admin audit viewer

---

## Ticket 12.2 — Clear Authorization Errors

### Description
Provide understandable error handling for forbidden actions.

### Acceptance Criteria
- Unauthorized action returns consistent error response.
- Frontend shows user-friendly messaging.
- Errors do not expose sensitive implementation details.

### Suggested Subtasks
- standard auth error responses
- frontend error boundary/handling pattern
- permission error UI copy

---

# 15. Suggested Initial Ticket Grouping by Sprint

## Sprint 1
- 1.1 User Invitation Flow
- 1.2 Login and Session Management
- 1.3 Role Template Management
- 1.4 Permission Assignment and Overrides
- 1.5 Role-Aware Navigation

## Sprint 2
- 2.1 Create Child Record
- 2.2 Create and View Case Record
- 2.3 Case Assignments
- 2.4 Case Notes and Timeline

## Sprint 3
- 3.1 Intake Record Creation
- 3.2 Intake Detail and Status Management
- 3.3 Intake Assignment Actions
- 3.4 Convert Intake to Case

## Sprint 4
- 5.1 Parent Portal Shell and Dashboard
- 5.2 Parent Child List and Detail
- 5.3 Parent Resources and Contacts

## Sprint 5
- 6.1 Thread Creation and Messaging
- 6.2 Inbox and Unread Indicators
- 6.3 Case-Linked Communication Context

## Sprint 6
- 7.1 New Request Submission
- 7.2 Request Review Queue
- 7.3 Request Decisions
- 7.4 Request Comments and Documents

## Sprint 7
- 8.1 Resource Home Management
- 8.2 Placement Search
- 8.3 Placement Requests and Responses
- 8.4 Record Placement Outcome

## Sprint 8
- 9.1 Vendor Invite and Portal Access
- 9.2 Vendor Onboarding Checklist and Submissions
- 9.3 Vendor Review Queue and Decisioning
- 9.4 Parent-Facing Approved Vendor Directory
- 10.1 General File Upload Service
- 10.2 Document Linking and Visibility

## Sprint 9
- 11.1 Admin Dashboard Summary
- 11.2 Worker Dashboard Summary
- 12.1 Audit Logging for Sensitive Actions
- 12.2 Clear Authorization Errors

---

# 16. Final Recommendation

This ticket breakdown should be treated as the bridge between strategy and execution.

The next refinement steps would be:
- break each ticket into engineering tasks
- add explicit QA test cases
- estimate story points
- assign owners
- map tickets to designs/components/API work

The most important thing is to keep delivery tied to the MVP outcome:
**support real intake, placement, communication, requests, and vendor onboarding workflows in one coherent system.**
