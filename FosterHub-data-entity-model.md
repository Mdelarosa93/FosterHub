# FosterHub Data / Entity Model

## 1. Purpose

This document defines a starter data and entity model for FosterHub.

The goal is to identify:
- the major entities in the system
- how they relate to one another
- what key fields each entity may need
- which entities are foundational for MVP vs later phases

This is a product/data architecture outline, not a final database schema.

---

## 2. Modeling Principles

### 2.1 Shared platform, role-specific views
FosterHub should use a shared data foundation while presenting different information to different users based on permissions.

### 2.2 Separate identity from role and access
A user account is not the same thing as:
- a role template
- a permission override
- a case participant relationship

### 2.3 Separate workflow records from master records
Examples:
- a **Vendor** is not the same as a **Vendor Application**
- a **Child** is not the same as an **Intake Record**
- a **Request** is not the same as an **Approval Decision**

### 2.4 Prefer explicit relationships
Instead of hiding relationships in flags, model them directly.
For example:
- child assigned to worker
- child placed in resource home
- user invited as participant on case

### 2.5 Preserve history
Many objects should support timelines, versions, or activity records.

---

## 3. Core Domain Areas

The FosterHub data model is easiest to understand in domains:

1. Identity and Access
2. Child / Case Management
3. Intake and Assignment
4. Placement Matching
5. Messaging and Communications
6. Requests and Approvals
7. Vendor Management
8. Financial / Invoice Workflows
9. Outreach / Recruitment
10. Reporting / Activity Tracking

---

# 4. Identity and Access Domain

## 4.1 User
Represents a system login/account.

### Key fields
- id
- organization_id
- first_name
- last_name
- email
- phone
- status
- last_login_at
- profile_photo_url
- created_at
- updated_at

### Notes
A user may be:
- a DHR staff member
- a foster/resource parent
- a birth parent
- a youth user
- a vendor contact

---

## 4.2 RoleTemplate
Represents a default role configuration.

### Examples
- Administrator
- Manager
- Worker
- Placement Finder
- Resource Parent
- Birth Parent
- Child / Youth
- Vendor

### Key fields
- id
- organization_id (nullable if system default)
- name
- description
- is_system_default
- created_at
- updated_at

---

## 4.3 Permission
Represents an individual system permission.

### Examples
- view_assigned_cases
- approve_vendor
- send_broadcast
- edit_permissions

### Key fields
- id
- key
- label
- category
- description

---

## 4.4 RoleTemplatePermission
Join table between role templates and permissions.

### Key fields
- id
- role_template_id
- permission_id
- access_level

### Notes
Access level might support values like:
- allowed
- denied
- limited
- configurable

---

## 4.5 UserRoleAssignment
Assigns one or more role templates to a user.

### Key fields
- id
- user_id
- role_template_id
- assigned_by_user_id
- assigned_at
- active

---

## 4.6 UserPermissionOverride
Supports HubSpot-style per-user permission customization.

### Key fields
- id
- user_id
- permission_id
- override_value
- reason
- created_by_user_id
- created_at

---

## 4.7 Organization
Represents the DHR organization / tenant.

### Key fields
- id
- name
- timezone
- default_settings_json
- created_at
- updated_at

---

## 4.8 Team
Represents a staff team/unit.

### Key fields
- id
- organization_id
- name
- manager_user_id
- created_at
- updated_at

---

---

# 5. Child / Case Management Domain

## 5.1 Child
Represents the child/youth as a core person record.

### Key fields
- id
- organization_id
- first_name
- last_name
- preferred_name
- date_of_birth
- gender
- case_reference_number
- status
- region / county
- created_at
- updated_at

### Notes
Child should be distinct from case and from intake.
A child may have one or more case-related records over time depending on final system design.

---

## 5.2 Case
Represents an active operational case tied to a child.

### Key fields
- id
- organization_id
- child_id
- case_number
- status
- primary_worker_user_id
- team_id
- opened_at
- closed_at
- created_at
- updated_at

### Notes
This should be the main operational record for casework.

---

## 5.3 CaseAssignment
Represents internal role assignments on a case.

### Examples
- primary worker
- supervisor
- placement finder
- secondary worker

### Key fields
- id
- case_id
- user_id
- assignment_type
- start_at
- end_at
- active

---

## 5.4 CaseParticipant
Represents non-staff or participant relationships to a case.

### Examples
- birth parent
- resource parent
- child/youth login
- GAL
- attorney
- CASA
- vendor contact if needed

