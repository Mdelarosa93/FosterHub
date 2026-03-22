# FosterHub QA Test Case Plan

## 1. Purpose

This document defines a QA test case plan for the FosterHub MVP.

The goal is to ensure the system is tested across:
- core workflows
- permissions and access control
- portal-specific experiences
- edge cases
- critical operational actions

This is not an exhaustive final QA suite, but it is a strong MVP-oriented testing plan.

---

## 2. Testing Objectives

The MVP should be validated for:
- functional correctness
- permission correctness
- workflow integrity
- data visibility boundaries
- usability of core portals
- auditability of sensitive actions
- stability of critical operations

The most important end-to-end flows to protect are:
1. user invitation and login
2. intake creation and assignment
3. case access and worker usage
4. parent login and child visibility
5. messaging between worker and resource parent
6. request submission and decisioning
7. placement request and response workflow
8. vendor invite, onboarding, and approval

---

## 3. Test Levels

### 3.1 Manual QA
Useful for:
- end-to-end workflows
- visual and UX checks
- permission boundary validation
- exploratory testing

### 3.2 Automated tests
Useful for:
- backend authorization rules
- API contract behavior
- regression on critical flows
- role/permission combinations
- workflow state transitions

### 3.3 Suggested balance for MVP
- automate critical backend logic and auth rules
- manually test portal experiences and key flows
- prioritize regression coverage around core workflows

---

## 4. Core Test User Personas

QA should use seeded users for at least:
- Administrator
- Manager
- Worker
- Placement Finder
- Resource Parent
- Vendor
- Unauthorized user / wrong-role user

Optional later:
- Birth Parent
- Child / Youth

---

## 5. Test Data Setup Requirements

QA should have stable seeded/sample data for:
- one organization
- multiple workers
- multiple cases
- at least one child with active placement
- at least one intake not yet converted to case
- at least two resource homes with different capacities/availability
- one vendor application in progress
- one approved vendor
- one pending request
- one approved request
- message threads with history

This is critical for consistent regression testing.

---

# 6. Functional Test Suites

# Suite A — Auth and User Access

## A1 — Admin invites a new user
**Preconditions:** Admin user logged in.

**Steps:**
1. Open user management.
2. Send invite to a new email.
3. Assign a role template.

**Expected Results:**
- Invite is created.
- Invite status is pending.
- Invite can be located in admin view.
- Email/send action is triggered or queued.

---

## A2 — Invited user accepts invite
**Preconditions:** Valid invite exists.

**Steps:**
1. Open invite link.
2. Set account credentials.
3. Submit invite acceptance.

**Expected Results:**
- Account is activated.
- Invite status changes appropriately.
- User can log in.

---

## A3 — Invalid login attempt
**Steps:**
1. Attempt login with invalid credentials.

**Expected Results:**
- Login fails.
- Clear but safe error message is shown.
- No session is created.

---

## A4 — Unauthorized route access blocked
**Preconditions:** User lacks permission for target route.

**Steps:**
1. Attempt to access restricted route directly.

**Expected Results:**
- Access is denied.
- User sees appropriate error/redirect.
- Backend returns forbidden/unauthorized response.

---

## A5 — Permission override changes effective access
**Preconditions:** User has role template assigned; admin can manage overrides.

**Steps:**
1. Admin adds permission override.
2. User refreshes or logs back in.
3. User tries newly granted/restricted action.

**Expected Results:**
- Effective access changes accordingly.
- UI and backend behavior match.

---

# Suite B — Case Core and Internal Access

## B1 — Create child record
**Preconditions:** Authorized internal user logged in.

**Steps:**
1. Open create child form.
2. Enter required fields.
3. Save.

**Expected Results:**
- Child record is created.
- Record appears in system.
- Validation works for missing required fields.

---

## B2 — Create case record
**Preconditions:** Child record exists.

**Steps:**
1. Create a case linked to the child.
2. Save case.

**Expected Results:**
- Case is created successfully.
- Unique case number rules are respected.
- Case appears in case list.

