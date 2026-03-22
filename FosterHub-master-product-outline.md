# FosterHub Master Product Outline

## 1. Product Overview

FosterHub is a browser-first platform with mobile support designed to centralize foster care operations for DHR and related participants.

It is intended to support the workflows of:
- DHR administrators
- Managers / supervisors
- Case workers
- Placement finders
- Foster / adoptive / resource parents
- Birth parents
- Children / youth
- Vendors
- Potentially GALs, attorneys, CASA advocates, and other approved participants

FosterHub is not just a messaging app or case tracker. It is an operational platform that brings together:
- intake
- placement matching
- case management
- communication
- service requests
- vendor management
- recruitment
- parent support tools
- permission-driven access control

---

## 2. Platform Approach

### Primary access
- Desktop browser

### Secondary access
- Mobile version / mobile app

### Product philosophy
FosterHub should be designed as a **browser-first system**, with mobile support for high-priority workflows.

The platform should use **role templates plus granular permissions**, not rigid user levels only.

This means users can begin with a default role, such as:
- Administrator
- Manager
- Worker
- Resource Parent
- Birth Parent
- Vendor
- Child

Then permissions can be adjusted depending on DHR policy, case context, and organization needs.

---

## 3. Core Product Principles

### 3.1 Permission-first architecture
The system should answer:
**What can this person see and do?**
not just:
**What role are they?**

### 3.2 Audience-specific portals
Different user groups should have different experiences, even if they share underlying data.

### 3.3 Workflow-driven design
The system should support queues, approvals, assignments, statuses, and audit trails.

### 3.4 Sensitive-data controls
Because the platform handles child and family information, access must be intentionally scoped and auditable.

### 3.5 Browser-contained communication
Where possible, operational messaging should stay inside the platform instead of spilling into personal phones or unmanaged channels.

---

## 4. Core Roles

These are base templates, not necessarily hard-coded forever.

### 4.1 Administrator
Full access to system settings, users, permissions, data, dashboards, and organizational controls.

### 4.2 Manager / Supervisor
Access to direct reports, their assignments, operational dashboards, and selected review / approval functions.

### 4.3 Worker / Case Worker
Access to assigned child cases, communication tools, calendars, documents, requests, and case updates.

### 4.4 Placement Finder
Responsible for identifying and coordinating placement matches for children entering care or needing re-placement.

### 4.5 Resource Parent
Foster, adoptive, or kinship caregiver with access to information and tools for children in their home.

### 4.6 Birth Parent
Limited, permission-controlled access to approved child information, schedules, messages, and document submission workflows.

### 4.7 Child / Youth
Age-appropriate, limited access for communication, requests, and selected information.

### 4.8 Vendor
External user who may apply, onboard, manage offerings, and participate in approved workflows.

### 4.9 Additional future participant roles
Potential future roles may include:
- GAL
- attorney
- CASA advocate
- provider
- school contact
- therapist

These may be modeled as case participants with role-based permission scopes.

---

## 5. Permission Model

Instead of a single flat permission list, FosterHub should organize permissions into categories.

### 5.1 Case access permissions
- view assigned cases
- view team cases
- view all cases
- edit case data
- upload documents
- access sensitive records
- manage placements

### 5.2 Communication permissions
- send messages
- receive messages
- message children
- message birth parents
- message foster parents
- message vendors
- receive broadcast notices

### 5.3 Approval permissions
- review service requests
- approve / deny requests
- review vendor submissions
- approve / deny vendor applications
- approve invoices
- approve reimbursements

### 5.4 Financial permissions
- submit reimbursements
- review reimbursements
- submit invoices
- review invoices
- manage payment workflows

### 5.5 Vendor permissions
- access vendor queue
- review vendor docs
- change vendor visibility
- manage service offerings
- manage vendor status

### 5.6 Reporting permissions
- view own metrics
- view team metrics
- export reports
- access audit history

### 5.7 Admin permissions
- manage users
- assign roles
- configure permissions
- manage settings
- manage organization-wide workflows

---

## 6. Major Product Modules

FosterHub is best understood as a set of connected modules.

### 6.1 DHR Intake Module
### 6.2 Placement Matching Module
### 6.3 Case Management Module
### 6.4 Service Request Module
### 6.5 Messaging and Communications Module
### 6.6 Vendor Management Module
### 6.7 Resource Parent Portal
### 6.8 Birth Parent Portal
### 6.9 Child / Youth Portal
### 6.10 Outreach / Recruitment Hub
### 6.11 Reporting and Oversight

---

## 7. DHR Intake Module

The Intake module handles onboarding new children/cases into the system.

### 7.1 Intake responsibilities
- create a new child record
- collect intake information
- assign internal staff
- invite external participants
- prepare case for placement or activation

