# FosterHub Wireframe Outline — Main Portals

## 1. Purpose

This document translates the FosterHub product structure into a wireframe-style outline for the main portals.

It is not visual design. It is a screen structure guide that defines:
- major screens
- key page sections
- common components
- likely user actions
- content hierarchy

This should help move FosterHub from concept into actual UX planning.

---

## 2. Main Portals in Scope

This outline focuses on the highest-value early portals:
1. DHR Admin / Manager Portal
2. Caseworker Portal
3. Resource Parent Portal
4. Vendor Portal

These four represent the strongest operational core for early product design.

---

## 3. Shared Layout Pattern

Most authenticated portals can follow a similar shell.

### 3.1 Page shell
- Top header
  - logo
  - global search
  - notifications
  - messages shortcut
  - user menu
- Left sidebar or top nav
- Main content area
- Right rail (optional for alerts/details)

### 3.2 Common components
- cards / summary panels
- tables / queues
- tabs
- filters
- status badges
- action buttons
- activity timeline
- empty states
- modals / drawers

### 3.3 Global quick actions
Depending on role:
- create intake
- send placement request
- create request
- upload document
- send message
- invite user
- add vendor

---

# 4. DHR Admin / Manager Portal Wireframe Outline

## 4.1 Primary Goal
Provide organization-level oversight, approvals, staff management, intake visibility, placement visibility, vendor management, and reporting.

## 4.2 Main Navigation
- Dashboard
- Intake
- Placements
- Cases
- Requests
- Vendors
- Communications
- Reports
- Admin

---

## 4.3 Dashboard Screen

### Header area
- Page title: Dashboard
- Date range selector
- Filters: county, team, worker, status

### Top summary cards
- Open Intakes
- Active Placement Searches
- Pending Requests
- Vendors Awaiting Review
- Overdue Items
- Team Caseload Count

### Main content rows
#### Row 1
- Team Activity Snapshot
- Urgent Alerts / Escalations

#### Row 2
- Placement Pipeline Overview
- Request Approval Queue Summary

#### Row 3
- Vendor Queue Snapshot
- Worker Performance / Workload Snapshot

### Optional right rail
- recent activity feed
- notifications
- quick actions

### Key actions
- Create Intake
- Review Requests
- Review Vendors
- Open Placements Dashboard

---

## 4.4 Intake Queue Screen

### Header
- Page title: Intake Queue
- Create New Intake button

### Filters / controls
- status
- county
- assigned worker
- placement urgency
- date created

### Main table
Columns:
- Child name
- Case number
- Intake status
- County
- Assigned worker
- Placement finder
- Urgency
- Date created
- Last updated
- Actions

### Row action examples
- Open
- Assign
- Start placement search
- Invite participant

---

## 4.5 Intake Detail Screen

### Header
- Child name / intake status / urgency badge
- Actions: Edit, Assign, Start Placement Search, Invite Participant

### Main layout
#### Left main column
- Child / intake overview card
- Intake information section
- Key contacts section
- Placement considerations section
- Notes / intake timeline

#### Right side panel
- Assignment panel
- Participant invitations
- Next required actions

### Bottom tabs or sections
- Documents
- Participants
- Assignment history
- Activity log

---

## 4.6 Placements Dashboard Screen

### Header
- Page title: Placements
- Action: Create Placement Request

### Top cards
- Active placement searches
- Homes contacted
- Responses pending review
- Placements made this week
- Urgent cases

### Main content
#### Left panel
- Active placement search table

#### Right panel
- placement response activity
- recently interested homes
- placement alerts

### Secondary section
- map or regional distribution view (optional later)
- recent placement decisions

---

## 4.7 Cases List Screen

### Header
- Page title: Cases
- Filters and saved views

### Filters
- assigned worker
- team
- county
- case status
- placement status
- open requests

### Main table
Columns:
- Child
- Case number
- Worker
- Placement home
- Status
- Upcoming appointment
- Open requests
- Last activity

### Actions
- Open case
- Reassign
- Message
- View requests

---

## 4.8 Request Queue Screen

### Header
- Page title: Requests

### Queue tabs
- All
- Pending Review
- Needs More Info
- Approved
- Denied
- Completed

### Main table
Columns:
- Request type
- Child
- Submitted by
- Assigned worker
- Status
- Priority
- Submitted date
- Last updated

### Right panel or row preview
- request summary
- documents attached
- required approvers

### Actions
- Open request
- Approve
- Deny
- Request more info
- Reassign

---

## 4.9 Vendor Queue Screen

### Header
- Page title: Vendors
- Action: Invite Vendor

