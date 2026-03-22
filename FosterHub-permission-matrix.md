# FosterHub Permission Matrix

## 1. Purpose

This document defines a starting permission matrix for FosterHub.

The goal is to avoid hard-coding the product around rigid user levels and instead model access using:
- role templates
- granular permissions
- case-specific assignments
- configurable visibility rules

This is a **starter matrix**, not a final legal or policy model.
Some permissions should be adjustable by organization, policy, or case-specific needs.

The ideal product model is similar to **HubSpot’s permissions system**:
- strong default permission templates by role
- the ability for admins to customize access as needed
- the ability to tune permissions per individual user when necessary
- enough flexibility to support real-world exceptions without breaking the role system

---

## 2. Core Principles

### 2.1 Role templates, not fixed limitations
Roles should start with defaults, but admins should be able to adjust permission sets.

### 2.2 Case-scoped access where possible
Some permissions should apply only to:
- assigned cases
- children in placement
- direct reports
- invited participants

### 2.3 Sensitive data should be separately controlled
Seeing a child profile is not the same as seeing:
- medical records
- legal records
- placement notes
- internal worker notes
- financial/payment information

### 2.4 Action permissions and view permissions are different
Users may be allowed to:
- view something
- create something
- edit something
- approve something
- export something

These should not automatically be bundled.

---

## 3. Role Templates in Scope

This matrix covers the following roles:
- Administrator
- Manager / Supervisor
- Worker / Case Worker
- Placement Finder
- Resource Parent
- Birth Parent
- Child / Youth
- Vendor

Future roles like GAL, attorney, CASA, or provider can later be added using the same structure.

---

## 4. Permission Key

### Legend
- **Y** = allowed by default
- **L** = limited / conditional / case-based
- **N** = not allowed by default
- **C** = configurable by organization/admin

Notes:
- **L** usually means assigned-case only, placement-only, invitation-only, or policy-controlled access.
- **C** means the system should support toggling this for that role if needed.

---

## 5. User and Admin Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View own profile | Y | Y | Y | Y | Y | Y | Y | Y |
| Edit own profile | Y | Y | Y | Y | Y | Y | L | Y |
| Manage users | Y | C | N | N | N | N | N | N |
| Assign roles | Y | C | N | N | N | N | N | N |
| Configure permissions | Y | N | N | N | N | N | N | N |
| View organization settings | Y | C | N | N | N | N | N | N |
| Edit organization settings | Y | N | N | N | N | N | N | N |
| View audit logs | Y | C | N | N | N | N | N | N |

---

## 6. Case and Child Access Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View all cases | Y | C | N | N | N | N | N | N |
| View team/direct-report cases | Y | Y | N | C | N | N | N | N |
| View assigned cases | Y | Y | Y | Y | N | N | N | N |
| View child records linked to user | Y | Y | Y | Y | Y | L | L | N |
| Create child/case record | Y | C | C | N | N | N | N | N |
| Edit case record | Y | C | Y | C | N | N | N | N |
| Assign internal team members | Y | C | C | N | N | N | N | N |
| View case participants | Y | Y | Y | Y | L | L | N | N |
| Invite case participants | Y | C | C | N | N | N | N | N |
| Archive / close case | Y | C | C | N | N | N | N | N |

### Notes
- Resource parents should only see children placed in their home or otherwise linked to them.
- Birth parents should only see approved child information for linked cases.
- Child/youth access should be highly scoped and age-appropriate.

---

## 7. Sensitive Record Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View medical summary | Y | C | Y | L | L | C | N | N |
| View full medical records | Y | C | Y | N | C | N | N | N |
| Upload medical documents | Y | C | Y | N | C | N | N | N |
| View legal documents | Y | C | Y | L | C | C | N | N |
| Upload legal documents | Y | C | Y | N | C | C | N | N |
| View personal identity documents | Y | C | Y | L | C | C | N | N |
| View internal worker notes | Y | C | Y | N | N | N | N | N |
| View placement-sensitive notes | Y | C | Y | Y | N | N | N | N |

### Notes
- Resource parent access to medical/legal documents should be carefully scoped and likely category-based.
- Birth parent access to medical/legal information should be highly policy-dependent.
- Internal notes should never be visible to parents, children, or vendors.

---

