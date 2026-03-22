# FosterHub Jira-Ready Issue Format

## 1. Purpose

This document converts the FosterHub MVP planning work into a Jira-friendly issue structure.

The goal is to provide:
- a clean hierarchy
- Epic → Story → Task structure
- issue summaries that can be copied into Jira
- suggested fields/tags for tracking
- an import-friendly layout reference

This is not a final CSV export, but it is structured so it can be turned into one easily.

---

## 2. Recommended Jira Hierarchy

### Recommended structure
- **Epic** = major product capability area
- **Story** = user-centered feature or workflow outcome
- **Task** = implementation/design/QA work item
- **Bug** = defects found during implementation/testing

### Optional additional layer
If your Jira setup supports it:
- **Initiative** = FosterHub MVP

---

## 3. Recommended Jira Fields

For each issue, consider using:
- **Issue Type**
- **Summary**
- **Description**
- **Epic Link**
- **Priority**
- **Labels**
- **Sprint**
- **Assignee**
- **Components**
- **Story Points**
- **Acceptance Criteria**

### Suggested labels
- `mvp`
- `auth`
- `permissions`
- `cases`
- `intake`
- `worker-portal`
- `parent-portal`
- `messaging`
- `requests`
- `placement`
- `vendors`
- `documents`
- `reporting`
- `audit`
- `backend`
- `frontend`
- `qa`
- `design`

---

## 4. Suggested Epics

## Epic FH-EPIC-1
### Summary
Authentication, Users, Roles, and Permissions

### Description
Build the identity and access foundation for FosterHub including invites, login, role templates, permission evaluation, and user-specific permission overrides.

### Labels
`mvp`, `auth`, `permissions`

---

## Epic FH-EPIC-2
### Summary
Case Core and Child Records

### Description
Build the foundational child/case model, case assignments, participants, notes, and case visibility rules.

### Labels
`mvp`, `cases`

---

## Epic FH-EPIC-3
### Summary
Intake Workflow

### Description
Build the intake record workflow including creation, detail management, assignment, status tracking, and conversion to case.

### Labels
`mvp`, `intake`

---

## Epic FH-EPIC-4
### Summary
Worker Portal

### Description
Build the worker-facing dashboard, case list, schedule visibility, and operational workflow entry points.

### Labels
`mvp`, `worker-portal`

---

## Epic FH-EPIC-5
### Summary
Resource Parent Portal

### Description
Build the caregiver-facing portal including dashboard, child detail visibility, and key contacts/resources.

### Labels
`mvp`, `parent-portal`

---

## Epic FH-EPIC-6
### Summary
Messaging and Communication

### Description
Build secure in-platform messaging with threads, inbox views, unread indicators, and case-linked context.

### Labels
`mvp`, `messaging`

---

## Epic FH-EPIC-7
### Summary
Requests and Approvals

### Description
Build the structured request workflow including submission, review, comments, attachments, and decisioning.

### Labels
`mvp`, `requests`

---

## Epic FH-EPIC-8
### Summary
Placement Workflow

### Description
Build the placement process including resource homes, placement search, placement requests, responses, and recorded placements.

### Labels
`mvp`, `placement`

---

## Epic FH-EPIC-9
### Summary
Vendor Onboarding Basics

### Description
Build vendor invites, onboarding checklist, submissions, review queue, approval decisions, and parent-facing approved vendor visibility.

### Labels
`mvp`, `vendors`

---

## Epic FH-EPIC-10
### Summary
Documents and File Handling

### Description
Build reusable file upload, secure storage, document linking, and document visibility enforcement across the MVP.

### Labels
`mvp`, `documents`

---

## Epic FH-EPIC-11
### Summary
Dashboards and Reporting Basics

### Description
Build the first operational dashboard summaries and queue counts for admins and workers.

### Labels
`mvp`, `reporting`

---

## Epic FH-EPIC-12
### Summary
Auditability and Safety

### Description
Build audit logging and consistent authorization error behavior for sensitive workflows.

### Labels
`mvp`, `audit`, `permissions`

---

# 5. Story and Task Breakdown by Epic

# EPIC 1 — Authentication, Users, Roles, and Permissions

## Story FH-101
### Summary
Invite a new user into FosterHub

### Description
As an administrator, I want to invite a new user with a starting role, so that they can securely access the system.

### Acceptance Criteria
- Admin can create invite with email and role.
- Invite is tracked with status.
- Invite link can be accepted once.
- Expired/revoked invites fail safely.

### Labels
`mvp`, `auth`, `permissions`

