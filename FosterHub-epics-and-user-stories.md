# FosterHub Epics and User Stories

## 1. Purpose

This document translates the FosterHub MVP into a product delivery structure made of:
- epics
- user stories
- acceptance-oriented thinking

The goal is to make the product easier to plan, estimate, and hand off to design and engineering.

This is focused primarily on the MVP and near-MVP core.

---

## 2. Story Format

Stories generally follow this format:

**As a [user], I want [goal], so that [outcome].**

Where useful, each story also includes light acceptance notes.

---

## 3. Core MVP User Types

The main user types represented here are:
- Administrator / DHR admin
- Manager / supervisor
- Worker / caseworker
- Placement finder
- Resource parent
- Vendor

Birth parent and child/youth stories are intentionally lighter here because they were positioned later in the roadmap.

---

# 4. Epic 1 — Authentication, Users, Roles, and Permissions

## Goal
Create the secure access foundation for FosterHub.

### User stories

### 1.1 User invitation
As an administrator, I want to invite a new user to FosterHub, so that they can access the system with the appropriate role.

**Acceptance notes:**
- admin can enter email and assign a starting role
- invited user receives an invite link
- invite has status tracking

### 1.2 Invite acceptance
As an invited user, I want to accept my invitation and create my account, so that I can log in securely.

**Acceptance notes:**
- user can set password
- expired/revoked invites are handled clearly

### 1.3 Login/logout
As a user, I want to log in and log out securely, so that I can access my portal safely.

### 1.4 Role assignment
As an administrator, I want to assign role templates to users, so that access can be controlled efficiently.

### 1.5 Permission template management
As an administrator, I want role templates with preconfigured permissions, so that I do not have to configure every user from scratch.

### 1.6 Individual permission overrides
As an administrator, I want to customize permissions for a specific user, so that I can handle exceptions without creating a whole new role.

### 1.7 Access-restricted navigation
As a user, I want to see only the navigation items relevant to my permissions, so that the app feels clear and safe.

### 1.8 Backend authorization enforcement
As the organization, I want permissions enforced on the backend, so that restricted data cannot be accessed simply by guessing URLs or requests.

---

# 5. Epic 2 — Case Core and Child Records

## Goal
Provide the operational foundation for child and case management.

### User stories

### 2.1 Create child record
As a DHR/admin user, I want to create a child record, so that the child can exist in the system before or during case creation.

### 2.2 Create case
As a DHR/admin user, I want to create a case linked to a child, so that work can be organized around an official case record.

### 2.3 View case list
As a worker, I want to see my assigned cases, so that I can quickly understand my workload.

### 2.4 View case detail
As a worker, I want to open a case detail page, so that I can see all key information about a child and case in one place.

### 2.5 Add case notes
As a worker, I want to add notes to a case, so that important information and updates are documented.

### 2.6 View case timeline
As a worker, I want to see a timeline of case activity, so that I can understand recent actions and changes.

### 2.7 Link case participants
As a DHR/admin or worker user, I want to link participants to a case, so that communication and permissions can be tied to the right people.

### 2.8 Reassign case staff
As a manager/admin, I want to change case assignments, so that work can be redistributed when needed.

---

# 6. Epic 3 — Intake Workflow

## Goal
Allow DHR to onboard new children/cases into the system.

### User stories

### 3.1 Create intake record
As a DHR/admin user, I want to create a new intake record, so that a child can enter the FosterHub workflow.

### 3.2 Complete intake details
As a DHR/admin user, I want to record intake details like urgency, county, and placement needs, so that downstream workflows have the information they need.

### 3.3 Assign worker during intake
As a DHR/admin user, I want to assign a worker during intake, so that accountability begins early.

### 3.4 Assign placement finder during intake
As a DHR/admin user, I want to assign a placement finder, so that placement work can begin quickly.

### 3.5 Track intake status
As a DHR/admin or manager, I want to see intake status clearly, so that I know what stage each child is in.

### 3.6 Convert intake to case
As a DHR/admin user, I want to convert an intake into an active case, so that intake work becomes operational casework.

### 3.7 Invite participant from intake/case
As a DHR/admin or worker user, I want to send participant invites, so that relevant adults can join the system where appropriate.

---

# 7. Epic 4 — Worker Portal and Daily Operations

## Goal
Give workers a usable day-to-day operational workspace.

### User stories

### 4.1 Worker dashboard
As a worker, I want a dashboard showing my tasks, appointments, messages, and open items, so that I can prioritize my day.

### 4.2 Case list filters
As a worker, I want to filter my cases, so that I can focus on what matters most right now.

### 4.3 Quick actions from dashboard
As a worker, I want to quickly open cases, send messages, add notes, and create appointments, so that I can move efficiently.

