# FosterHub Database Schema Draft

## 1. Purpose

This document translates the FosterHub data/entity model into a practical starter database schema draft.

It is intended to define:
- core tables
- major columns
- key relationships
- suggested enums/statuses
- MVP-first structure

This is not final migration code, but it is close enough to guide backend implementation.

---

## 2. Database Recommendation

### Primary database
- PostgreSQL

### General conventions
- use `uuid` primary keys for most tables
- use `created_at` and `updated_at` timestamps broadly
- include `organization_id` on tenant-scoped records
- prefer explicit foreign keys
- use soft deletion only where operationally necessary
- use JSONB only where flexibility is truly needed

---

## 3. Schema Domains

The schema is organized into:
1. Identity & Access
2. Case Core
3. Intake & Assignment
4. Placement
5. Messaging
6. Requests & Approvals
7. Scheduling
8. Vendor Management
9. Financial
10. Outreach / Recruitment
11. Audit / Reporting Support

---

# 4. Identity & Access Tables

## 4.1 organizations
```sql
organizations (
  id uuid pk,
  name text not null,
  timezone text,
  settings_json jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 4.2 users
```sql
users (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  first_name text not null,
  last_name text not null,
  email text unique,
  phone text,
  password_hash text,
  status text not null, -- invited, active, suspended, disabled
  profile_photo_url text,
  last_login_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

### Indexes
- index on `organization_id`
- unique index on `(organization_id, email)` if multi-tenant email uniqueness is preferred over global uniqueness

## 4.3 teams
```sql
teams (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  name text not null,
  manager_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 4.4 role_templates
```sql
role_templates (
  id uuid pk,
  organization_id uuid fk -> organizations.id,
  name text not null,
  description text,
  is_system_default boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 4.5 permissions
```sql
permissions (
  id uuid pk,
  key text not null unique,
  label text not null,
  category text not null,
  description text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 4.6 role_template_permissions
```sql
role_template_permissions (
  id uuid pk,
  role_template_id uuid not null fk -> role_templates.id,
  permission_id uuid not null fk -> permissions.id,
  access_level text not null, -- allowed, denied, limited, configurable
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(role_template_id, permission_id)
)
```

## 4.7 user_role_assignments
```sql
user_role_assignments (
  id uuid pk,
  user_id uuid not null fk -> users.id,
  role_template_id uuid not null fk -> role_templates.id,
  assigned_by_user_id uuid fk -> users.id,
  active boolean not null default true,
  assigned_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 4.8 user_permission_overrides
```sql
user_permission_overrides (
  id uuid pk,
  user_id uuid not null fk -> users.id,
  permission_id uuid not null fk -> permissions.id,
  override_value text not null, -- allowed, denied, limited
  reason text,
  created_by_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(user_id, permission_id)
)
```

---

# 5. Case Core Tables

## 5.1 children
```sql
children (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  first_name text not null,
  last_name text,
  preferred_name text,
  date_of_birth date,
  gender text,
  external_reference text,
  status text not null, -- active, inactive, archived
  county text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 5.2 cases
```sql
cases (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  child_id uuid not null fk -> children.id,
  case_number text not null,
  status text not null, -- open, pending, closed, archived
  team_id uuid fk -> teams.id,
  primary_worker_user_id uuid fk -> users.id,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(organization_id, case_number)
)
```

## 5.3 case_assignments
```sql
case_assignments (
  id uuid pk,
  case_id uuid not null fk -> cases.id,
  user_id uuid not null fk -> users.id,
  assignment_type text not null, -- primary_worker, supervisor, placement_finder, secondary_worker
  active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 5.4 case_participants
```sql
case_participants (
  id uuid pk,
  case_id uuid not null fk -> cases.id,
  user_id uuid not null fk -> users.id,
  participant_type text not null, -- birth_parent, resource_parent, child, gal, attorney, casa, other
  relationship_label text,
  access_scope_json jsonb,
  invited_at timestamptz,
  accepted_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 5.5 contacts
```sql
contacts (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  relationship_type text,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 5.6 case_contacts
```sql
case_contacts (
  id uuid pk,
  case_id uuid not null fk -> cases.id,
  contact_id uuid not null fk -> contacts.id,
  role_label text,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(case_id, contact_id)
)
```

## 5.7 documents
```sql
documents (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  file_name text not null,
  storage_key text not null,
  mime_type text,
  byte_size bigint,
  uploaded_by_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 5.8 document_links
```sql
document_links (
  id uuid pk,
  document_id uuid not null fk -> documents.id,
  entity_type text not null,
  entity_id uuid not null,
  category text,
  visibility_scope text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

### Suggested entity_type examples
- child
- case
- request
- vendor_application
- vendor_submission
- appointment
- message

## 5.9 notes
```sql
notes (
  id uuid pk,
  case_id uuid not null fk -> cases.id,
  author_user_id uuid not null fk -> users.id,
  note_type text,
  content text not null,
  visibility_scope text not null, -- internal, limited, shared
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 5.10 activity_events
```sql
activity_events (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  actor_user_id uuid fk -> users.id,
  metadata_json jsonb,
  created_at timestamptz not null
)
```

---

# 6. Intake & Assignment Tables

## 6.1 intake_records
```sql
intake_records (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  child_id uuid fk -> children.id,
  intake_status text not null, -- draft, in_review, ready_for_assignment, placement_search_active, matched, placed, closed
  urgency_level text,
  county text,
  summary text,
  created_by_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 6.2 intake_details
```sql
intake_details (
  id uuid pk,
  intake_record_id uuid not null fk -> intake_records.id,
  legal_status text,
  sibling_group_info text,
  placement_needs_json jsonb,
  medical_summary text,
  behavioral_summary text,
  school_info text,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(intake_record_id)
)
```

## 6.3 participant_invites
```sql
participant_invites (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  case_id uuid fk -> cases.id,
  invitee_email text,
  invitee_phone text,
  participant_type text not null,
  invited_by_user_id uuid fk -> users.id,
  status text not null, -- pending, accepted, expired, revoked
  invite_token text not null unique,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 7. Placement Tables

## 7.1 resource_homes
```sql
resource_homes (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  primary_user_id uuid fk -> users.id,
  status text not null, -- active, inactive, suspended, pending
  home_type text, -- foster, adoptive, kinship, other
  county text,
  address_summary text,
  capacity_max integer,
  capacity_current integer,
  accepting_placements boolean not null default true,
  accepting_emergency_placements boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 7.2 resource_home_preferences
```sql
resource_home_preferences (
  id uuid pk,
  resource_home_id uuid not null fk -> resource_homes.id,
  age_min integer,
  age_max integer,
  gender_preferences_json jsonb,
  sibling_capacity integer,
  special_needs_capabilities_json jsonb,
  restriction_notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(resource_home_id)
)
```

## 7.3 placement_searches
```sql
placement_searches (
  id uuid pk,
  case_id uuid not null fk -> cases.id,
  initiated_by_user_id uuid fk -> users.id,
  status text not null, -- active, paused, completed, cancelled
  urgency_level text,
  criteria_json jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 7.4 placement_matches
```sql
placement_matches (
  id uuid pk,
  placement_search_id uuid not null fk -> placement_searches.id,
  resource_home_id uuid not null fk -> resource_homes.id,
  match_reason_json jsonb,
  match_score numeric,
  status text not null, -- suggested, contacted, shortlisted, selected, rejected
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(placement_search_id, resource_home_id)
)
```

## 7.5 placement_requests
```sql
placement_requests (
  id uuid pk,
  placement_search_id uuid not null fk -> placement_searches.id,
  created_by_user_id uuid fk -> users.id,
  request_message text,
  status text not null, -- draft, sent, closed, expired
  sent_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 7.6 placement_request_recipients
```sql
placement_request_recipients (
  id uuid pk,
  placement_request_id uuid not null fk -> placement_requests.id,
  resource_home_id uuid not null fk -> resource_homes.id,
  delivery_status text,
  response_status text, -- interested, need_more_info, unavailable, declined, no_response
  response_notes text,
  responded_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(placement_request_id, resource_home_id)
)
```

## 7.7 placements
```sql
placements (
  id uuid pk,
  case_id uuid not null fk -> cases.id,
  resource_home_id uuid not null fk -> resource_homes.id,
  placement_type text,
  start_date date not null,
  end_date date,
  status text not null, -- active, ended, pending
  selected_by_user_id uuid fk -> users.id,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 8. Messaging Tables

## 8.1 conversation_threads
```sql
conversation_threads (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  case_id uuid fk -> cases.id,
  thread_type text not null, -- direct_message, case_thread, request_thread, vendor_thread
  subject text,
  created_by_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 8.2 conversation_participants
```sql
conversation_participants (
  id uuid pk,
  thread_id uuid not null fk -> conversation_threads.id,
  user_id uuid not null fk -> users.id,
  role_in_thread text,
  joined_at timestamptz not null,
  left_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(thread_id, user_id)
)
```

## 8.3 messages
```sql
messages (
  id uuid pk,
  thread_id uuid not null fk -> conversation_threads.id,
  sender_user_id uuid not null fk -> users.id,
  body text not null,
  message_type text,
  metadata_json jsonb,
  sent_at timestamptz not null,
  edited_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 8.4 message_attachments
```sql
message_attachments (
  id uuid pk,
  message_id uuid not null fk -> messages.id,
  document_id uuid not null fk -> documents.id,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(message_id, document_id)
)
```

## 8.5 broadcast_campaigns
```sql
broadcast_campaigns (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  campaign_type text not null, -- emergency, placement_request, urgent_notice, general
  created_by_user_id uuid fk -> users.id,
  audience_filter_json jsonb,
  message_body text not null,
  status text not null, -- draft, scheduled, sent, cancelled
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 8.6 broadcast_recipients
```sql
broadcast_recipients (
  id uuid pk,
  broadcast_campaign_id uuid not null fk -> broadcast_campaigns.id,
  user_id uuid not null fk -> users.id,
  delivery_status text,
  delivered_at timestamptz,
  opened_at timestamptz,
  response_value text,
  responded_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(broadcast_campaign_id, user_id)
)
```

---

# 9. Requests & Approvals Tables

## 9.1 requests
```sql
requests (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  case_id uuid fk -> cases.id,
  child_id uuid fk -> children.id,
  submitted_by_user_id uuid fk -> users.id,
  request_type text not null,
  status text not null, -- draft, submitted, needs_more_info, under_review, pending_approval, approved, denied, completed
  priority text,
  summary text,
  description text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 9.2 request_participants
```sql
request_participants (
  id uuid pk,
  request_id uuid not null fk -> requests.id,
  user_id uuid not null fk -> users.id,
  participant_role text not null, -- submitter, reviewer, approver, assigned_worker, observer
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(request_id, user_id, participant_role)
)
```

## 9.3 request_decisions
```sql
request_decisions (
  id uuid pk,
  request_id uuid not null fk -> requests.id,
  decided_by_user_id uuid fk -> users.id,
  decision_type text not null, -- approved, denied, needs_more_info, reassigned, completed
  reason_code text,
  notes text,
  decided_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 9.4 request_comments
```sql
request_comments (
  id uuid pk,
  request_id uuid not null fk -> requests.id,
  author_user_id uuid not null fk -> users.id,
  body text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 10. Scheduling Tables

## 10.1 appointments
```sql
appointments (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  case_id uuid fk -> cases.id,
  child_id uuid fk -> children.id,
  appointment_type text not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  status text not null, -- scheduled, completed, cancelled, rescheduled
  created_by_user_id uuid fk -> users.id,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 10.2 appointment_participants
```sql
appointment_participants (
  id uuid pk,
  appointment_id uuid not null fk -> appointments.id,
  user_id uuid fk -> users.id,
  participant_type text,
  attendance_status text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 11. Vendor Management Tables

## 11.1 vendors
```sql
vendors (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  legal_name text not null,
  dba_name text,
  status text not null, -- applicant, approved, approved_with_conditions, active, suspended, inactive, rejected
  visibility text not null, -- private, public
  category text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 11.2 vendor_contacts
```sql
vendor_contacts (
  id uuid pk,
  vendor_id uuid not null fk -> vendors.id,
  user_id uuid fk -> users.id,
  first_name text,
  last_name text,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 11.3 vendor_applications
```sql
vendor_applications (
  id uuid pk,
  vendor_id uuid not null fk -> vendors.id,
  intake_source text not null, -- dhr_invite, parent_recommendation, self_registration
  status text not null, -- draft, submitted, under_review, needs_more_info, approved, denied, withdrawn
  submitted_at timestamptz,
  reviewed_by_user_id uuid fk -> users.id,
  reviewed_at timestamptz,
  decision_notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 11.4 vendor_requirements
```sql
vendor_requirements (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  name text not null,
  category text,
  required boolean not null default true,
  renewal_required boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 11.5 vendor_submissions
```sql
vendor_submissions (
  id uuid pk,
  vendor_application_id uuid not null fk -> vendor_applications.id,
  vendor_requirement_id uuid not null fk -> vendor_requirements.id,
  document_id uuid fk -> documents.id,
  status text not null, -- pending, accepted, rejected, needs_resubmission
  reviewer_user_id uuid fk -> users.id,
  reviewer_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 11.6 vendor_recommendations
```sql
vendor_recommendations (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  recommended_by_user_id uuid fk -> users.id,
  vendor_name_submitted text not null,
  contact_info_json jsonb,
  case_id uuid fk -> cases.id,
  status text not null, -- submitted, under_review, approved_for_outreach, denied, converted
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 11.7 vendor_offerings
```sql
vendor_offerings (
  id uuid pk,
  vendor_id uuid not null fk -> vendors.id,
  title text not null,
  description text,
  category text,
  pricing_model text,
  price_amount numeric,
  status text not null, -- draft, active, inactive
  visibility text not null, -- private, public
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 12. Financial Tables

## 12.1 invoices
```sql
invoices (
  id uuid pk,
  vendor_id uuid not null fk -> vendors.id,
  case_id uuid fk -> cases.id,
  child_id uuid fk -> children.id,
  linked_request_id uuid fk -> requests.id,
  invoice_number text,
  amount numeric not null,
  status text not null, -- draft, submitted, under_review, approved, denied, paid
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 12.2 invoice_line_items
```sql
invoice_line_items (
  id uuid pk,
  invoice_id uuid not null fk -> invoices.id,
  description text not null,
  quantity numeric,
  unit_price numeric,
  total_amount numeric not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 12.3 invoice_decisions
```sql
invoice_decisions (
  id uuid pk,
  invoice_id uuid not null fk -> invoices.id,
  decided_by_user_id uuid fk -> users.id,
  decision_type text not null, -- approved, denied, needs_more_info, verified, paid
  notes text,
  decided_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 12.4 reimbursements
```sql
reimbursements (
  id uuid pk,
  submitted_by_user_id uuid not null fk -> users.id,
  reimbursement_type text not null,
  amount numeric not null,
  status text not null, -- draft, submitted, under_review, approved, denied, paid
  notes text,
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 13. Outreach / Recruitment Tables

## 13.1 recruitment_leads
```sql
recruitment_leads (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  lead_type text not null, -- foster_parent, vendor, employee
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  status text not null, -- new, contacted, in_progress, qualified, converted, denied, withdrawn
  assigned_to_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 13.2 recruitment_activities
```sql
recruitment_activities (
  id uuid pk,
  recruitment_lead_id uuid not null fk -> recruitment_leads.id,
  activity_type text not null,
  performed_by_user_id uuid fk -> users.id,
  notes text,
  occurred_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 13.3 campaigns
```sql
campaigns (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  campaign_type text not null,
  name text not null,
  status text not null, -- draft, scheduled, active, sent, archived
  audience_definition_json jsonb,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by_user_id uuid fk -> users.id,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 13.4 campaign_metrics
```sql
campaign_metrics (
  id uuid pk,
  campaign_id uuid not null fk -> campaigns.id,
  metric_type text not null,
  metric_value numeric not null,
  measured_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

---

# 14. Audit / Reporting Support Tables

## 14.1 metric_snapshots
```sql
metric_snapshots (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  metric_scope text not null,
  metric_name text not null,
  metric_value numeric not null,
  dimension_json jsonb,
  snapshot_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 14.2 saved_views
```sql
saved_views (
  id uuid pk,
  user_id uuid not null fk -> users.id,
  entity_type text not null,
  name text not null,
  filter_json jsonb not null,
  is_shared boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

## 14.3 audit_logs
```sql
audit_logs (
  id uuid pk,
  organization_id uuid not null fk -> organizations.id,
  actor_user_id uuid fk -> users.id,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata_json jsonb,
  ip_address inet,
  created_at timestamptz not null
)
```

---

# 15. Suggested Enums / Controlled Values

These may start as text columns in MVP and later become stricter enums or lookup tables.

### User statuses
- invited
- active
- suspended
- disabled

### Case statuses
- open
- pending
- closed
- archived

### Intake statuses
- draft
- in_review
- ready_for_assignment
- placement_search_active
- matched
- placed
- closed

### Request statuses
- draft
- submitted
- needs_more_info
- under_review
- pending_approval
- approved
- denied
- completed

### Vendor statuses
- applicant
- approved
- approved_with_conditions
- active
- suspended
- inactive
- rejected

### Vendor visibility
- private
- public

### Placement response statuses
- interested
- need_more_info
- unavailable
- declined
- no_response

---

# 16. MVP Table Recommendation

If implementation must stay tight, these are the tables most critical for MVP:

## MVP foundation
- organizations
- users
- teams
- role_templates
- permissions
- role_template_permissions
- user_role_assignments
- user_permission_overrides

## MVP case core
- children
- cases
- case_assignments
- case_participants
- documents
- document_links
- notes
- activity_events

## MVP intake / placement
- intake_records
- intake_details
- participant_invites
- resource_homes
- resource_home_preferences
- placement_searches
- placement_requests
- placement_request_recipients
- placements

## MVP workflow
- conversation_threads
- conversation_participants
- messages
- requests
- request_participants
- request_decisions
- request_comments
- appointments
- appointment_participants

## MVP vendor basics
- vendors
- vendor_contacts
- vendor_applications
- vendor_requirements
- vendor_submissions

---

# 17. Phase 2 / Later Tables

These can likely wait until the core system is working well:
- broadcast_campaigns
- broadcast_recipients
- vendor_recommendations
- vendor_offerings
- invoices
- invoice_line_items
- invoice_decisions
- reimbursements
- recruitment_leads
- recruitment_activities
- campaigns
- campaign_metrics
- metric_snapshots
- saved_views
- expanded audit helpers

---

# 18. Key Schema Notes

## 18.1 Multi-tenant discipline
Tenant scoping must be enforced consistently. Any table tied to an organization should either:
- store `organization_id` directly
- or be reachable only through tenant-scoped parent relationships

## 18.2 Polymorphic document linking
`document_links` keeps file handling flexible without creating many tiny join tables.

## 18.3 Permission flexibility
The combination of:
- role_templates
- role_template_permissions
- user_role_assignments
- user_permission_overrides

supports the HubSpot-style permission model discussed earlier.

## 18.4 Workflow history
Separate history/decision tables help preserve auditability and avoid overwriting key workflow events.

---

# 19. Final Recommendation

This schema draft should be implemented in stages:

## Stage 1
- auth / users / permissions
- children / cases / assignments
- documents / notes / activity

## Stage 2
- intake / placement workflows
- messaging
- requests / approvals
- appointments

## Stage 3
- vendor onboarding
- expanded financials
- outreach / recruiting
- analytics / optimization

That sequencing keeps the database aligned with the product roadmap and avoids overbuilding too early.