### 7.2 Intake form data may include
- child name
- DOB / age
- case number
- county / region
- sibling group info
- legal status
- urgency
- current placement status
- school info
- medical / behavioral notes
- placement restrictions or preferences
- required approvals
- key contacts
- notes

### 7.3 Internal assignment
Once a child is entered, DHR should be able to assign:
- primary case worker
- supervisor / team
- placement finder
- other internal roles as needed

### 7.4 Participant onboarding
DHR should be able to invite related participants such as:
- birth parents
- GAL
- attorney
- advocate
- foster parent after placement

### 7.5 Intake status examples
- Draft
- In Review
- Ready for Assignment
- Placement Search Active
- Matched
- Placed
- Closed / Archived

---

## 8. Placement Matching Module

This module helps DHR identify eligible foster/resource homes for a child.

### 8.1 Matching criteria may include
- open capacity
- approved status
- active availability
- age/gender fit
- sibling capacity
- geographic fit
- special training or certifications
- household restrictions/preferences
- emergency placement availability

### 8.2 Placement workflow
1. Child enters placement search
2. System identifies eligible homes
3. DHR reviews candidates
4. Placement outreach is sent
5. Homes respond
6. Placement staff review responses
7. Home is selected
8. Placement is confirmed and recorded

### 8.3 Placement request broadcast
The system should support sending placement requests to multiple eligible foster parents at once.

### 8.4 Foster parent response options
- Interested
- Need more information
- Not available
- Cannot accept at this time

### 8.5 Placement outreach status examples
- Not Started
- Matching in Progress
- Sent to Homes
- Responses Received
- Under Review
- Placement Selected
- Placement Confirmed
- Closed

### 8.6 Placement privacy principle
Initial placement outreach should include only the minimum necessary child information until further review or approval is appropriate.

---

## 9. Case Management Module

This is one of the main operational systems for DHR workers.

### 9.1 Primary purpose
- manage assigned children/cases
- view case data and history
- access documents
- monitor appointments and tasks
- coordinate with participants

### 9.2 Case list view may include
- child name
- case number
- placement/resource home
- assigned worker
- status
- last activity
- upcoming appointment
- alerts

### 9.3 Case detail sections may include
- Overview
- Contacts
- Documents
- Medical
- Legal
- Education
- Notes / timeline
- Appointments
- Requests / approvals
- Communication history

### 9.4 Design goal
Workers should be able to answer quickly:
- what is happening with this child?
- what is due next?
- who is involved?
- what is pending?

---

## 10. Service Request Module

This module handles requests made by different users and routes them through approval workflows.

### 10.1 Possible request sources
- resource parent
- child / youth
- worker
- vendor
- birth parent where permitted

### 10.2 Request types may include
- service approval
- camp/activity approval
- reimbursement request
- supply request
- document request
- travel request
- support request
- other official workflow items

### 10.3 Request queue fields
- request type
- child
- submitted by
- date submitted
- status
- approver(s)
- priority
- assigned worker

### 10.4 Request status examples
- Draft
- Submitted
- Needs More Information
- Under Review
- Pending Approval
- Approved
- Denied
- Completed

### 10.5 Product benefit
This module reduces scattered email/text workflows and creates accountability and auditability.

---

## 11. Messaging and Communications Module

Messaging in FosterHub should support both one-to-one operational communication and large-scale broadcasts.

### 11.1 Messaging categories
#### A. Case / operational messaging
Secure in-platform communication between participants.

#### B. Broadcast messaging
Large-scale notifications for urgent or operational outreach.

#### C. Placement outreach messaging
Targeted messaging to eligible foster homes regarding placement opportunities.

### 11.2 Operational messaging users may include
- worker ↔ resource parent
- worker ↔ child
- worker ↔ birth parent
- worker ↔ vendor
- staff ↔ staff

### 11.3 Operational messaging goals
- stay browser/in-app based where possible
- support filtering and sorting
- maintain audit trails
- reduce personal phone dependence

### 11.4 Broadcast use cases
- emergency mass texts to foster parents
- urgent department notices
- placement requests to eligible homes
- outreach alerts

### 11.5 Broadcast controls
Broadcasts should allow filtering by:
- county / region
- home type
- capacity
- certifications
- availability
- role / audience segment

### 11.6 Broadcast types
- Emergency
- Urgent Notice
- General Broadcast
- Placement Request

### 11.7 Communications dashboard may include
- inbox
- call logs
- contacts
- unread messages
- urgent alerts
- recent broadcasts

---

## 12. Vendor Management Module

This module manages the full lifecycle of DHR vendor relationships.