### Tabs
- Pending Applications
- Approved Vendors
- Private Vendors
- Public Vendors
- Suspended

### Main table
Columns:
- Vendor name
- Category
- Intake source
- Status
- Visibility
- Assigned reviewer
- Missing items
- Last updated

### Actions
- Review
- Request documents
- Approve
- Deny
- Change visibility

---

## 4.10 User Management / Permissions Screen

### Header
- Page title: Users & Permissions
- Actions: Add User, Edit Role Template

### Layout
#### Left panel
- User list
- Filters by role/team/status

#### Main panel
- selected user details
- assigned role template
- permission groups
- individual overrides

### Permission UI concept
- grouped toggles by module
- template selector
- user-specific override warnings

### Key actions
- assign role
- add override
- deactivate user
- reset permissions to template

---

# 5. Caseworker Portal Wireframe Outline

## 5.1 Primary Goal
Help workers manage assigned cases, communication, appointments, and requests efficiently.

## 5.2 Main Navigation
- Dashboard
- Cases
- Requests
- Vendors
- Communications
- Calendar

---

## 5.3 Worker Dashboard Screen

### Header
- Page title: My Dashboard
- Today / This Week toggle

### Top summary cards
- My Open Cases
- Unread Messages
- Pending Requests
- Upcoming Appointments
- Overdue Tasks

### Main content layout
#### Row 1
- My Calendar / agenda view
- Recent Messages

#### Row 2
- Open Request Queue
- Alerts / urgent case items

#### Row 3
- Task list
- My activity metrics

### Quick actions
- Open Case
- Send Message
- Create Appointment
- Review Request
- Add Case Note

---

## 5.4 My Cases Screen

### Header
- Page title: My Cases
- Search + filters

### Filters
- status
- county
- appointment today
- open request
- placement change

### Main table/cards
Columns:
- Child
- Case number
- Placement home
- Status
- Next appointment
- Open items
- Last contact

### Actions
- Open case
- Message parent
- Add note
- View appointments

---

## 5.5 Case Detail Screen

### Header
- Child name / case number / status badges
- Actions: Message, Add Note, Upload Document, Create Appointment

### Main layout
#### Left navigation tabs
- Overview
- Contacts
- Documents
- Medical
- Legal
- Education
- Appointments
- Requests
- Timeline

#### Main content area
Varies by tab.

### Default Overview tab sections
- child summary card
- placement summary
- worker/team assignment
- next appointments
- recent requests
- recent messages
- important alerts

### Timeline tab
- notes
- communication events
- appointment changes
- request history
- document uploads

---

## 5.6 Request Queue Screen

### Header
- Page title: Requests

### Tabs
- New
- In Review
- Needs Response
- Completed

### Main content
- request table
- request preview panel
- filters by child, type, status

### Actions
- open request
- update status
- request more info
- approve / recommend decision if permitted

---

## 5.7 Communications Screen

### Header
- Page title: Messages
- Actions: New Message

### Three-column layout
#### Column 1
- filters
  - all
  - parents
  - youth
  - birth parents
  - vendors
  - unread
  - urgent

#### Column 2
- conversation list

#### Column 3
- active conversation thread
- case context card

### Optional right rail
- linked child/case
- quick contact info
- recent requests

---

## 5.8 Calendar Screen

### Header
- Page title: Calendar
- actions: create appointment

### Layout
- month / week / day toggle
- calendar grid
- appointment list side panel

### Appointment detail drawer
- child
- participants
- location
- notes
- status
- reminders

---

# 6. Resource Parent Portal Wireframe Outline

## 6.1 Primary Goal
Give caregivers one clear place to view child-related information, communicate with workers, and request support.

## 6.2 Main Navigation
- Dashboard
- Children
- Requests
- Vendors
- Messages
- Resources
- Documents

---

## 6.3 Parent Dashboard Screen

### Header
- Greeting / Dashboard title

### Top summary cards
- Children in My Home
- Open Requests
- Unread Messages
- Upcoming Appointments

### Main content rows
#### Row 1
- Child summary cards
- upcoming appointments

#### Row 2
- recent messages
- request status tracker

#### Row 3
- quick contacts
- crisis resources / important links

### Quick actions
- Message Worker
- New Request
- View Child Info
- Browse Vendors

---

## 6.4 Children List Screen

### Header
- Page title: Children

### Child cards or list items
Each card may include:
- child name
- placement status
- next appointment
- worker name
- open request count
- quick actions

### Actions
- Open child profile
- Message worker
- View documents
- View appointments

---

## 6.5 Child Detail Screen