---

## B3 — Worker sees only assigned cases
**Preconditions:** Worker assigned to some but not all cases.

**Steps:**
1. Log in as worker.
2. Open case list.

**Expected Results:**
- Worker sees assigned cases only unless higher permission exists.
- Unassigned/restricted cases are not visible.

---

## B4 — Add case note
**Preconditions:** Authorized user on case detail.

**Steps:**
1. Add a note.
2. Save.

**Expected Results:**
- Note appears in notes/timeline.
- Timestamp and author are visible.
- Visibility rules are respected.

---

## B5 — Internal-only note hidden from parent
**Preconditions:** Case contains internal-only note; parent is linked to case.

**Steps:**
1. Log in as resource parent.
2. Open relevant child/case-related area.

**Expected Results:**
- Internal-only note is not visible.

---

# Suite C — Intake Workflow

## C1 — Create intake record
**Preconditions:** Authorized DHR/admin user logged in.

**Steps:**
1. Open intake queue.
2. Create a new intake.
3. Save.

**Expected Results:**
- Intake is created.
- Intake appears in queue.
- Default status is correct.

---

## C2 — Update intake details
**Steps:**
1. Open intake detail.
2. Fill in urgency, county, placement needs, and notes.
3. Save.

**Expected Results:**
- Intake detail persists.
- Intake detail view updates correctly.

---

## C3 — Assign worker and placement finder
**Steps:**
1. Open intake detail.
2. Assign worker.
3. Assign placement finder.

**Expected Results:**
- Assignments save successfully.
- Assigned users display correctly.
- Activity/history logs are created.

---

## C4 — Convert intake to case
**Preconditions:** Intake is valid for conversion.

**Steps:**
1. Trigger convert-to-case action.

**Expected Results:**
- Case is created/linked correctly.
- Intake status updates.
- Duplicate conversion is prevented.

---

# Suite D — Worker Portal

## D1 — Worker dashboard loads summary data
**Steps:**
1. Log in as worker.
2. Open dashboard.

**Expected Results:**
- Assigned case count appears.
- Messages count appears.
- Open requests appear.
- Upcoming appointments appear.

---

## D2 — Worker case filters work
**Steps:**
1. Open case list.
2. Apply status/search filters.

**Expected Results:**
- Results update correctly.
- Filtered records remain permission-scoped.

---

## D3 — Worker calendar displays appointments
**Preconditions:** Worker has seeded appointments.

**Steps:**
1. Open calendar.
2. Change date range/view.

**Expected Results:**
- Correct appointments display.
- Appointment detail is accessible.

---

# Suite E — Resource Parent Portal

## E1 — Parent dashboard shows linked children only
**Preconditions:** Parent linked to active placement/case.

**Steps:**
1. Log in as resource parent.
2. Open dashboard.

**Expected Results:**
- Parent sees only linked children.
- Unrelated children are not visible.

---

## E2 — Parent child detail shows approved info only
**Preconditions:** Child has both parent-visible and internal-only data.

**Steps:**
1. Open child detail.

**Expected Results:**
- Approved information is visible.
- Restricted/internal information is hidden.

---

## E3 — Parent resources page is accessible
**Steps:**
1. Open resources page.

**Expected Results:**
- Key contacts/resources display.
- Page is accessible from nav.

---

# Suite F — Messaging and Communication

## F1 — Parent sends message to worker
**Preconditions:** Parent and worker are linked through case/child.

**Steps:**
1. Log in as parent.
2. Open/create thread.
3. Send message.

**Expected Results:**
- Message is delivered and stored.
- Worker can see message in inbox.
- Parent can see sent message in thread.

---

## F2 — Worker replies to parent
**Steps:**
1. Log in as worker.
2. Open thread.
3. Reply.

**Expected Results:**
- Reply appears in thread.
- Parent sees unread/update state.

---

## F3 — Unauthorized user cannot access thread
**Preconditions:** User is not a participant and lacks elevated rights.

**Steps:**
1. Attempt to access thread directly.