## 8. Intake and Assignment Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| Create intake record | Y | C | C | N | N | N | N | N |
| Edit intake record | Y | C | C | N | N | N | N | N |
| View intake queue | Y | C | C | C | N | N | N | N |
| Assign case worker | Y | C | C | N | N | N | N | N |
| Assign placement finder | Y | C | C | N | N | N | N | N |
| Activate placement search | Y | C | C | Y | N | N | N | N |
| Invite birth parent to portal | Y | C | C | N | N | N | N | N |
| Invite GAL / attorney / participant | Y | C | C | N | N | N | N | N |

---

## 9. Placement Matching Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View eligible resource homes | Y | C | C | Y | N | N | N | N |
| Run placement match search | Y | C | C | Y | N | N | N | N |
| Send placement request broadcast | Y | C | C | Y | N | N | N | N |
| View placement responses | Y | C | C | Y | N | N | N | N |
| Select placement home | Y | C | C | Y | N | N | N | N |
| Confirm placement | Y | C | C | Y | N | N | N | N |
| Respond to placement request | N | N | N | N | Y | N | N | N |
| Mark household availability | N | N | N | N | Y | N | N | N |

### Notes
- Resource parents should be able to respond to placement requests and manage availability, but not see internal matching logic.

---

## 10. Messaging and Communication Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| Send direct messages | Y | Y | Y | Y | Y | Y | L | Y |
| Receive direct messages | Y | Y | Y | Y | Y | Y | L | Y |
| Message assigned worker | Y | Y | Y | Y | Y | Y | Y | N |
| Message resource parent | Y | Y | Y | Y | Y | N | N | N |
| Message birth parent | Y | Y | Y | N | N | Y | N | N |
| Message child / youth | Y | C | Y | N | N | N | C | N |
| View communication history on case | Y | C | Y | C | L | L | N | N |
| Send emergency mass texts | Y | C | C | N | N | N | N | N |
| Send placement broadcasts | Y | C | C | Y | N | N | N | N |
| Receive emergency broadcast | C | C | C | C | Y | C | C | C |
| Receive placement request broadcast | N | N | N | N | Y | N | N | N |

### Notes
- Child messaging should be enabled only when appropriate by age/policy.
- Vendors may need messaging for onboarding and invoice workflows, but not broad case communications.

---

## 11. Calendar and Schedule Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View own schedule | Y | Y | Y | Y | Y | Y | L | Y |
| Edit own schedule | Y | Y | Y | Y | N | N | N | N |
| View case appointments | Y | C | Y | C | L | L | L | N |
| Create appointments | Y | C | Y | C | N | N | N | N |
| Request appointment changes | N | N | N | N | Y | Y | C | N |
| Confirm attendance | N | N | N | N | Y | Y | C | N |

### Notes
- Parents and children should mostly interact with appointments through confirmation/request workflows rather than broad schedule editing.

---

## 12. Service Request Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| Submit service request | Y | Y | Y | N | Y | C | C | N |
| View submitted requests | Y | Y | Y | C | Y | L | L | C |
| Edit own draft requests | Y | Y | Y | N | Y | C | C | N |
| Review requests | Y | Y | Y | C | N | N | N | N |
| Approve / deny requests | Y | C | C | C | N | N | N | N |
| Upload supporting docs to request | Y | Y | Y | N | Y | C | C | C |
| Track request status | Y | Y | Y | C | Y | Y | L | C |

### Notes
- Birth parent and child request rights should be configurable by organization and case type.
- Vendor participation in requests should usually be limited to vendor-related workflows.

---

## 13. Vendor Management Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View approved vendor list | Y | Y | Y | C | Y | N | N | C |
| View all vendors incl. private | Y | C | C | N | N | N | N | N |
| Invite vendor to onboard | Y | C | C | N | N | N | N | N |
| Submit vendor recommendation | Y | Y | Y | N | Y | N | N | N |
| Review vendor applications | Y | C | C | N | N | N | N | N |
| Approve / deny vendor | Y | C | C | N | N | N | N | N |
| Request missing vendor docs | Y | C | C | N | N | N | N | N |
| Toggle vendor public/private | Y | C | C | N | N | N | N | N |
| Manage vendor status | Y | C | C | N | N | N | N | N |
| Create vendor offerings / line items | N | N | N | N | N | N | N | Y |
| Edit own vendor profile | N | N | N | N | N | N | N | Y |
| Upload onboarding docs | N | N | N | N | N | N | N | Y |