### Suggested Tasks
- FH-101A Backend: create invitation token flow
- FH-101B Backend: invite create/list endpoints
- FH-101C Frontend: invite management UI
- FH-101D Frontend: invite acceptance screen
- FH-101E QA: invite flow test coverage

---

## Story FH-102
### Summary
Log in and out securely

### Description
As a user, I want to log in and out securely, so that I can access FosterHub safely.

### Acceptance Criteria
- Valid login works.
- Invalid login returns safe error.
- Logout invalidates active session.
- Protected routes block anonymous access.

### Suggested Tasks
- FH-102A Backend: auth endpoints
- FH-102B Backend: password hashing/session logic
- FH-102C Frontend: login UI
- FH-102D Frontend: route guards
- FH-102E QA: auth regression suite

---

## Story FH-103
### Summary
Manage role templates and permissions

### Description
As an administrator, I want reusable role templates with permission sets, so that I can manage access efficiently.

### Acceptance Criteria
- Admin can create/edit role templates.
- Role templates can be linked to permissions.
- Role templates can be assigned to users.

### Suggested Tasks
- FH-103A Backend: role template CRUD
- FH-103B Backend: permission mapping service
- FH-103C Frontend: role template screen
- FH-103D QA: role template coverage

---

## Story FH-104
### Summary
Apply per-user permission overrides

### Description
As an administrator, I want to override a user’s permissions individually, so that exceptions can be handled without new roles.

### Acceptance Criteria
- Admin can add/remove overrides.
- Effective permissions reflect role + override.
- Backend authorization respects effective permissions.

### Suggested Tasks
- FH-104A Backend: override model/endpoints
- FH-104B Backend: effective-permission resolver
- FH-104C Frontend: user override UI
- FH-104D QA: override behavior tests

---

# EPIC 2 — Case Core and Child Records

## Story FH-201
### Summary
Create and manage child records

### Description
As an authorized internal user, I want to create and edit child records, so that children can be represented properly in the system.

### Suggested Tasks
- FH-201A Backend: children schema + CRUD
- FH-201B Frontend: child create/edit form
- FH-201C QA: child record validation tests

---

## Story FH-202
### Summary
Create and manage case records

### Description
As an authorized internal user, I want to create and view case records linked to children, so that casework can be organized centrally.

### Suggested Tasks
- FH-202A Backend: cases schema + CRUD
- FH-202B Frontend: cases list UI
- FH-202C Frontend: case detail shell
- FH-202D QA: case creation and visibility tests

---

## Story FH-203
### Summary
Assign workers and staff to cases

### Description
As a manager/admin, I want to assign internal users to cases, so that accountability is clear.

### Suggested Tasks
- FH-203A Backend: case assignments schema/endpoints
- FH-203B Frontend: assignment panel
- FH-203C QA: assignment visibility tests

---

## Story FH-204
### Summary
Add notes and timeline activity to cases

### Description
As a worker, I want to record notes and see case activity history, so that case information is documented over time.

### Suggested Tasks
- FH-204A Backend: notes schema/endpoints
- FH-204B Backend: activity event logging
- FH-204C Frontend: notes/timeline UI
- FH-204D QA: visibility scope tests for notes

---

# EPIC 3 — Intake Workflow

## Story FH-301
### Summary
Create intake records

### Suggested Tasks
- FH-301A Backend: intake schema + CRUD
- FH-301B Frontend: intake queue UI
- FH-301C Frontend: intake creation form
- FH-301D QA: create intake tests

---

## Story FH-302
### Summary
Manage intake details and status

### Suggested Tasks
- FH-302A Backend: intake detail schema/endpoints
- FH-302B Backend: status transition rules
- FH-302C Frontend: intake detail screen
- FH-302D QA: intake status transition tests

---

## Story FH-303
### Summary
Assign worker and placement finder during intake

### Suggested Tasks
- FH-303A Backend: intake assignment actions
- FH-303B Frontend: assignee selectors
- FH-303C QA: assignment workflow tests

---

## Story FH-304
### Summary
Convert intake to active case

### Suggested Tasks
- FH-304A Backend: conversion service
- FH-304B Frontend: convert action UI
- FH-304C QA: duplicate conversion prevention tests

---

# EPIC 4 — Worker Portal

## Story FH-401
### Summary
View worker dashboard summary

### Suggested Tasks
- FH-401A Backend: worker dashboard endpoint
- FH-401B Frontend: worker dashboard layout
- FH-401C QA: dashboard summary tests

---

## Story FH-402
### Summary
View assigned case list

