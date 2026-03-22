# FosterHub MVP vs Phase 2 Roadmap

## 1. Purpose

This document breaks FosterHub into staged delivery priorities.

The goal is to identify:
- what should exist in the MVP
- what should wait for Phase 2
- what belongs in later phases
- which features are foundational vs optional

This roadmap is based on product value, workflow importance, implementation complexity, and dependency order.

---

## 2. Product Strategy

FosterHub has the potential to become a broad operational platform, but trying to build everything at once would create too much risk.

The right approach is:
1. build the operational core first
2. validate the highest-friction workflows
3. expand into broader ecosystem tools later

### What matters most first
The most important early value appears to be:
- getting children/cases into the system
- assigning staff and managing cases
- finding placements more efficiently
- enabling communication inside the platform
- allowing resource parents to interact through structured workflows
- managing service requests and approvals
- beginning vendor onboarding in a usable way

That suggests FosterHub should begin as a **DHR + worker + resource parent operations platform**, then expand.

---

## 3. Guiding Prioritization Rules

### Put in MVP if it is:
- essential to the core operational value
- required to connect the main user groups
- necessary for secure/basic functioning
- used frequently by workers or DHR
- a dependency for later features

### Move to Phase 2 if it is:
- valuable but not necessary for initial launch
- dependent on stable core workflows
- operationally helpful but not foundational
- more complex than needed for first validation

### Move to Later if it is:
- high complexity with lower near-term value
- better after real user feedback
- an optimization layer rather than a foundation
- a specialized expansion area

---

## 4. Recommended MVP Scope

## 4.1 Core platform foundation
These are non-negotiable.

### MVP
- authentication and login
- user account management basics
- role templates
- permission engine basics
- case-based access rules
- organization settings basics
- audit/event logging basics

### Why this matters
Without a usable permissions foundation, the rest of the product becomes risky and inconsistent.

---

## 4.2 DHR Intake and Assignment

### MVP
- create new child/case record
- intake form basics
- assign case worker
- assign placement finder / team roles
- invite key participants at a basic level
- track intake status

### Why this matters
This is the system entry point for child/case workflows.

---

## 4.3 Placement Matching and Placement Requests

### MVP
- resource home directory / availability tracking
- household capacity tracking
- basic placement matching filters
- placement request creation
- send placement requests to eligible foster/resource homes
- foster parent response capture
- placement decision tracking

### Why this matters
This is one of the strongest and most differentiated operational features in the concept.

---

## 4.4 Case Management

### MVP
- assigned case list
- child/case detail page
- contacts
- document storage basics
- notes/timeline basics
- appointments/schedule basics
- participant linking

### Why this matters
Caseworkers need a real home base from day one.

---

## 4.5 Worker Portal

### MVP
- worker dashboard
- my cases
- my messages
- my requests
- calendar view
- task / open-item snapshot

### Why this matters
Workers are one of the highest-frequency users in the system.

---

## 4.6 Resource Parent Portal

### MVP
- parent login
- dashboard
- children in home view
- approved child info access
- messages with worker
- request submission
- request tracking
- approved vendor directory view
- key resources / contacts

### Why this matters
The resource parent portal is critical to making FosterHub a connected ecosystem instead of an internal-only tool.

---

## 4.7 Messaging and Communication

### MVP
- secure in-app/browser messaging
- worker ↔ resource parent messaging
- worker ↔ birth parent messaging if enabled
- worker ↔ child messaging if enabled
- message threads
- message notifications
- communication history on case

### Why this matters
Communication is central to the product vision and can reduce fragmented off-platform communication.

---

## 4.8 Service Requests and Approvals

### MVP
- submit request
- request detail
- request status tracking
- review queue
- approve / deny / request more info
- upload supporting documents

### Why this matters
Structured requests are a major operational benefit and help organize communication.

---

## 4.9 Vendor Management Basics

### MVP
- vendor record creation
- DHR-initiated vendor invite
- vendor onboarding application basics
- document upload for vendor compliance
- vendor review queue
- approve / deny vendor
- public/private vendor toggle
- approved vendor directory for parents

### Why this matters
Vendor onboarding is important, but the first version can be narrower than the full future marketplace concept.

---

## 4.10 Reporting Basics

### MVP
- worker dashboard metrics basics
- placement activity snapshot
- request queue counts
- vendor approval counts
- overdue / pending item indicators

### Why this matters
Managers and workers need enough visibility to operate, even if full analytics come later.

---

## 5. Recommended Phase 2 Scope

Phase 2 should deepen and refine the system once MVP workflows are working.

## 5.1 Expanded permissions and admin controls
### Phase 2
- more granular permission groupings
- individual user permission overrides
- permission bundles/templates
- admin UI similar to HubSpot-style permission management
- advanced audit views

### Why Phase 2
A basic permission engine is needed in MVP, but sophisticated admin tooling can follow.

---

## 5.2 Enhanced intake and participant workflows
### Phase 2
- richer intake forms
- dynamic intake rules
- easier invitation flows for bio parents / GALs / attorneys
- participant relationship mapping
- onboarding status visibility

---

## 5.3 Expanded placement workflows
### Phase 2
- smarter placement matching
- saved searches
- match scoring / fit indicators
- placement history analytics
- more advanced placement request targeting
- placement response ranking / shortlist tools

---

## 5.4 Expanded resource parent experience
### Phase 2
- richer child records access
n- document workflows
- household profile enhancements
- reimbursement workflows
- stronger vendor/service interactions
- more guided support center content

---

## 5.5 Birth Parent Portal
### Phase 2
- dedicated birth parent portal experience
- visitation schedule workflows
- document upload/status tracking
- limited child profile visibility
- resource library

### Why Phase 2
This is important, but can follow once the internal staff + resource parent foundation is stable.

