# FosterHub MVP Sprint Plan

## 1. Purpose

This document turns the FosterHub MVP into a practical sprint-based execution plan.

The goal is to answer:
- what should be built first
- how features depend on one another
- what each sprint should accomplish
- how to keep scope realistic while still producing a usable MVP

This plan assumes a product-first MVP focused on:
- DHR / admin users
- workers / caseworkers
- resource parents
- placement workflows
- requests
- messaging
- vendor onboarding basics

It does **not** assume every future module is part of the first release.

---

## 2. Planning Assumptions

### Sprint assumptions
- 2-week sprints
- small product/engineering team
- modular monolith architecture
- browser-first MVP
- mobile-responsive where practical, but not mobile-native first

### Team assumptions
This plan assumes at least some combination of:
- 1 product/design lead
- 1 frontend engineer
- 1 backend engineer
- 1 full-stack engineer or second frontend/backend contributor
- QA support (part-time or shared)

If the team is smaller, the sprint count may need to stretch.

---

## 3. MVP Outcome Definition

At the end of the MVP, FosterHub should support this full scenario:

1. DHR/admin creates a child intake
2. Intake is assigned to staff
3. Placement search is initiated
4. Placement requests are sent to eligible resource homes
5. Resource parent receives and responds
6. Placement is recorded
7. Worker manages the case in the system
8. Resource parent logs in to view child information and message worker
9. Resource parent submits a request
10. Worker or DHR reviews and resolves the request
11. DHR invites a vendor, reviews onboarding documents, and approves the vendor
12. Approved vendors become visible in the parent-facing directory

If the product can do that well, it is a meaningful MVP.

---

## 4. Sprint Structure Overview

Recommended MVP sprint sequence:

1. Sprint 0 — Foundations / setup
2. Sprint 1 — Auth, users, orgs, permissions foundation
3. Sprint 2 — Case core and internal navigation
4. Sprint 3 — Intake workflow
5. Sprint 4 — Resource parent portal basics
6. Sprint 5 — Messaging system basics
7. Sprint 6 — Requests and approvals
8. Sprint 7 — Placement workflow
9. Sprint 8 — Vendor onboarding basics
10. Sprint 9 — Dashboards, reporting basics, hardening
11. Sprint 10 — QA, polish, bug fixing, pilot readiness

This is a realistic starting sequence, not a rigid law.

---

# 5. Sprint-by-Sprint Plan

## Sprint 0 — Foundations / Setup

### Goals
Set up the codebase, infrastructure, design conventions, and delivery workflow.

### Product/design focus
- confirm MVP scope
- finalize portal priorities
- establish shared UI patterns
- define core user stories

### Engineering focus
- repo setup
- frontend app scaffold
- backend app scaffold
- database setup
- environment config
- CI/CD basics
- logging/error tracking setup

### Deliverables
- Next.js frontend initialized
- NestJS backend initialized
- Postgres + Redis connected
- object storage strategy decided
- basic deployment pipeline in place
- shared design system / component starter

### Exit criteria
- app boots in dev and staging
- basic CI checks run
- environments usable

---

## Sprint 1 — Auth, Users, Orgs, Permissions Foundation

### Goals
Build the identity and access backbone.

### Features
- user accounts
- organization record
- login/logout
- invite acceptance
- role templates
- permission definitions
- user-role assignments
- user permission overrides (basic)
- route guards / backend auth checks

### Frontend screens
- login screen
- invite acceptance screen
- basic user management list
- basic permissions/roles admin view

### Backend/API
- auth endpoints
- users endpoints
- roles/permissions endpoints
- permission evaluation service

### Data model/tables
- organizations
- users
- role_templates
- permissions
- role_template_permissions
- user_role_assignments
- user_permission_overrides

### Exit criteria
- admins can invite and activate users
- users can log in
- roles and permissions gate access to protected areas

---

## Sprint 2 — Case Core and Internal Navigation

### Goals
Give DHR/worker users a usable internal shell and case foundation.

### Features
- internal app shell/navigation
- child records
- case records
- case assignments
- case participants basics
- notes/timeline basics
- document metadata groundwork

### Frontend screens
- internal dashboard shell
- cases list
- case detail shell
- assignments section
- notes section

### Backend/API
- children endpoints
- cases endpoints
- assignments endpoints
- participants endpoints
- notes endpoints