### Suggested Tasks
- FH-402A Backend: assigned case query
- FH-402B Frontend: case list table/filtering
- FH-402C QA: assigned-case-only visibility tests

---

## Story FH-403
### Summary
View worker calendar

### Suggested Tasks
- FH-403A Backend: appointments query endpoints
- FH-403B Frontend: calendar view
- FH-403C QA: appointment display tests

---

# EPIC 5 — Resource Parent Portal

## Story FH-501
### Summary
Access parent portal dashboard

### Suggested Tasks
- FH-501A Frontend: parent portal shell
- FH-501B Backend: parent dashboard endpoint
- FH-501C QA: parent dashboard visibility tests

---

## Story FH-502
### Summary
View child details for children in placement

### Suggested Tasks
- FH-502A Backend: parent child visibility query
- FH-502B Frontend: child detail page
- FH-502C QA: approved-info-only visibility tests

---

## Story FH-503
### Summary
Access parent support resources and contacts

### Suggested Tasks
- FH-503A Frontend: resources page
- FH-503B Config/content: support contact source
- FH-503C QA: parent resources accessibility tests

---

# EPIC 6 — Messaging and Communication

## Story FH-601
### Summary
Send and receive messages in threads

### Suggested Tasks
- FH-601A Backend: thread/message schemas/endpoints
- FH-601B Frontend: thread view + composer
- FH-601C QA: send/receive message flow tests

---

## Story FH-602
### Summary
View inbox and unread indicators

### Suggested Tasks
- FH-602A Backend: inbox query/unread count endpoints
- FH-602B Frontend: inbox list UI
- FH-602C QA: unread state tests

---

## Story FH-603
### Summary
See communication in case context

### Suggested Tasks
- FH-603A Backend: case-thread linking logic
- FH-603B Frontend: case-linked communication section
- FH-603C QA: case context messaging tests

---

# EPIC 7 — Requests and Approvals

## Story FH-701
### Summary
Create and submit requests

### Suggested Tasks
- FH-701A Backend: request schema/create/submit endpoints
- FH-701B Frontend: request form UI
- FH-701C QA: request draft/submit tests

---

## Story FH-702
### Summary
Review requests in queue

### Suggested Tasks
- FH-702A Backend: request queue endpoint/filtering
- FH-702B Frontend: request queue UI
- FH-702C QA: request queue visibility tests

---

## Story FH-703
### Summary
Approve, deny, or request more information on requests

### Suggested Tasks
- FH-703A Backend: request decision endpoints
- FH-703B Frontend: review action panel
- FH-703C QA: request decision state tests

---

## Story FH-704
### Summary
Attach comments and documents to requests

### Suggested Tasks
- FH-704A Backend: request comments/doc links endpoints
- FH-704B Frontend: comments + attachments UI
- FH-704C QA: attachment visibility tests

---

# EPIC 8 — Placement Workflow

## Story FH-801
### Summary
Manage resource home records

### Suggested Tasks
- FH-801A Backend: resource home schema/endpoints
- FH-801B Frontend: resource home management UI
- FH-801C QA: capacity/availability tests

---

## Story FH-802
### Summary
Create and manage placement searches

### Suggested Tasks
- FH-802A Backend: placement search schema/endpoints
- FH-802B Frontend: placement search screen
- FH-802C QA: search criteria/status tests

---

## Story FH-803
### Summary
Send placement requests and capture responses

### Suggested Tasks
- FH-803A Backend: placement request/recipient endpoints
- FH-803B Frontend: placement request composer
- FH-803C Frontend: parent response UI
- FH-803D QA: placement response flow tests

---

## Story FH-804
### Summary
Record placement outcomes

### Suggested Tasks
- FH-804A Backend: placements schema/endpoints
- FH-804B Frontend: placement record action UI
- FH-804C QA: placement outcome + access update tests

---

# EPIC 9 — Vendor Onboarding Basics

## Story FH-901
### Summary
Invite vendors and allow vendor login

### Suggested Tasks
- FH-901A Backend: vendor invite/account flow
- FH-901B Frontend: vendor invite/onboarding entry UI
- FH-901C QA: vendor invite acceptance tests

---

## Story FH-902
### Summary
Support vendor onboarding checklist and submissions

### Suggested Tasks
- FH-902A Backend: vendor requirements/submissions endpoints
- FH-902B Frontend: onboarding checklist UI
- FH-902C QA: vendor checklist progress tests

---

## Story FH-903
### Summary
Review and decide on vendor applications

### Suggested Tasks
- FH-903A Backend: vendor review/decision endpoints
- FH-903B Frontend: vendor review queue/detail UI
- FH-903C QA: approve/deny/visibility tests