### Key fields
- id
- case_id
- user_id
- participant_type
- relationship_label
- access_scope_json
- invited_at
- accepted_at
- active

---

## 5.5 Contact
Represents a person/contact associated with a child or case but not necessarily a portal user yet.

### Key fields
- id
- organization_id
- first_name
- last_name
- phone
- email
- relationship_type
- notes

---

## 5.6 CaseContact
Links a contact to a case.

### Key fields
- id
- case_id
- contact_id
- role_label
- active

---

## 5.7 Document
Represents a stored file or document.

### Key fields
- id
- organization_id
- file_name
- storage_path
- mime_type
- uploaded_by_user_id
- created_at

### Notes
This should be generic so it can attach to many entity types.

---

## 5.8 DocumentLink
Polymorphic link between a document and another entity.

### Examples
- document attached to child
- document attached to case
- document attached to request
- document attached to vendor application

### Key fields
- id
- document_id
- entity_type
- entity_id
- category
- visibility_scope

---

## 5.9 Note
Represents structured notes / timeline entries.

### Key fields
- id
- case_id
- author_user_id
- note_type
- content
- visibility_scope
- created_at

---

## 5.10 ActivityEvent
Generic timeline/audit event.

### Examples
- request submitted
- placement request sent
- vendor approved
- document uploaded

### Key fields
- id
- organization_id
- entity_type
- entity_id
- event_type
- actor_user_id
- metadata_json
- created_at

---

---

# 6. Intake and Assignment Domain

## 6.1 IntakeRecord
Represents the onboarding process for a new child/case entering the system.

### Key fields
- id
- organization_id
- child_id (nullable until finalized)
- intake_status
- urgency_level
- county
- summary
- created_by_user_id
- created_at
- updated_at

---

## 6.2 IntakeDetail
Stores structured intake information that may not belong on the core child record.

### Key fields
- id
- intake_record_id
- legal_status
- sibling_group_info
- placement_needs_json
- medical_summary
- behavioral_summary
- school_info
- notes

---

## 6.3 ParticipantInvite
Represents an invitation sent to an external participant.

### Key fields
- id
- organization_id
- case_id
- invitee_email
- invitee_phone
- participant_type
- invited_by_user_id
- status
- token
- expires_at
- accepted_at

---

---

# 7. Placement Matching Domain

## 7.1 ResourceHome
Represents an approved foster / adoptive / kinship household.

### Key fields
- id
- organization_id
- primary_user_id
- status
- home_type
- county
- address_summary
- capacity_max
- capacity_current
- accepting_placements
- accepting_emergency_placements
- created_at
- updated_at

---

## 7.2 ResourceHomePreference
Stores household placement preferences or limitations.

### Key fields
- id
- resource_home_id
- age_min
- age_max
- gender_preferences_json
- sibling_capacity
- special_needs_capabilities_json
- restriction_notes

---

## 7.3 PlacementSearch
Represents an active placement effort for a case.

### Key fields
- id
- case_id
- initiated_by_user_id
- status
- urgency_level
- criteria_json
- created_at
- updated_at

---

## 7.4 PlacementMatch
Represents a potential match between a case/child and a resource home.

### Key fields
- id
- placement_search_id
- resource_home_id
- match_reason_json
- match_score (optional later)
- status
- created_at
- updated_at

---

## 7.5 PlacementRequest
Represents outreach sent to one or more homes.

### Key fields
- id
- placement_search_id
- created_by_user_id
- request_message
- sent_at
- expires_at
- status

---

## 7.6 PlacementRequestRecipient
Tracks which homes received a placement request.

### Key fields
- id
- placement_request_id
- resource_home_id
- delivery_status
- responded_at
- response_status
- response_notes

### Response examples
- interested
- need_more_info
- unavailable
- declined

---

## 7.7 Placement
Represents the actual placement decision/outcome.

### Key fields
- id
- case_id
- resource_home_id
- placement_type
- start_date
- end_date
- status
- selected_by_user_id
- notes

---

---

# 8. Messaging and Communications Domain

## 8.1 ConversationThread
Represents a message thread.

### Key fields
- id
- organization_id
- case_id (nullable)
- thread_type
- subject
- created_by_user_id
- created_at

### Thread type examples
- direct_message
- case_thread
- request_thread
- vendor_thread

---

## 8.2 ConversationParticipant
Links users to a thread.

### Key fields
- id
- thread_id
- user_id
- joined_at
- left_at
- role_in_thread