### 12.1 Vendor intake paths
There are three main ways a vendor can enter the system:
1. DHR-initiated invite
2. Foster parent recommendation/request
3. Vendor self-registration

All should feed into a common review pipeline.

### 12.2 DHR-initiated vendor onboarding
1. DHR sends onboarding link
2. Vendor creates account
3. Vendor submits required documents
4. DHR receives submission in review queue
5. Reviewer approves / denies / requests corrections
6. Vendor is notified
7. Vendor is activated if approved

### 12.3 Foster parent–initiated vendor request
1. Parent searches vendor list
2. Vendor is not found
3. Parent submits vendor recommendation/request
4. System checks for duplicates
5. DHR reviews request
6. DHR denies, approves for outreach, or requests more info
7. If approved for outreach, vendor receives onboarding link

### 12.4 Vendor self-registration
1. Vendor visits public application page
2. Creates account
3. Submits application
4. DHR reviews
5. Vendor is approved, denied, or asked to complete more onboarding

### 12.5 Vendor submission requirements may include
- legal business name
- DBA
- W-9
- contact information
- address
- service categories
- licenses/certifications
- insurance documents
- agreements/policies

### 12.6 Vendor review queue should support
- new applications
- parent recommendations
- document resubmissions
- compliance reviews
- suspension reviews
- invoice issues

### 12.7 Application status examples
- Draft
- Submitted
- Under Review
- Needs More Information
- Pending Decision
- Approved
- Denied
- Withdrawn

### 12.8 Vendor status examples
- Invited
- Applicant
- Approved
- Approved with Conditions
- Active
- Private
- Public
- Suspended
- Suspended with Conditions
- Inactive
- Rejected

### 12.9 Visibility model
Vendors should have a visibility setting separate from approval:
- Public = visible to parents
- Private = visible internally to DHR only

### 12.10 Vendor marketplace / offerings
Approved vendors may be able to list:
- activities
- camps
- services
- other line items for parent request workflows

### 12.11 Invoice workflow
A likely v1 process:
1. service/activity is requested
2. request is approved
3. vendor is notified
4. vendor submits invoice
5. invoice is verified
6. DHR processes payment

---

## 13. Caseworker Portal

This is the main operational workspace for workers.

### 13.1 Suggested top navigation
- Dashboard
- Cases
- Requests
- Vendors
- Communications
- Reports
- Outreach (optional / later)

### 13.2 Dashboard may include
- weekly calendar
- task list
- messages
- pending approvals
- recent activity
- metrics

### 13.3 Useful worker metrics
- calls made
- messages responded to
- tasks completed
- home visits completed
- pending case actions
- open service requests
- overdue items

### 13.4 Worker portal goals
- manage assigned cases
- track appointments
- process official requests
- stay on top of communication
- reduce fragmented workflows

---

## 14. Resource Parent Portal

This portal should feel supportive and practical rather than bureaucratic.

### 14.1 Suggested top navigation
- Dashboard
- Children
- Requests
- Vendors / Marketplace
- Messages
- Resources
- Documents / Profile

### 14.2 Parent dashboard may include
- children in care
- appointments
- pending requests
- unread messages
- reminders
- quick resource links

### 14.3 Child sections may include
- Overview
- Contacts
- Medical
- Documents
- Appointments
- School / activities
- Requests
- Important updates

### 14.4 Resource parent capabilities
- access child-related records as permitted
- communicate with worker
- browse approved vendors
- request services
- recommend vendors
- access important phone numbers and crisis resources
- manage documents

---

## 15. Birth Parent Portal

This portal should be tightly scoped and permission-controlled.

### 15.1 Suggested top navigation
- Dashboard
- Child
- Schedule
- Messages
- Documents
- Resources

### 15.2 Intended use cases
- view approved child information
- message worker
- view visitation/call schedules
- upload required documents
- receive updates and requests
- access support resources

### 15.3 Sensitive access principle
Birth parents should not automatically see all case data. Access to medical or other sensitive information should be controlled by permission and policy.

---

## 16. Child / Youth Portal

This portal should be age-appropriate and limited.

### 16.1 Possible capabilities
- message assigned worker
- submit requests
- see selected schedule information
- access approved resources
- receive certain updates

### 16.2 Design principle
The child/youth experience should be simple, supportive, and carefully permissioned.

---

## 17. Outreach / Recruitment Hub

This module supports DHR outreach and campaign operations.

### 17.1 Suggested naming
Preferred labels:
- Outreach Hub
- Communications Hub
- Campaigns
- Recruitment Hub

### 17.2 Main capabilities
- create email campaigns
- manage lists / audiences
- view campaign metrics
- create and schedule social posts
- support recruiting campaigns
- promote department initiatives

### 17.3 Recruiting use cases
- recruit foster parents
- recruit vendors
- recruit DHR employees

