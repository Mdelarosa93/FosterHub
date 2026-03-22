# FosterHub Portal-by-Portal Sitemap

## 1. Purpose

This document breaks FosterHub into portal-level navigation structures.

The goal is to show:
- what each major user type sees
- how their navigation differs
- which pages/modules belong to each portal
- how the system can stay coherent while still being role-specific

This is a product sitemap, not a final UI design.

---

## 2. Platform Structure Overview

FosterHub should likely have:
- a shared authentication system
- a shared permissions engine
- shared core data models
- role-specific portals / navigation experiences

### Core portal families
1. DHR Admin / Manager Portal
2. Caseworker Portal
3. Placement / Intake Portal (or modules inside DHR portal)
4. Resource Parent Portal
5. Birth Parent Portal
6. Child / Youth Portal
7. Vendor Portal
8. Public Recruitment / Public Landing Pages
9. Outreach / Recruitment Hub

Some of these may live in one unified application with different navigation based on permissions.

---

## 3. Shared Global Elements

These may appear across multiple authenticated portals.

### 3.1 Global header / shell
- Logo / home
- Search
- Notifications
- Messages shortcut
- User menu
- Help / support

### 3.2 Shared utilities
- Profile
- Settings
- Notification preferences
- Help center
- Document upload modal
- Global search

### 3.3 Conditional global items
Depending on permissions:
- Quick add
- Broadcasts
- Approval queue
- Admin tools

---

## 4. DHR Admin / Manager Portal

This is the broadest internal portal. It supports operational oversight, approvals, configuration, and reporting.

## 4.1 Top-level navigation
- Dashboard
- Intake
- Placements
- Cases
- Requests
- Vendors
- Communications
- Outreach
- Reports
- Admin

## 4.2 Dashboard
### Possible sub-sections
- Organization snapshot
- Team metrics
- Open tasks / approvals
- Placement activity
- Vendor activity
- Recent alerts
- Recruiting snapshot

## 4.3 Intake
### Pages
- New Intake
- Intake Queue
- Intake Detail
- Assignment Panel
- Participant Invitations

## 4.4 Placements
### Pages
- Placement Dashboard
- Match Search
- Eligible Homes
- Placement Requests
- Placement Responses
- Placement History

## 4.5 Cases
### Pages
- All Cases
- Team Cases
- Case Detail
- Documents
- Appointments
- Notes / Timeline
- Participants

## 4.6 Requests
### Pages
- Request Queue
- Approvals Queue
- Request Detail
- Reimbursements
- Special Requests

## 4.7 Vendors
### Pages
- Vendor Dashboard
- Pending Applications
- Approved Vendors
- Private Vendors
- Public Vendors
- Vendor Detail
- Vendor Documents
- Invoice Queue

## 4.8 Communications
### Pages
- Inbox
- Calls / Call Logs
- Broadcast Center
- Emergency Alerts
- Placement Broadcasts
- Contacts

## 4.9 Outreach
### Pages
- Outreach Dashboard
- Campaigns
- Audience Lists
- Templates
- Social Calendar
- Recruiting Leads
- Recruiting Reports

## 4.10 Reports
### Pages
- Worker Metrics
- Caseload Reports
- Placement Reports
- Vendor Reports
- Campaign Reports
- Audit Reports

## 4.11 Admin
### Pages
- User Management
- Role Templates
- Permission Sets
- Individual Overrides
- Organization Settings
- System Settings
- Audit Logs

---

## 5. Caseworker Portal

This is the day-to-day operational workspace for frontline workers.

## 5.1 Top-level navigation
- Dashboard
- Cases
- Requests
- Vendors
- Communications
- Calendar
- Reports

## 5.2 Dashboard
### Widgets / sections
- My Calendar
- My Tasks
- Unread Messages
- Open Requests
- Alerts
- My Metrics

## 5.3 Cases
### Pages
- My Cases
- Child / Case Detail
- Contacts
- Documents
- Medical
- Legal
- Education
- Notes / Timeline
- Appointments
- Communication History

## 5.4 Requests
### Pages
- My Request Queue
- Submitted by Parents
- Submitted by Youth
- Pending Approvals
- Reimbursements
- Request Detail

## 5.5 Vendors
### Pages
- Approved Vendors
- Vendor Search
- Vendor Recommendations
- Vendor Detail
- Vendor Request Status