---

## 5.6 Child / Youth Portal
### Phase 2
- dedicated youth login
- youth messaging
- request submission
- simplified schedule/resources access

### Why Phase 2
Potentially valuable, but should follow once permissions, safety rules, and staff workflows are proven.

---

## 5.7 Vendor Management Expansion
### Phase 2
- foster parent vendor recommendation workflow
- vendor self-registration
- duplicate detection
- document resubmission loops
- vendor statuses with conditions/suspensions
- richer vendor profiles

### Why Phase 2
The MVP should prove the core vendor onboarding flow before expanding to more intake paths and complexity.

---

## 5.8 Vendor Marketplace / Service Listings
### Phase 2
- vendor offerings / line items
- parent-facing marketplace browsing
- request service from vendor
- activity/camp request workflows
- vendor linked approval paths

### Why Phase 2
This is a strong idea, but adds a lot of workflow and data complexity.

---

## 5.9 Financial / Invoice Expansion
### Phase 2
- vendor invoice submission
- invoice verification workflows
- payment approval tracking
- reimbursement expansion
- financial reporting

### Why Phase 2
This is useful, but likely not the first thing to prove.

---

## 5.10 Broadcast Messaging
### Phase 2
- emergency mass texting
- placement broadcast management dashboards
- audience targeting tools
- response analytics
- message templates for operational broadcasts

### Why Phase 2
Broadcast messaging is powerful, but the foundational communication system should come first unless emergency texting is a top launch requirement.

---

## 5.11 Reporting Expansion
### Phase 2
- manager dashboards
- team performance reports
- vendor pipeline reports
- placement funnel reports
- request cycle-time reporting
- role-based reporting views

---

## 6. Later-Phase / Phase 3+ Scope

These features may become highly valuable, but should likely follow real usage validation.

## 6.1 Outreach / Recruitment Hub
### Later
- full campaign management
- list segmentation
- email campaigns
- social post scheduling
- campaign metrics
- recruiting operations dashboard

### Why later
Important, but separate from the core operational platform value.

---

## 6.2 Foster Parent Recruitment Funnel
### Later
- public recruitment landing pages
- inquiry flow
- lead tracking
- recruiting pipeline
- info session workflows
- application funnel management

### Why later
Useful and strategic, but not necessary to prove the core care operations platform.

---

## 6.3 Employee and Vendor Recruiting Campaigns
### Later
- new DHR employee recruiting
- vendor recruitment campaigns
- promotional content planning

---

## 6.4 Advanced communications ecosystem
### Later
- integrated phone system
- call recording/logging
- voicemail workflows
- omnichannel communications
- advanced routing

---

## 6.5 Advanced automations
### Later
- rules engine
- workflow automations
- reminders and escalation rules
- SLA-style request handling
- auto-routing of approvals/tasks

---

## 6.6 Advanced analytics and forecasting
### Later
- predictive placement insights
- vendor performance scoring
- workload balancing recommendations
- recruiting funnel forecasting

---

## 7. MVP Summary by User Group

## 7.1 DHR / Admin / Manager MVP
- manage users and permissions basics
- create intake records
- assign staff
- view cases
- review requests
- review vendors
- see basic operational dashboards

## 7.2 Worker MVP
- view assigned cases
- message participants
- manage appointments and tasks
- review and respond to requests
- access approved vendors
- work from dashboard

## 7.3 Resource Parent MVP
- log in
- view children in placement
- message worker
- submit and track requests
- browse approved vendors
- access resources and contacts

## 7.4 Vendor MVP
- create vendor account from invite
- upload onboarding documents
- complete review steps
- receive approval status

---

## 8. What Should Probably NOT Be in MVP

To keep the MVP realistic, these should probably stay out unless there is a very strong reason:
- full outreach/campaign hub
- full social media scheduling
- advanced recruiting funnels
- deep financial/payment system
- advanced vendor marketplace features
- sophisticated match scoring
- complex phone system integration
- advanced analytics / forecasting
- full child portal
- full birth parent portal

---

## 9. Recommended MVP Release Definition

A good MVP release should be able to support this scenario end to end:

1. DHR creates a child intake
2. Staff are assigned
3. Placement search is initiated
4. Placement requests are sent to eligible homes
5. Resource parent responds
6. Placement is made
7. Worker manages the case
8. Resource parent logs in to view child info and message worker
9. Resource parent submits a request
10. Worker/DHR reviews that request
11. DHR onboards a vendor and makes them visible if approved

If FosterHub can do that well, it already has real value.

---

## 10. Recommended Phase 2 Release Definition

A strong Phase 2 would add:
- richer portals for birth parents and youth
- stronger vendor workflows
- invoice/payment-related flows
- broadcast texting
- improved placement tooling
- better admin configuration
- deeper reporting

---

## 11. Dependencies and Build Order

### Foundation first
1. Auth / users / permissions
2. Core data models
3. Cases / intake
4. Messaging basics
5. Requests
6. Resource parent portal basics
7. Placement workflow
8. Vendor onboarding basics
9. Reporting basics

### Then deepen
10. Broadcasts
11. Parent portal expansion
12. Birth parent / youth portal expansion
13. Vendor marketplace / invoices
14. Outreach / recruiting

---

## 12. Final Recommendation

The best version-1 strategy for FosterHub is:

### MVP = operational core
- DHR
- workers
- resource parents
- placements
- requests
- messaging
- vendor basics

### Phase 2 = ecosystem expansion
- birth parent portal
- youth portal
- vendor expansion
- invoices
- broadcasts
- better admin/reporting

### Later = strategic growth modules
- outreach hub
- recruitment funnels
- social publishing
- automations
- forecasting

This sequencing gives FosterHub the best chance of becoming a usable, adoptable product without collapsing under its own scope.