---

## Story FH-904
### Summary
Show approved public vendors to resource parents

### Suggested Tasks
- FH-904A Backend: parent vendor directory endpoint
- FH-904B Frontend: parent vendor directory UI
- FH-904C QA: public/private vendor visibility tests

---

# EPIC 10 — Documents and File Handling

## Story FH-1001
### Summary
Upload documents securely

### Suggested Tasks
- FH-1001A Backend: object storage integration
- FH-1001B Backend: upload endpoint
- FH-1001C Frontend: reusable upload component
- FH-1001D QA: upload file validation tests

---

## Story FH-1002
### Summary
Link documents to cases, requests, and vendor submissions

### Suggested Tasks
- FH-1002A Backend: document_links service
- FH-1002B Frontend: linked documents display
- FH-1002C QA: document access restriction tests

---

# EPIC 11 — Dashboards and Reporting Basics

## Story FH-1101
### Summary
View admin dashboard summary

### Suggested Tasks
- FH-1101A Backend: admin dashboard queries
- FH-1101B Frontend: admin dashboard cards
- FH-1101C QA: dashboard count verification

---

## Story FH-1102
### Summary
View worker dashboard summary

### Suggested Tasks
- FH-1102A Backend: worker dashboard queries
- FH-1102B Frontend: worker dashboard cards
- FH-1102C QA: worker summary scope tests

---

# EPIC 12 — Auditability and Safety

## Story FH-1201
### Summary
Log sensitive actions in audit trail

### Suggested Tasks
- FH-1201A Backend: audit log schema/service
- FH-1201B Backend: hook logs into permission/request/vendor/placement actions
- FH-1201C Frontend/Admin: basic audit viewer
- FH-1201D QA: audit log creation tests

---

## Story FH-1202
### Summary
Return clear authorization errors

### Suggested Tasks
- FH-1202A Backend: standardized forbidden/unauthorized errors
- FH-1202B Frontend: error display behavior
- FH-1202C QA: authorization error handling tests

---

# 6. Suggested Sprint Mapping

## Sprint 1
- FH-101
- FH-102
- FH-103
- FH-104

## Sprint 2
- FH-201
- FH-202
- FH-203
- FH-204

## Sprint 3
- FH-301
- FH-302
- FH-303
- FH-304

## Sprint 4
- FH-501
- FH-502
- FH-503

## Sprint 5
- FH-601
- FH-602
- FH-603
- plus worker UI polish from FH-401/FH-402

## Sprint 6
- FH-701
- FH-702
- FH-703
- FH-704

## Sprint 7
- FH-801
- FH-802
- FH-803
- FH-804

## Sprint 8
- FH-901
- FH-902
- FH-903
- FH-904
- FH-1001
- FH-1002

## Sprint 9
- FH-1101
- FH-1102
- FH-1201
- FH-1202

---

# 7. Import-Friendly Tabular Reference

Below is a simplified row format that could be turned into CSV.