## 5.6 Communications
### Pages
- Inbox
- Message Threads
- Contacts
- Call Log
- Filtered Views
  - Parents
  - Youth
  - Birth Parents
  - Vendors

## 5.7 Calendar
### Pages
- Calendar View
- Appointment Detail
- Create Appointment
- Visit Schedule

## 5.8 Reports
### Pages
- My Metrics
- My Caseload Snapshot
- Activity Summary

---

## 6. Placement / Intake Portal or Module Set

This may either be its own portal for specialized staff or a permission-based module inside the DHR portal.

## 6.1 Top-level navigation
- Dashboard
- Intake Queue
- Placement Search
- Eligible Homes
- Placement Requests
- Responses
- History

## 6.2 Dashboard
- New intakes
- Active placement searches
- Placement urgency alerts
- Response summary
- Recent placements

## 6.3 Intake Queue
- New records
- In review
- Ready for assignment
- Ready for placement search

## 6.4 Placement Search
- Match filters
- Match results
- Saved search views

## 6.5 Eligible Homes
- Available homes
- Capacity data
- Qualification tags
- Household detail

## 6.6 Placement Requests
- Draft request
- Sent requests
- Expiring requests
- Follow-up queue

## 6.7 Responses
- Interested homes
- Need more info
- Declined / unavailable
- Shortlist

## 6.8 History
- Placement decisions
- Change history
- Placement timeline

---

## 7. Resource Parent Portal

This portal should feel practical, supportive, and less bureaucratic than the staff experience.

## 7.1 Top-level navigation
- Dashboard
- Children
- Requests
- Vendors
- Messages
- Resources
- Documents

## 7.2 Dashboard
### Sections
- Children in my home
- Upcoming appointments
- Open requests
- Messages
- Reminders
- Quick contacts
- Emergency resources

## 7.3 Children
### Pages
- Child List
- Child Overview
- Contacts
- Medical
- Documents
- Appointments
- School / Activities
- Requests

## 7.4 Requests
### Pages
- New Request
- My Requests
- Request Detail
- Approvals Status
- Reimbursements / support requests

## 7.5 Vendors
### Pages
- Approved Vendor Directory
- Vendor Categories
- Vendor Detail
- Request Service
- Recommend Vendor
- Marketplace Listings

## 7.6 Messages
### Pages
- Inbox
- Threads by Child
- Worker Messages
- Notifications

## 7.7 Resources
### Pages
- Crisis Hotline
- Important Phone Numbers
- FAQs
- Training / Guidance
- Community Resources

## 7.8 Documents
### Pages
- Household Documents
- Child Documents
- Uploaded Files
- Form Status
- Profile / Settings

---

## 8. Birth Parent Portal

This portal should be intentionally simpler and tightly permission-scoped.

## 8.1 Top-level navigation
- Dashboard
- Child
- Schedule
- Messages
- Documents
- Resources

## 8.2 Dashboard
### Sections
- Upcoming visitation
- Upcoming calls
- Messages from worker
- Pending tasks
- Requested documents
- Important notices

## 8.3 Child
### Pages
- Child Overview
- Approved Updates
- Contacts
- Approved Records

## 8.4 Schedule
### Pages
- Visitation Calendar
- Call Schedule
- Appointment Detail
- Request Change

## 8.5 Messages
### Pages
- Inbox
- Worker Threads
- Notifications

## 8.6 Documents
### Pages
- Requested Documents
- Upload Document
- Submission Status
- Shared Documents

## 8.7 Resources
### Pages
- Support Resources
- FAQs
- Contact Information
- Process Guidance

---

## 9. Child / Youth Portal

This portal should be minimal, age-appropriate, and supportive.

## 9.1 Top-level navigation
- Dashboard
- Messages
- Requests
- Schedule
- Resources

## 9.2 Dashboard
### Sections
- Messages
- Upcoming events
- Tasks / reminders
- Quick help

## 9.3 Messages
### Pages
- Inbox
- Worker Thread
- Other Approved Threads

## 9.4 Requests
### Pages
- New Request
- My Requests
- Request Status

## 9.5 Schedule
### Pages
- Upcoming Visits
- Calls
- Activities

## 9.6 Resources
### Pages
- Help
- Crisis Contacts
- Helpful Information