### 17.4 Campaign capabilities
- create drafts
- use templates
- schedule sends
- track opens/clicks
- segment audiences
- manage suppression / opt-out rules where applicable

### 17.5 Social publishing capabilities
- draft posts
- upload media
- schedule posts
- maintain approval workflows
- view performance

### 17.6 Suggested hub structure
- Dashboard
- Campaigns
- Lists / Audiences
- Templates
- Social Calendar
- Recruiting
- Reports

---

## 18. Foster Parent Recruitment Funnel

This is a public-facing lead and application pipeline for new foster parents.

### 18.1 Public landing page goals
- explain the opportunity
- answer common questions
- reduce friction
- collect leads
- route people into the application process

### 18.2 CTA options
- Apply Now
- Get More Information
- Talk to Someone
- Attend an Info Session

### 18.3 Funnel stages
1. Inquiry / Lead capture
2. Pre-screen / qualification
3. Application start
4. Application in progress
5. Review / follow-up
6. Approval / denial / withdrawal
7. Active foster parent

### 18.4 Recruitment statuses may include
- New Lead
- Contacted
- Info Session Invited
- Info Session Attended
- Pre-Screened
- Application Started
- Application In Progress
- Under Review
- Approved
- Denied
- Withdrawn
- Active Foster Parent

### 18.5 DHR-side recruiting tools
- assign recruiter
- track lead stage
- follow up with applicants
- trigger onboarding tasks
- view recruiting metrics

---

## 19. Reporting and Oversight

Reporting should be role-sensitive and useful, not just decorative.

### 19.1 Potential dashboard/report categories
- worker productivity
- caseload status
- placement activity
- service request volume
- vendor approval pipeline
- campaign performance
- recruiting funnel metrics
- communication response volume
- overdue items
- audit logs

### 19.2 Manager use cases
- direct report oversight
- team performance
- workload balancing
- pending approvals
- compliance visibility

---

## 20. Key Workflows

### 20.1 Child intake workflow
- child added to system
- intake completed
- team assigned
- participants invited
- placement search activated if needed

### 20.2 Placement workflow
- eligible homes identified
- placement request broadcast sent
- responses collected
- home selected
- placement confirmed

### 20.3 Vendor onboarding workflow
- intake from invite / parent request / self-registration
- duplicate check
- document collection
- review queue decision
- activation / visibility assignment

### 20.4 Service request workflow
- request submitted
- routed to approvers
- reviewed
- approved / denied / returned
- completed and logged

### 20.5 Parent support workflow
- resource parent accesses child information
- sends request / message
- tracks response
- uses vendor/resources as permitted

### 20.6 Recruitment workflow
- prospect lands on recruiting page
- inquiry submitted
- DHR follows up
- applicant moves through pipeline
- becomes approved foster parent

---

## 21. Data / Entity Concepts

A future schema will likely include entities such as:
- User
- Role
- Permission
- Organization
- Child
- Case
- Placement
- Resource Home
- Team Assignment
- Participant Invite
- Message Thread
- Broadcast Campaign
- Service Request
- Vendor
- Vendor Application
- Vendor Document
- Vendor Offering
- Invoice
- Appointment
- Task
- Report
- Recruitment Lead
- Foster Parent Application

---

## 22. Product Differentiators

The strongest differentiators in FosterHub are:
- browser-first foster care operations platform
- placement matching and large-scale placement outreach
- integrated vendor approval and marketplace workflows
- permission-based multi-portal architecture
- request and approval workflows across participants
- combined operational and outreach/recruitment capabilities

---

## 23. Suggested MVP Focus

The product has many possible modules, but the likely highest-value early areas are:

### MVP candidates
- role and permission system
- DHR intake
- placement matching / placement request workflow
- case management
- worker dashboard
- resource parent portal basics
- messaging / communication
- service request workflow
- vendor onboarding basics

### Later-phase candidates
- vendor marketplace expansion
- full bio parent portal expansion
- child/youth portal expansion
- outreach / campaign hub
- social media scheduling
- advanced recruiting automation
- deeper financial workflows

---

## 24. Final Product Framing

FosterHub is a centralized foster care coordination platform designed to help DHR and related participants manage intake, placement, case work, communication, requests, vendors, and family support through a permission-based, browser-first system.

Its design should prioritize:
- clarity
- workflow efficiency
- privacy and permission control
- role-specific experiences
- operational accountability
- scalable module growth over time

---

## 25. Recommended Next Documents

After this master outline, the best next artifacts are:
1. MVP vs Phase 2 vs Phase 3 roadmap
2. Permission matrix
3. Sitemap / navigation map
4. Wireframe outline by portal
5. Data / entity model
6. Formal PRD