### 4.4 View assigned appointments
As a worker, I want to see my appointments in a calendar view, so that I can manage my schedule.

### 4.5 View open requests
As a worker, I want to see pending requests tied to my cases, so that nothing important gets missed.

### 4.6 See recent communication in context
As a worker, I want communication tied to cases/children where appropriate, so that I can stay oriented.

---

# 8. Epic 5 — Resource Parent Portal Basics

## Goal
Provide caregivers with a supportive and usable portal.

### User stories

### 5.1 Parent login
As a resource parent, I want to log in to my own portal, so that I can access information relevant to the children in my care.

### 5.2 Parent dashboard
As a resource parent, I want a dashboard with my children, requests, messages, and appointments, so that I can quickly understand what needs attention.

### 5.3 View children in placement
As a resource parent, I want to see children placed in my home, so that I can access the correct records and tools.

### 5.4 View approved child information
As a resource parent, I want to see the information I’m allowed to access about a child, so that I can care for them effectively.

### 5.5 View important contacts/resources
As a resource parent, I want quick access to worker contacts and emergency resources, so that help is easy to find.

### 5.6 View parent-facing documents
As a resource parent, I want access to relevant documents, so that I can keep important records in one place.

---

# 9. Epic 6 — Messaging and Communication

## Goal
Enable secure, in-platform communication between key participants.

### User stories

### 6.1 Send message to worker
As a resource parent, I want to message a worker inside the app, so that communication stays centralized.

### 6.2 Receive and reply to messages
As a worker, I want to receive and reply to messages in FosterHub, so that communication is documented and organized.

### 6.3 Inbox with unread states
As a user, I want an inbox with unread indicators, so that I can quickly find new communication.

### 6.4 Case-linked message context
As a worker, I want messages to be viewable in case context where appropriate, so that communication is easier to interpret.

### 6.5 Notification of new messages
As a user, I want to be notified when I receive a new message, so that I do not miss important communication.

### 6.6 Filter messages
As a worker, I want to filter my communications by participant type or case, so that my inbox remains manageable.

---

# 10. Epic 7 — Requests and Approvals

## Goal
Support structured requests and review workflows.

### User stories

### 7.1 Submit request
As a resource parent, I want to submit a request for support, approval, or service, so that I can ask for what is needed in a structured way.

### 7.2 Save draft request
As a resource parent, I want to save a draft request, so that I can finish it later if needed.

### 7.3 Track request status
As a resource parent, I want to track request status, so that I know whether it is pending, approved, denied, or needs more information.

### 7.4 Review request queue
As a worker or DHR reviewer, I want to see incoming requests in a queue, so that I can manage them efficiently.

### 7.5 Approve request
As an authorized reviewer, I want to approve a request, so that the workflow can move forward.

### 7.6 Deny request
As an authorized reviewer, I want to deny a request with a reason, so that the submitter understands the outcome.

### 7.7 Request more information
As an authorized reviewer, I want to request more information, so that incomplete requests can be resolved without starting over.

### 7.8 Attach supporting documents
As a user, I want to attach supporting documents to a request, so that the reviewer has the information needed.

### 7.9 View request history
As a worker or submitter, I want to see request decisions and comments, so that the request has a clear history.

---

# 11. Epic 8 — Placement Workflow

## Goal
Enable DHR to coordinate placements through FosterHub.

### User stories

### 8.1 Create resource home record
As a DHR/admin user, I want to manage resource home records, so that placement options are organized in the system.

### 8.2 Track capacity and availability
As a DHR/admin or placement user, I want to see resource home capacity and availability, so that only realistic homes are considered.

### 8.3 Start placement search
As a placement finder or worker, I want to start a placement search for a child, so that I can begin finding a suitable home.

### 8.4 Filter eligible homes
As a placement finder, I want to filter homes based on criteria like capacity, age range, and location, so that I can narrow the search.

### 8.5 Send placement requests
As a placement finder or authorized DHR user, I want to send placement requests to eligible homes, so that I can identify interested caregivers quickly.

### 8.6 Respond to placement request
As a resource parent, I want to respond to a placement request, so that DHR knows whether I’m interested or unavailable.

### 8.7 Review placement responses
As a placement finder, I want to review responses from homes, so that I can make a placement decision.

### 8.8 Record placement
As a DHR/admin or placement user, I want to record the selected placement, so that the child is linked to the correct home in the system.

---

# 12. Epic 9 — Vendor Onboarding Basics

## Goal
Support DHR-managed vendor onboarding and approval.

### User stories

### 9.1 Invite vendor
As a DHR/admin user, I want to invite a vendor to onboard, so that they can begin the approval process.