---

## 8.3 Message
Represents an individual message.

### Key fields
- id
- thread_id
- sender_user_id
- body
- sent_at
- edited_at
- message_type
- metadata_json

---

## 8.4 MessageAttachment
Links documents/files to messages.

### Key fields
- id
- message_id
- document_id

---

## 8.5 BroadcastCampaign
Represents a mass messaging event.

### Examples
- emergency text
- placement broadcast
- urgent notice

### Key fields
- id
- organization_id
- campaign_type
- created_by_user_id
- audience_filter_json
- message_body
- status
- scheduled_at
- sent_at

---

## 8.6 BroadcastRecipient
Tracks broadcast delivery and response.

### Key fields
- id
- broadcast_campaign_id
- user_id
- delivery_status
- delivered_at
- opened_at
- response_value
- responded_at

---

---

# 9. Requests and Approvals Domain

## 9.1 Request
Represents a structured request in the system.

### Examples
- service request
- reimbursement request
- approval request
- support request
- activity request

### Key fields
- id
- organization_id
- case_id
- child_id
- submitted_by_user_id
- request_type
- status
- priority
- summary
- description
- created_at
- updated_at

---

## 9.2 RequestParticipant
Tracks users involved in a request.

### Examples
- submitter
- approver
- reviewer
- assigned worker

### Key fields
- id
- request_id
- user_id
- participant_role

---

## 9.3 RequestDecision
Represents an approval/denial/review action.

### Key fields
- id
- request_id
- decided_by_user_id
- decision_type
- reason_code
- notes
- decided_at

### Decision examples
- approved
- denied
- needs_more_info
- reassigned
- completed

---

## 9.4 RequestComment
Represents threaded discussion or clarification tied to a request.

### Key fields
- id
- request_id
- author_user_id
- body
- created_at

---

---

# 10. Scheduling Domain

## 10.1 Appointment
Represents a scheduled item.

### Examples
- visitation
- call
- worker meeting
- home visit
- medical appointment

### Key fields
- id
- organization_id
- case_id
- child_id
- appointment_type
- title
- start_at
- end_at
- location
- status
- created_by_user_id
- notes

---

## 10.2 AppointmentParticipant
Tracks people involved in an appointment.

### Key fields
- id
- appointment_id
- user_id
- participant_type
- attendance_status

---

---

# 11. Vendor Management Domain

## 11.1 Vendor
Represents the business/vendor master record.

### Key fields
- id
- organization_id
- legal_name
- dba_name
- status
- visibility
- category
- phone
- email
- address
- created_at
- updated_at

---

## 11.2 VendorContact
Represents a contact person for a vendor.

### Key fields
- id
- vendor_id
- user_id (nullable if not yet a portal user)
- first_name
- last_name
- email
- phone
- role_title
- is_primary

---

## 11.3 VendorApplication
Represents a vendor’s onboarding/application workflow.

### Key fields
- id
- vendor_id
- intake_source
- status
- submitted_at
- reviewed_by_user_id
- reviewed_at
- decision_notes

### Intake source examples
- dhr_invite
- parent_recommendation
- self_registration

---

## 11.4 VendorRequirement
Defines required compliance items.

### Examples
- W-9
- insurance
- license
- agreement

### Key fields
- id
- organization_id
- name
- category
- required
- renewal_required

---

## 11.5 VendorSubmission
Represents a specific vendor’s submitted requirement item.

### Key fields
- id
- vendor_application_id
- vendor_requirement_id
- document_id
- status
- reviewer_user_id
- reviewer_note
- submitted_at
- reviewed_at

---

## 11.6 VendorRecommendation
Represents a foster parent or worker recommendation of a vendor.

### Key fields
- id
- organization_id
- recommended_by_user_id
- vendor_name_submitted
- contact_info_json
- case_id (nullable)
- status
- notes
- created_at

---

## 11.7 VendorOffering
Represents a service or listing from an approved vendor.

### Key fields
- id
- vendor_id
- title
- description
- category
- pricing_model
- price_amount
- status
- visibility
- created_at

---

---

# 12. Financial and Invoice Domain

## 12.1 Invoice
Represents a vendor-submitted invoice.

### Key fields
- id
- vendor_id
- case_id (nullable)
- child_id (nullable)
- linked_request_id (nullable)
- invoice_number
- amount
- status
- submitted_at
- approved_at
- paid_at

---

## 12.2 InvoiceLineItem
Represents individual charges on an invoice.