### Notes
- Foster parents should be able to recommend vendors but not approve them.
- Vendors should only manage their own profile, documents, offerings, and invoices.

---

## 14. Financial and Invoice Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| Submit mileage reimbursement | Y | Y | Y | C | N | N | N | N |
| Review reimbursements | Y | C | C | N | N | N | N | N |
| Approve reimbursements | Y | C | C | N | N | N | N | N |
| Submit vendor invoice | N | N | N | N | N | N | N | Y |
| View invoice status | Y | C | C | N | N | N | N | Y |
| Verify invoice | Y | C | C | N | C | N | N | N |
| Approve invoice for payment | Y | C | C | N | N | N | N | N |
| View payment history | Y | C | C | N | C | N | N | Y |

### Notes
- Resource parent involvement in invoice verification may be needed for selected workflows.
- Financial authority should be separated from case access authority.

---

## 15. Resource and Support Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View support resources | Y | Y | Y | Y | Y | Y | Y | C |
| View emergency contacts | Y | Y | Y | Y | Y | Y | Y | N |
| View crisis hotline info | Y | Y | Y | Y | Y | Y | Y | N |
| View training materials | Y | Y | Y | Y | Y | C | C | C |

---

## 16. Outreach and Recruitment Permissions

| Permission | Admin | Manager | Worker | Placement Finder | Resource Parent | Birth Parent | Child | Vendor |
|---|---|---|---|---|---|---|---|---|
| View outreach dashboard | Y | C | N | N | N | N | N | N |
| Create campaign | Y | C | N | N | N | N | N | N |
| Edit campaign | Y | C | N | N | N | N | N | N |
| Approve campaign | Y | C | N | N | N | N | N | N |
| Send campaign | Y | C | N | N | N | N | N | N |
| Manage contact lists | Y | C | N | N | N | N | N | N |
| View campaign metrics | Y | C | N | N | N | N | N | N |
| Schedule social posts | Y | C | N | N | N | N | N | N |
| Manage foster parent recruitment leads | Y | C | C | N | N | N | N | N |
| View recruiting pipeline | Y | C | C | N | N | N | N | N |

### Notes
- A dedicated outreach/recruiting role may eventually be useful.

---

## 17. Portal-Level Summary by Role

## 17.1 Administrator
Default access:
- full system access
- all modules
- user and role management
- permissions
- vendor controls
- reporting
- approvals

## 17.2 Manager / Supervisor
Default access:
- team oversight
- direct-report visibility
- selected approvals
- dashboards and reporting
- possible vendor/recruiting review functions

## 17.3 Worker / Case Worker
Default access:
- assigned child cases
- case records and updates
- schedule
- messages
- requests
- selected approvals
- paperwork/reimbursements
- limited vendor functions where operationally necessary

## 17.4 Placement Finder
Default access:
- placement matching
- placement search
- placement requests
- response review
- limited child and placement context

## 17.5 Resource Parent
Default access:
- children placed in their home
- messages
- requests
- vendor directory / marketplace
- approved records and resources
- placement request responses

## 17.6 Birth Parent
Default access:
- approved child information only
- visitation / call schedules
- message worker
- submit documents
- access support resources

## 17.7 Child / Youth
Default access:
- limited communication
- request submission if enabled
- selected schedule/resource visibility

## 17.8 Vendor
Default access:
- own vendor account
- onboarding tasks
- document upload
- offering management
- invoice workflows
- limited notifications

---

## 18. Recommended Special Rules

### 18.1 Separate sensitive permissions from general case access
Do not assume that access to a case automatically includes access to all records.

### 18.2 Separate approval authority from operational authority
A worker who can view a request should not automatically be able to approve it.

### 18.3 Use assignment-based visibility
Where possible, limit data to:
- assigned case
- linked child
- linked placement
- invited participant
- reviewer queue access

### 18.4 Use dual controls for highly sensitive actions
Examples:
- exporting reports
- sending emergency mass texts
- approving vendors
- approving invoices
- modifying permissions

### 18.5 Keep internal-only notes internal
Internal DHR notes should never be visible externally unless explicitly and intentionally shared.

---

## 19. Recommended Next Step

After this permission matrix, the best next deliverable is a **portal-by-portal sitemap or screen map** showing:
- what each role sees in navigation
- what appears on each dashboard
- how the core workflows move through the system

That will turn permissions into actual product structure.