### 9.2 Vendor account setup
As a vendor, I want to create my account from an invite, so that I can access the vendor portal.

### 9.3 Complete onboarding checklist
As a vendor, I want to see required onboarding items, so that I know what documents and information are needed.

### 9.4 Upload vendor documents
As a vendor, I want to upload my compliance documents, so that DHR can review them.

### 9.5 Review vendor submission
As a DHR reviewer, I want to review vendor submissions, so that I can determine whether the vendor should be approved.

### 9.6 Approve or deny vendor
As a DHR reviewer, I want to approve or deny a vendor, so that the vendor lifecycle is tracked clearly.

### 9.7 Set vendor visibility
As a DHR reviewer/admin, I want to mark a vendor as public or private, so that parent visibility can be controlled.

### 9.8 View approved vendors
As a resource parent, I want to see approved public vendors, so that I can find approved services.

---

# 13. Epic 10 — Documents and File Handling

## Goal
Support the uploading and association of documents throughout the MVP.

### User stories

### 10.1 Upload document to case
As a worker, I want to upload a document to a case, so that important records are stored centrally.

### 10.2 Upload document to request
As a resource parent, I want to upload supporting documents to a request, so that my request can be reviewed properly.

### 10.3 Upload vendor compliance document
As a vendor, I want to upload compliance documents, so that my application can move forward.

### 10.4 Restrict document visibility
As the organization, I want documents to respect permission and visibility rules, so that sensitive information is protected.

### 10.5 Download authorized documents
As an authorized user, I want to download documents I’m allowed to access, so that I can use them when needed.

---

# 14. Epic 11 — Dashboards and Reporting Basics

## Goal
Provide enough visibility for workers and admins to operate effectively.

### User stories

### 11.1 Admin dashboard summary
As an admin/manager, I want a dashboard showing open intakes, placements, requests, and vendor reviews, so that I can monitor operations.

### 11.2 Worker dashboard summary
As a worker, I want a dashboard summarizing my cases, messages, requests, and appointments, so that I can manage my work efficiently.

### 11.3 Queue counts
As a user, I want to see counts of important work items, so that I can prioritize what to open.

### 11.4 Overdue indicators
As a manager or worker, I want overdue items highlighted, so that urgent or neglected work stands out.

---

# 15. Epic 12 — Auditability and Operational Safety

## Goal
Ensure sensitive workflows are traceable and controlled.

### User stories

### 12.1 Audit sensitive actions
As the organization, I want sensitive actions logged, so that the system is accountable.

### 12.2 Log permission changes
As an admin organization, I want permission changes recorded, so that access changes are traceable.

### 12.3 Log workflow decisions
As the organization, I want request approvals, vendor decisions, and placement decisions logged, so that important outcomes are reviewable later.

### 12.4 Surface access errors clearly
As a user, I want to receive clear feedback when I cannot access something, so that the system feels understandable rather than broken.

---

# 16. Suggested MVP Story Priority

If these stories must be prioritized more tightly, the rough order is:

## Priority 1 — must have
- auth/login
- invites
- role templates
- backend authorization
- create child/case
- view assigned cases
- worker dashboard basics
- create intake
- assign worker
- parent login
- parent dashboard basics
- send/receive messages
- submit request
- review request queue
- approve/deny request
- start placement search
- send placement request
- respond to placement request
- record placement

## Priority 2 — strong MVP
- user permission overrides
- case notes/timeline
- participant invites
- request comments/history
- vendor onboarding checklist
- vendor upload/review/approval
- public/private vendor visibility
- parent-facing vendor list

## Priority 3 — polish / support
- advanced inbox filtering
- dashboard metrics refinement
- richer document handling
- stronger admin management UX
- deeper audit views

---

# 17. Suggested Epic-to-Sprint Alignment

### Sprint 1
- Epic 1

### Sprint 2
- Epic 2

### Sprint 3
- Epic 3

### Sprint 4
- Epic 5

### Sprint 5
- Epic 6

### Sprint 6
- Epic 7

### Sprint 7
- Epic 8

### Sprint 8
- Epic 9 + parts of Epic 10

### Sprint 9
- Epic 11 + Epic 12

This is not exact, but it maps well to the MVP sprint plan.

---

# 18. Final Recommendation

These epics and user stories should be used as the starting backlog, then refined into:
- tickets
- acceptance criteria
- design tasks
- engineering subtasks
- QA test cases

The most important thing is to keep the stories tied to real operational outcomes rather than abstract feature building.

FosterHub becomes valuable when it helps real users:
- onboard a child
- assign work
- find placements
- communicate clearly
- submit/resolve requests
- onboard vendors

That should remain the center of the backlog.