### Header
- Child name
- actions: Message Worker, New Request

### Tabs
- Overview
- Contacts
- Medical
- Documents
- Appointments
- School / Activities
- Requests

### Overview tab sections
- child summary
- assigned worker
- next appointments
- recent updates
- quick documents

### Design note
This page should be easier and less data-heavy than the worker case view.

---

## 6.6 Request Submission Screen

### Header
- Page title: New Request

### Form sections
- request type dropdown
- child selector
- description
- requested date / urgency
- supporting documents

### Helpful UI elements
- guided request categories
- help text
- progress / confirmation state

### Actions
- save draft
- submit request

---

## 6.7 My Requests Screen

### Layout
- status tabs
- request list
- request detail drawer or page

### Request card/table data
- request type
- child
- status
- submitted date
- latest update

### Actions
- open request
- upload supporting docs
- reply to more-info request

---

## 6.8 Vendors Screen

### Header
- Page title: Vendors
- search + categories

### Main layout
- category sidebar
- vendor directory grid/list
- detail preview panel or detail page

### Vendor card data
- vendor name
- service category
- location
- approved badge
- short description

### Actions
- view vendor
- request service
- recommend vendor

---

## 6.9 Messages Screen

### Layout
- inbox list
- thread view
- child context badge

### Features
- filter by child
- unread filter
- worker-only view

---

## 6.10 Resources Screen

### Sections
- emergency phone numbers
- crisis hotline
- FAQs
- training resources
- community support
- important forms

---

## 6.11 Documents Screen

### Sections
- child documents
- household documents
- uploaded forms
- document request status

### Actions
- upload
- view
- download

---

# 7. Vendor Portal Wireframe Outline

## 7.1 Primary Goal
Help vendors complete onboarding, maintain compliance, manage offerings, and handle invoice-related workflows.

## 7.2 Main Navigation
- Dashboard
- Onboarding
- Documents
- Offerings
- Invoices
- Messages
- Profile

---

## 7.3 Vendor Dashboard Screen

### Header
- Welcome / vendor name

### Top summary cards
- Application Status
- Missing Documents
- Active Offerings
- Open Invoices
- Notices / Alerts

### Main content rows
#### Row 1
- onboarding progress tracker
- recent messages from DHR

#### Row 2
- compliance reminders
- invoice summary

### Quick actions
- upload document
- continue onboarding
- create offering
- submit invoice

---

## 7.4 Onboarding Screen

### Layout
- progress bar / checklist
- sections for each requirement

### Requirement blocks
- business information
- W-9
- insurance
- licensing / certifications
- agreements / acknowledgements

### Actions
- save progress
- upload item
- submit for review

---

## 7.5 Documents Screen

### Main table/cards
Columns:
- document type
- status
- expiration date
- last updated
- reviewer note

### Actions
- upload
- replace
- view notes

---

## 7.6 Offerings Screen

### Header
- Page title: Offerings
- Action: Create Offering

### Main list/grid
- service name
- category
- status
- price / pricing type
- visibility

### Offering editor sections
- title
- description
- category
- pricing
- eligibility notes
- availability

---

## 7.7 Invoices Screen

### Tabs
- Drafts
- Submitted
- In Review
- Paid

### Main table
- invoice number
- linked service
- child / request reference if allowed
- status
- amount
- date submitted

### Actions
- create invoice
- submit invoice
- view payment status

---

## 7.8 Messages Screen

### Layout
- thread list
- active thread
- notices / review requests

### Purpose
- respond to document review issues
- communicate about onboarding
- handle invoice follow-up

---

## 7.9 Profile Screen

### Sections
- business information
- contact details
- service categories
- account settings

---

# 8. Recommended First Wireframes to Actually Design

If design time is limited, start with these screens first:

## Internal
1. DHR Dashboard
2. Intake Queue
3. Intake Detail
4. Placements Dashboard
5. Request Queue
6. Vendor Queue
7. User/Permissions Screen

## Worker
8. Worker Dashboard
9. My Cases
10. Case Detail
11. Messages
12. Calendar

## Resource Parent
13. Parent Dashboard
14. Child Detail
15. New Request
16. My Requests
17. Vendors Directory
18. Messages

## Vendor
19. Vendor Dashboard
20. Onboarding Checklist
21. Documents
22. Invoices

---

## 9. Final Notes

These wireframe outlines should be treated as a structural starting point.

The strongest design principle across all portals should be:
- internal staff screens are queue-based and data-dense
- caregiver screens are guided and supportive
- vendor screens are compliance and transaction-focused
- each portal should feel tailored to its user, even though they share the same system underneath