**Expected Results:**
- Access is denied.
- No thread data leaks.

---

## F4 — Inbox unread count updates
**Steps:**
1. Send a new message to user.
2. Check unread count.
3. Open thread/read message.

**Expected Results:**
- Unread count increments on new message.
- Unread count decrements or updates after read.

---

# Suite G — Requests and Approvals

## G1 — Parent creates request draft
**Steps:**
1. Log in as resource parent.
2. Open new request form.
3. Save as draft.

**Expected Results:**
- Draft is saved.
- Draft remains editable.
- Draft does not appear in active review queue unless submitted.

---

## G2 — Parent submits request
**Steps:**
1. Complete request form.
2. Submit.

**Expected Results:**
- Request status becomes submitted or equivalent.
- Request appears in correct review queue.
- Submitter can see request status.

---

## G3 — Reviewer approves request
**Preconditions:** Request is pending review.

**Steps:**
1. Log in as reviewer.
2. Open request.
3. Approve.

**Expected Results:**
- Decision is recorded.
- Status updates appropriately.
- Submitter sees updated status.

---

## G4 — Reviewer denies request with reason
**Steps:**
1. Open request.
2. Deny with reason.

**Expected Results:**
- Reason is stored.
- Status updates to denied.
- Submitter can see denial outcome.

---

## G5 — Reviewer requests more information
**Steps:**
1. Open request.
2. Use needs-more-info action.

**Expected Results:**
- Status updates appropriately.
- Submitter can see request for more information.

---

## G6 — Request attachments respect visibility
**Steps:**
1. Attach file to request.
2. Open request as authorized reviewer.
3. Attempt open as unauthorized user.

**Expected Results:**
- Authorized user can view file.
- Unauthorized user cannot access file.

---

# Suite H — Placement Workflow

## H1 — Create resource home
**Steps:**
1. Log in as DHR/admin.
2. Create resource home record.
3. Save capacity and availability.

**Expected Results:**
- Home record is saved.
- Capacity and availability values are retained.

---

## H2 — Start placement search
**Preconditions:** Case/intake eligible for placement search.

**Steps:**
1. Create placement search.
2. Save criteria.

**Expected Results:**
- Placement search is created.
- Search status is active.

---

## H3 — Generate/filter eligible homes
**Steps:**
1. Open placement search.
2. Apply criteria/filters.

**Expected Results:**
- Matching homes display.
- Homes outside requirements are excluded.

---

## H4 — Send placement request
**Steps:**
1. Select homes.
2. Send placement request.

**Expected Results:**
- Request is created and marked sent.
- Recipients are recorded once each.
- Parent recipients can access request.

---

## H5 — Resource parent responds to placement request
**Steps:**
1. Log in as resource parent.
2. Open placement request.
3. Respond interested/unavailable/etc.

**Expected Results:**
- Response is stored.
- Response timestamp is recorded.
- Placement staff can see response.

---

## H6 — Record placement outcome
**Steps:**
1. Select final home.
2. Record placement.

**Expected Results:**
- Placement record is created.
- Child/case becomes linked to selected resource home.
- Parent portal access reflects active placement.

---

# Suite I — Vendor Onboarding

## I1 — DHR invites vendor
**Steps:**
1. Log in as DHR/admin.
2. Create vendor/invite.

**Expected Results:**
- Vendor invitation is created.
- Vendor can access invite flow.

---

## I2 — Vendor completes onboarding checklist
**Steps:**
1. Log in as vendor.
2. Open onboarding.
3. Upload required documents.

**Expected Results:**
- Submissions are stored.
- Checklist reflects progress.
- Missing items remain visible.

---

## I3 — Reviewer approves vendor
**Preconditions:** Vendor submission exists.

**Steps:**
1. Log in as DHR reviewer.
2. Open vendor application.
3. Approve vendor.
4. Set visibility.

**Expected Results:**
- Application decision is recorded.
- Vendor status updates.
- Visibility is stored.

---