### Data model/tables
- children
- cases
- case_assignments
- case_participants
- notes
- activity_events

### Exit criteria
- internal users can create and manage case records
- workers can see assigned cases
- basic case detail exists

---

## Sprint 3 — Intake Workflow

### Goals
Support creation and processing of child intakes.

### Features
- create intake record
- intake status management
- intake details form
- assign worker
- assign placement finder
- invite participant basics
- convert intake to case

### Frontend screens
- intake queue
- new intake form
- intake detail view
- assignment panel
- participant invite form

### Backend/API
- intake record endpoints
- intake detail endpoints
- intake action endpoints
- participant invite endpoints

### Data model/tables
- intake_records
- intake_details
- participant_invites

### Exit criteria
- DHR can create and manage intakes
- intakes can be assigned and converted into active case workflows

---

## Sprint 4 — Resource Parent Portal Basics

### Goals
Create a usable parent-facing portal connected to case/child information.

### Features
- parent portal shell/navigation
- dashboard basics
- children in home view
- child detail basics
- approved information visibility
- quick contacts/resources

### Frontend screens
- parent dashboard
- children list
- child detail page
- resources page
- documents placeholder/view

### Backend/API
- parent-specific dashboard endpoints
- child linked-to-parent query endpoints
- parent-facing case visibility filtering

### Data model focus
- leverage case_participants and placements for parent visibility

### Exit criteria
- a resource parent can log in and see permitted child/case-related information
- parent portal feels distinct from internal portal

---

## Sprint 5 — Messaging System Basics

### Goals
Enable secure in-platform communication for the MVP’s main participants.

### Features
- direct/case-linked message threads
- inbox view
- unread states
- case-linked communication history
- notifications basics
- worker ↔ resource parent messaging

### Frontend screens
- inbox
- thread view
- message composer
- case-linked messaging section

### Backend/API
- thread endpoints
- participant endpoints
- message endpoints
- unread count endpoints

### Data model/tables
- conversation_threads
- conversation_participants
- messages
- message_attachments (optional if time allows)

### Exit criteria
- workers and resource parents can exchange messages inside the system
- messages appear in relevant case context

---

## Sprint 6 — Requests and Approvals

### Goals
Add structured request workflows to reduce chaos and create accountability.

### Features
- create request
- request type selection
- request queue
- request detail
- request comments
- request status changes
- approve / deny / request more info
- supporting document attachment basics

### Frontend screens
- new request form
- request list / queue
- request detail view
- review actions panel

### Backend/API
- requests endpoints
- request comments endpoints
- request decisions endpoints
- request participant endpoints

### Data model/tables
- requests
- request_participants
- request_decisions
- request_comments
- document_links usage for request files

### Exit criteria
- resource parents can submit requests
- workers/DHR can review and act on them
- statuses are visible and traceable

---

## Sprint 7 — Placement Workflow

### Goals
Implement the core placement operations flow.

### Features
- resource home records
- capacity tracking
- availability tracking
- placement search
- match generation/filtering basics
- placement request creation
- sending placement requests
- foster parent response capture
- placement record creation

### Frontend screens
- placement dashboard
- resource homes list/detail
- placement search page
- placement request composer
- placement responses view

### Backend/API
- resource homes endpoints
- preferences endpoints
- placement search endpoints
- placement request endpoints
- response endpoint
- placements endpoints

### Data model/tables
- resource_homes
- resource_home_preferences
- placement_searches
- placement_matches
- placement_requests
- placement_request_recipients
- placements

### Exit criteria
- DHR can initiate placement search
- eligible homes can be contacted
- responses are captured
- a placement can be recorded

---

## Sprint 8 — Vendor Onboarding Basics

### Goals
Support the first version of DHR vendor onboarding and approval.

### Features
- create/invite vendor
- vendor portal basics
- onboarding checklist
- vendor document upload
- review queue
- approve/deny vendor
- public/private visibility
- approved vendor directory for parents

### Frontend screens
- vendor queue
- vendor detail/review screen
- vendor portal dashboard
- vendor onboarding page
- vendor documents page
- parent vendor directory

### Backend/API
- vendor endpoints
- vendor application endpoints
- vendor submission endpoints
- vendor requirement endpoints

### Data model/tables
- vendors
- vendor_contacts
- vendor_applications
- vendor_requirements
- vendor_submissions