| Issue Type | Key | Summary | Epic Link | Labels | Sprint |
|---|---|---|---|---|---|
| Epic | FH-EPIC-1 | Authentication, Users, Roles, and Permissions |  | mvp,auth,permissions |  |
| Epic | FH-EPIC-2 | Case Core and Child Records |  | mvp,cases |  |
| Epic | FH-EPIC-3 | Intake Workflow |  | mvp,intake |  |
| Epic | FH-EPIC-4 | Worker Portal |  | mvp,worker-portal |  |
| Epic | FH-EPIC-5 | Resource Parent Portal |  | mvp,parent-portal |  |
| Epic | FH-EPIC-6 | Messaging and Communication |  | mvp,messaging |  |
| Epic | FH-EPIC-7 | Requests and Approvals |  | mvp,requests |  |
| Epic | FH-EPIC-8 | Placement Workflow |  | mvp,placement |  |
| Epic | FH-EPIC-9 | Vendor Onboarding Basics |  | mvp,vendors |  |
| Epic | FH-EPIC-10 | Documents and File Handling |  | mvp,documents |  |
| Epic | FH-EPIC-11 | Dashboards and Reporting Basics |  | mvp,reporting |  |
| Epic | FH-EPIC-12 | Auditability and Safety |  | mvp,audit |  |
| Story | FH-101 | Invite a new user into FosterHub | FH-EPIC-1 | mvp,auth,permissions | Sprint 1 |
| Story | FH-102 | Log in and out securely | FH-EPIC-1 | mvp,auth | Sprint 1 |
| Story | FH-103 | Manage role templates and permissions | FH-EPIC-1 | mvp,permissions | Sprint 1 |
| Story | FH-104 | Apply per-user permission overrides | FH-EPIC-1 | mvp,permissions | Sprint 1 |
| Story | FH-201 | Create and manage child records | FH-EPIC-2 | mvp,cases | Sprint 2 |
| Story | FH-202 | Create and manage case records | FH-EPIC-2 | mvp,cases | Sprint 2 |
| Story | FH-203 | Assign workers and staff to cases | FH-EPIC-2 | mvp,cases | Sprint 2 |
| Story | FH-204 | Add notes and timeline activity to cases | FH-EPIC-2 | mvp,cases | Sprint 2 |
| Story | FH-301 | Create intake records | FH-EPIC-3 | mvp,intake | Sprint 3 |
| Story | FH-302 | Manage intake details and status | FH-EPIC-3 | mvp,intake | Sprint 3 |
| Story | FH-303 | Assign worker and placement finder during intake | FH-EPIC-3 | mvp,intake | Sprint 3 |
| Story | FH-304 | Convert intake to active case | FH-EPIC-3 | mvp,intake | Sprint 3 |
| Story | FH-501 | Access parent portal dashboard | FH-EPIC-5 | mvp,parent-portal | Sprint 4 |
| Story | FH-502 | View child details for children in placement | FH-EPIC-5 | mvp,parent-portal | Sprint 4 |
| Story | FH-503 | Access parent support resources and contacts | FH-EPIC-5 | mvp,parent-portal | Sprint 4 |
| Story | FH-601 | Send and receive messages in threads | FH-EPIC-6 | mvp,messaging | Sprint 5 |
| Story | FH-602 | View inbox and unread indicators | FH-EPIC-6 | mvp,messaging | Sprint 5 |
| Story | FH-603 | See communication in case context | FH-EPIC-6 | mvp,messaging | Sprint 5 |
| Story | FH-701 | Create and submit requests | FH-EPIC-7 | mvp,requests | Sprint 6 |
| Story | FH-702 | Review requests in queue | FH-EPIC-7 | mvp,requests | Sprint 6 |
| Story | FH-703 | Approve, deny, or request more information on requests | FH-EPIC-7 | mvp,requests | Sprint 6 |
| Story | FH-704 | Attach comments and documents to requests | FH-EPIC-7 | mvp,requests | Sprint 6 |
| Story | FH-801 | Manage resource home records | FH-EPIC-8 | mvp,placement | Sprint 7 |
| Story | FH-802 | Create and manage placement searches | FH-EPIC-8 | mvp,placement | Sprint 7 |
| Story | FH-803 | Send placement requests and capture responses | FH-EPIC-8 | mvp,placement | Sprint 7 |
| Story | FH-804 | Record placement outcomes | FH-EPIC-8 | mvp,placement | Sprint 7 |
| Story | FH-901 | Invite vendors and allow vendor login | FH-EPIC-9 | mvp,vendors | Sprint 8 |
| Story | FH-902 | Support vendor onboarding checklist and submissions | FH-EPIC-9 | mvp,vendors | Sprint 8 |
| Story | FH-903 | Review and decide on vendor applications | FH-EPIC-9 | mvp,vendors | Sprint 8 |
| Story | FH-904 | Show approved public vendors to resource parents | FH-EPIC-9 | mvp,vendors | Sprint 8 |
| Story | FH-1001 | Upload documents securely | FH-EPIC-10 | mvp,documents | Sprint 8 |
| Story | FH-1002 | Link documents to cases, requests, and vendor submissions | FH-EPIC-10 | mvp,documents | Sprint 8 |
| Story | FH-1101 | View admin dashboard summary | FH-EPIC-11 | mvp,reporting | Sprint 9 |
| Story | FH-1102 | View worker dashboard summary | FH-EPIC-11 | mvp,reporting | Sprint 9 |
| Story | FH-1201 | Log sensitive actions in audit trail | FH-EPIC-12 | mvp,audit | Sprint 9 |
| Story | FH-1202 | Return clear authorization errors | FH-EPIC-12 | mvp,audit,permissions | Sprint 9 |

---

# 8. Final Recommendation

If you want to operationalize this in Jira quickly:
1. create the 12 epics first
2. import or create the story rows next
3. add task subtasks under each story
4. apply sprint and label structure
5. attach the acceptance criteria from the acceptance-criteria document

This structure is clean enough to use manually and close enough to import-ready that it can be converted into CSV with minimal cleanup.