---

## 10. Vendor Portal

This portal supports onboarding, compliance, offerings, and invoice workflows.

## 10.1 Top-level navigation
- Dashboard
- Application / Onboarding
- Documents
- Offerings
- Invoices
- Messages
- Profile

## 10.2 Dashboard
### Sections
- Application status
- Missing items
- Approval status
- Recent notices
- Invoice summary

## 10.3 Application / Onboarding
### Pages
- Start Application
- Application Progress
- Requirements Checklist
- Review Status

## 10.4 Documents
### Pages
- Upload Documents
- W-9
- Insurance
- Licenses
- Agreements
- Expiration Tracking

## 10.5 Offerings
### Pages
- Service Listings
- Create Offering
- Edit Offering
- Availability / status

## 10.6 Invoices
### Pages
- Submit Invoice
- Invoice History
- Invoice Detail
- Payment Status

## 10.7 Messages
### Pages
- DHR Messages
- Request for More Info
- Notifications

## 10.8 Profile
### Pages
- Business Info
- Contacts
- Category / Services
- Account Settings

---

## 11. Outreach / Recruitment Hub

This may be part of the DHR Admin portal or a separate module.

## 11.1 Top-level navigation
- Dashboard
- Campaigns
- Lists
- Templates
- Social Calendar
- Recruiting
- Reports

## 11.2 Dashboard
- campaign summary
- list growth
- recruiting metrics
- upcoming sends
- social publishing queue

## 11.3 Campaigns
### Pages
- All Campaigns
- Create Campaign
- Drafts
- Scheduled
- Sent
- Campaign Detail

## 11.4 Lists
### Pages
- Audience Lists
- Segments
- Imports
- Suppression Lists

## 11.5 Templates
### Pages
- Email Templates
- Landing Pages
- Form Templates

## 11.6 Social Calendar
### Pages
- Calendar View
- Draft Posts
- Scheduled Posts
- Published Posts

## 11.7 Recruiting
### Pages
- Foster Parent Leads
- Vendor Leads
- Employee Recruiting
- Lead Detail
- Pipeline Views

## 11.8 Reports
### Pages
- Campaign Metrics
- Recruiting Metrics
- Channel Performance

---

## 12. Public / Unauthenticated Pages

FosterHub likely needs public-facing pages that are outside authenticated portals.

## 12.1 Public areas may include
- Main marketing / informational website
- Foster parent recruitment landing page
- Vendor self-application page
- Public contact / inquiry forms
- Event registration pages
- Login page
- Password reset

## 12.2 Foster parent recruitment page
### Pages / sections
- Overview
- Why Foster
- FAQs
- Steps to Apply
- Inquiry Form
- Application Start
- Info Session Sign-up

## 12.3 Vendor application page
### Pages / sections
- Vendor Overview
- Requirements
- Apply / Create Account
- Application Start

---

## 13. Cross-Portal Shared Objects

Even though the portals are different, several objects should appear consistently.

### Shared objects
- Child
- Case
- Request
- Message Thread
- Appointment
- Vendor
- Invoice
- User
- Resource Home
- Campaign

The difference is not the object itself, but:
- what the user can see
- what actions they can take
- how the navigation presents it

---

## 14. Suggested Navigation Philosophy

### 14.1 Internal staff portals
More operational, queue-based, and data-dense.

### 14.2 Parent portals
More task-based, supportive, and simplified.

### 14.3 Vendor portal
Compliance and transaction-focused.

### 14.4 Child portal
Minimal, clear, and age-appropriate.

---

## 15. Recommended Build Order for Sitemap to UX

After this sitemap, the next logical artifact is a screen/wireframe outline for:
1. DHR Admin / Manager Portal
2. Caseworker Portal
3. Resource Parent Portal
4. Vendor Portal

Those four likely represent the highest-value design surfaces early on.

---

## 16. Final Sitemap Summary

FosterHub should feel like one connected platform, but different users should experience it through different portals and navigation systems.

### Major portal families
- DHR Admin / Manager
- Caseworker
- Placement / Intake
- Resource Parent
- Birth Parent
- Child / Youth
- Vendor
- Outreach / Recruitment
- Public Landing Pages

The product should share one permission engine and one data foundation, while presenting role-appropriate information architecture to each audience.