## I4 — Parent sees only public approved vendors
**Preconditions:** At least one public and one private vendor exist.

**Steps:**
1. Log in as resource parent.
2. Open vendor directory.

**Expected Results:**
- Public approved vendors are visible.
- Private/internal vendors are hidden.

---

# Suite J — Documents and File Handling

## J1 — Upload document to case
**Steps:**
1. Log in as worker.
2. Upload file to case.

**Expected Results:**
- File uploads successfully.
- Metadata is stored.
- Document appears in linked area.

---

## J2 — Upload invalid file type or oversized file
**Steps:**
1. Attempt invalid upload.

**Expected Results:**
- Upload is rejected safely.
- Clear error message is shown.

---

## J3 — Secure document download
**Preconditions:** Restricted document exists.

**Steps:**
1. Download as authorized user.
2. Attempt download as unauthorized user.

**Expected Results:**
- Authorized user succeeds.
- Unauthorized user is blocked.

---

# Suite K — Dashboards and Reporting Basics

## K1 — Admin dashboard summary counts
**Steps:**
1. Log in as admin.
2. Open dashboard.

**Expected Results:**
- Summary counts load.
- Counts align with seeded data.
- No restricted-tenant data appears.

---

## K2 — Worker dashboard summary counts
**Steps:**
1. Log in as worker.
2. Open dashboard.

**Expected Results:**
- Only worker-relevant counts/data appear.
- Counts align with cases/messages/requests assigned to worker.

---

# Suite L — Auditability and Safety

## L1 — Permission change creates audit log
**Steps:**
1. Admin changes a user permission.
2. Open audit view or verify audit record.

**Expected Results:**
- Audit entry exists.
- Entry includes actor, action, target, and timestamp.

---

## L2 — Request approval creates audit trail
**Steps:**
1. Approve a request.
2. Verify audit/history.

**Expected Results:**
- Decision is recorded in workflow history.
- Audit trail exists where required.

---

## L3 — Placement decision creates audit trail
**Steps:**
1. Record a placement.
2. Verify logs/history.

**Expected Results:**
- Placement action is captured in system history/audit.

---

# 7. Negative and Edge Case Coverage

The MVP should also explicitly test:
- duplicate invite acceptance
- expired invite token use
- invalid permission override combinations
- request submission with missing required fields
- placement request sent with no recipients selected
- resource parent responding to expired placement request
- vendor submission missing required file
- document access via guessed URL
- unauthorized thread access
- race condition around intake conversion to case
- duplicate placement creation for same active scenario

---

# 8. Regression Priority Matrix

## P0 — must pass every release
- login/auth
- permissions/access control
- intake creation
- case visibility
- parent visibility boundaries
- messaging send/receive
- request submit/review/decision
- placement request/response
- vendor onboarding approval
- secure document access

## P1 — should pass every release
- dashboards
- filters/search
- audit logging
- file upload validation
- status transition correctness

## P2 — lower priority for every build, but still important
- UI polish issues
- non-critical empty states
- minor sorting/display inconsistencies

---

# 9. Suggested Automation Priorities

Automate first:
- auth/login/logout
- backend permission guards
- case visibility filtering
- request state transitions
- placement request response state handling
- vendor approval state changes
- secure document access

Manual-first:
- dashboard layout checks
- portal UX validation
- multi-step exploratory testing
- visual consistency

---

# 10. Exit Criteria for MVP QA Signoff

The MVP is QA-ready for pilot when:
- all P0 tests pass
- no critical permission leaks exist
- no critical workflow blockers exist
- seeded demo/test data supports end-to-end validation
- major portals can be exercised without blocker bugs
- auditability exists for key sensitive actions

---

# 11. Final Recommendation

The most important QA principle for FosterHub is:
**test permissions and workflow transitions as seriously as features themselves.**

For a system like this, the biggest failures are not just broken buttons — they are:
- the wrong person seeing the wrong data
- a workflow getting stuck
- a placement/request/vendor process losing state
- an action happening without an audit trail

That is where QA should focus hardest.