### Key fields
- id
- invoice_id
- description
- quantity
- unit_price
- total_amount

---

## 12.3 InvoiceDecision
Tracks approval/review events for invoices.

### Key fields
- id
- invoice_id
- decided_by_user_id
- decision_type
- notes
- decided_at

---

## 12.4 Reimbursement
Represents internal reimbursement submissions.

### Key fields
- id
- submitted_by_user_id
- reimbursement_type
- amount
- status
- notes
- submitted_at
- approved_at

---

---

# 13. Outreach and Recruitment Domain

## 13.1 RecruitmentLead
Represents a public or outreach-generated lead.

### Examples
- foster parent prospect
- vendor prospect
- job prospect

### Key fields
- id
- organization_id
- lead_type
- first_name
- last_name
- email
- phone
- source
- status
- assigned_to_user_id
- created_at

---

## 13.2 RecruitmentActivity
Represents touches in the recruiting pipeline.

### Key fields
- id
- recruitment_lead_id
- activity_type
- performed_by_user_id
- notes
- occurred_at

---

## 13.3 Campaign
Represents an outreach/email/social campaign.

### Key fields
- id
- organization_id
- campaign_type
- name
- status
- audience_definition_json
- scheduled_at
- sent_at
- created_by_user_id

---

## 13.4 CampaignMetric
Stores campaign performance stats.

### Key fields
- id
- campaign_id
- metric_type
- metric_value
- measured_at

---

---

# 14. Reporting / Analytics Support Domain

## 14.1 MetricSnapshot
Stores computed metrics for dashboards/reporting.

### Key fields
- id
- organization_id
- metric_scope
- metric_name
- metric_value
- dimension_json
- snapshot_at

---

## 14.2 SavedView
Represents reusable filtered views in queues/lists.

### Key fields
- id
- user_id
- entity_type
- name
- filter_json
- is_shared

---

---

# 15. MVP-Critical Entities

If FosterHub is scoped to an MVP, these are likely the minimum core entities:

### Identity / Access
- User
- Organization
- RoleTemplate
- Permission
- UserRoleAssignment
- UserPermissionOverride

### Case Core
- Child
- Case
- CaseAssignment
- CaseParticipant
- Document
- DocumentLink
- Note
- ActivityEvent

### Intake / Placement
- IntakeRecord
- IntakeDetail
- ResourceHome
- ResourceHomePreference
- PlacementSearch
- PlacementRequest
- PlacementRequestRecipient
- Placement

### Requests / Messaging
- ConversationThread
- ConversationParticipant
- Message
- Request
- RequestDecision
- Appointment

### Vendor Basics
- Vendor
- VendorApplication
- VendorSubmission
- VendorRequirement

These entities likely form the MVP backbone.

---

# 16. Phase 2 / Later Entities

These may be added after core workflows are stable:
- BroadcastCampaign
- BroadcastRecipient
- VendorRecommendation
- VendorOffering
- Invoice
- InvoiceLineItem
- InvoiceDecision
- Reimbursement
- RecruitmentLead
- RecruitmentActivity
- Campaign
- CampaignMetric
- SavedView
- richer analytics models

---

# 17. Key Relationship Summary

## Identity
- Organization has many Users
- User has many RoleAssignments
- RoleTemplate has many Permissions through RoleTemplatePermission
- User can have many PermissionOverrides

## Cases
- Child has one or more Cases
- Case has many CaseAssignments
- Case has many CaseParticipants
- Case has many Documents, Notes, ActivityEvents, Requests, Appointments, Threads

## Placement
- Case can have many PlacementSearches over time
- PlacementSearch has many PlacementMatches
- PlacementRequest belongs to PlacementSearch
- PlacementRequest has many PlacementRequestRecipients
- Placement belongs to Case and ResourceHome

## Requests
- Request belongs to Case and possibly Child
- Request has many participants, comments, decisions, and documents

## Vendor
- Vendor has many Contacts
- Vendor has many Applications over time
- VendorApplication has many VendorSubmissions
- Vendor may have many Offerings and Invoices later

---

# 18. Final Recommendation

The data model should be implemented in layers:

## Layer 1 — core identity and case foundation
- users
- permissions
- cases
- assignments
- documents

## Layer 2 — operational workflows
- intake
- placements
- requests
- appointments
- messaging

## Layer 3 — ecosystem expansion
- vendor workflows
- invoices
- broadcasts
- recruiting
- campaigns

This layered structure matches the product roadmap and makes FosterHub much more buildable.