### Exit criteria
- DHR can onboard a vendor
- vendor can submit required information
- DHR can approve and publish vendor visibility
- parents can see approved public vendors

---

## Sprint 9 — Dashboards, Reporting Basics, Hardening

### Goals
Improve usability, visibility, and operational readiness.

### Features
- admin dashboard metrics basics
- worker dashboard summaries
- queue counts
- overdue indicators
- activity feed improvements
- document upload/download hardening
- audit log coverage for sensitive actions
- performance tuning / bug cleanup

### Frontend screens
- improved dashboards
- counts/widgets
- audit/admin visibility where needed

### Backend/API
- dashboard endpoints
- report summary endpoints
- audit log endpoints

### Data model/tables
- audit_logs
- metric snapshots if needed

### Exit criteria
- dashboards are operationally useful
- audit trail exists for sensitive actions
- system feels stable enough for pilot use

---

## Sprint 10 — QA, Pilot Readiness, Polish

### Goals
Prepare the MVP for real-world pilot use.

### Focus areas
- bug fixing
- workflow QA
- permission testing
- performance checks
- UX cleanup
- seed/demo data
- onboarding/admin documentation
- deployment hardening

### Deliverables
- pilot-ready staging/prod plan
- issue backlog triaged
- known limitations documented
- admin setup checklist

### Exit criteria
- key MVP workflow passes end-to-end testing
- internal team can demo and onboard pilot users

---

# 6. Cross-Sprint Workstreams

These should run in parallel where possible.

## 6.1 Design / UX workstream
Should stay 1–2 sprints ahead of engineering on:
- wireframes
- flows
- forms
- role-specific UX
- permission edge cases

## 6.2 Product / requirements workstream
Should continue refining:
- acceptance criteria
- edge cases
- permission rules
- field definitions
- statuses

## 6.3 QA workstream
Should build test coverage across:
- permissions
- workflow transitions
- portal visibility
- request logic
- placement workflow
- vendor approval flow

---

# 7. MVP Backlog Priority Order

If something needs to slip, protect these first:

## Highest priority
1. auth / roles / permissions
2. case core
3. intake
4. parent portal basics
5. messaging basics
6. requests
7. placement workflow

## Medium priority
8. vendor onboarding basics
9. dashboards/reporting basics

## Lower priority for initial release
10. polished reporting
11. advanced admin UX
12. advanced vendor experience
13. richer document workflows

---

# 8. Risks and Scope Traps

## 8.1 Biggest risk: trying to build too many portals fully
For MVP, avoid fully building:
- birth parent portal
- child/youth portal
- outreach hub
- recruiting engine
- invoice/payment system
- social media tools

These can wait.

## 8.2 Biggest technical risk: permissions complexity
Mitigation:
- start with strong templates
- implement user overrides later/basic first
- enforce authorization in backend from day one

## 8.3 Biggest workflow risk: placement complexity
Mitigation:
- keep matching basic at first
- use filters before advanced scoring
- focus on request/response workflow, not AI-style ranking

## 8.4 Biggest UX risk: internal and external portals feeling too similar
Mitigation:
- keep worker screens data-dense
- keep parent screens simpler and task-oriented

---

# 9. Suggested Milestone Checkpoints

## After Sprint 2
- internal app shell exists
- auth/permissions work
- case records exist

## After Sprint 4
- intake works
- parent portal basics work

## After Sprint 6
- messaging and requests work end to end

## After Sprint 8
- placement and vendor onboarding both work at a basic level

## After Sprint 10
- MVP is pilot-ready

---

# 10. What “Done” Looks Like for MVP

FosterHub MVP is done when:
- staff can create and manage intakes/cases
- placements can be coordinated through the system
- workers can communicate and manage case workflows
- resource parents can log in, view permitted information, and make requests
- requests can be reviewed and resolved
- vendors can be onboarded and approved
- the system is permission-aware and auditable enough for pilot use

If those capabilities are strong, the MVP is real — even without all the later-phase modules.

---

# 11. Final Recommendation

The best path is to build FosterHub as a sequence of connected operational wins, not one giant all-at-once platform.

### MVP sprints should emphasize:
- foundation first
- worker value second
- parent connectivity third
- operational workflows fourth
- vendor/reporting fifth

That ordering gives the product the best chance to become usable, demoable, and adoptable without drowning in scope.
