# FosterHub Technical Architecture

## 1. Purpose

This document defines a recommended technical architecture for FosterHub.

The goal is to answer:
- how the system should be structured
- what technologies likely fit best
- how permissions, portals, messaging, and documents should work technically
- what architectural decisions make sense for MVP vs later phases

This is a recommended architecture, not the only possible architecture.

---

## 2. Product Shape

FosterHub is best thought of as:
- one shared platform
- one core data foundation
- one shared permission engine
- multiple portal experiences
- several workflow-heavy modules

It is **not** best approached initially as a large collection of separate microservices.

### Recommendation
Start FosterHub as a **modular monolith**.

That means:
- one primary application/backend codebase
- clear internal modules/domains
- one primary database
- separate services only when there is a real scaling or operational reason

### Why modular monolith is the right starting choice
- simpler to build and reason about
- easier to move fast early
- easier to keep permissions consistent
- easier to support shared entities like users, cases, requests, and vendors
- avoids premature infrastructure sprawl

Microservices can come later if the system genuinely grows into that need.

---

## 3. Recommended High-Level Stack

## 3.1 Frontend
### Recommended
- **Next.js** (React-based)
- TypeScript
- Tailwind CSS or a strong component library
- App Router / server components where useful

### Why
- supports browser-first product well
- good for authenticated dashboards and public marketing pages
- flexible enough for multi-portal UX
- strong ecosystem
- works well with API-based or full-stack patterns

---

## 3.2 Backend
### Recommended options
#### Preferred
- **NestJS** (Node.js + TypeScript)

#### Alternative
- Laravel (PHP)

### Recommended choice
**NestJS** if the product is meant to feel more like a modern SaaS platform with lots of workflow modules.

### Why NestJS fits well
- TypeScript end to end if paired with Next.js
- modular architecture maps well to product domains
- strong support for auth, queues, events, validation, background jobs
- good for API-heavy systems
- easier shared typing between frontend/backend if designed well

---

## 3.3 Database
### Recommended
- **PostgreSQL**

### Why
- excellent fit for relational, workflow-heavy systems
- handles structured relationships well
- strong support for JSON fields where flexible metadata is helpful
- mature, reliable, widely supported
- ideal for permissions, case records, placements, requests, vendors, audits

---

## 3.4 Caching / Queue / Realtime Support
### Recommended
- **Redis**

### Use cases
- job queue backing
- caching
- rate limiting
- temporary tokens / ephemeral state
- pub/sub or lightweight event support

---

## 3.5 File / Document Storage
### Recommended
- **S3-compatible object storage**

Examples:
- AWS S3
- Cloudflare R2
- MinIO / DigitalOcean Spaces / similar

### Why
FosterHub will need strong document handling for:
- child documents
- legal documents
- medical files
- vendor uploads
- forms
- attachments

Object storage is a better fit than storing files in the database or local disk.

---

## 3.6 Search
### MVP recommendation
- Postgres full-text search + indexed filtering

### Later options
- Meilisearch
- Elasticsearch / OpenSearch

### Why
MVP probably does not need a separate search engine if filtering/indexing is designed well.

---

## 3.7 Notifications / Messaging Infrastructure
### Recommended approach
- in-app messaging stored in Postgres
- websocket or realtime layer for live updates
- email service for notifications
- SMS provider for broadcast messaging later

### Suggested providers
- Email: Postmark, SendGrid, or Resend
- SMS later: Twilio or another compliant provider

---

## 3.8 Background Jobs
### Recommended
- queue-backed worker processes using Redis

### Use cases
- sending notifications
- document processing
- vendor review reminders
- placement request fanout
- scheduled messages
- report generation
- campaign sends later

---

## 3.9 Authentication
### Recommended
- centralized auth service inside main app
- secure session or token-based auth
- optional MFA for sensitive/internal users

### Good fit
- Auth.js / NextAuth for frontend integration if appropriate
- custom auth logic or Nest auth module on backend

---

## 3.10 Hosting / Infrastructure
### Recommended MVP direction
- one app deployment for frontend
- one backend/API deployment
- managed Postgres
- managed Redis
- managed object storage

### Examples
- Vercel for frontend + managed backend elsewhere
- Render / Railway / Fly / AWS / Hetzner / DigitalOcean for backend
- or a more unified cloud deployment if preferred

### Alternative
A single VPS is possible for a prototype, but not ideal for a system handling sensitive records in production.

---

## 4. Recommended Architecture by Layer

## 4.1 Presentation Layer
Contains:
- public pages
- DHR/admin portal UI
- worker portal UI
- parent portal UI
- vendor portal UI

### Suggested design pattern
One Next.js frontend application with role-aware navigation and route protection.

---

## 4.2 API / Application Layer
Contains business logic and application services.

### Suggested domain modules
- auth
- users
- roles / permissions
- cases
- intake
- placements
- requests
- messaging
- appointments
- vendors
- documents
- reporting
- recruitment (later)

### Recommendation
Implement these as clear internal modules in the backend, even if they ship inside one application.

---

## 4.3 Data Layer
Contains:
- PostgreSQL relational data
- object storage documents/files
- Redis for queue/cache/realtime support

---

## 4.4 Integration Layer
Handles connections to external systems/services.

### Examples
- email service
- SMS service
- e-sign tools later
- social media scheduling tools later
- analytics/logging/error tracking tools

---

# 5. Portal Strategy

## 5.1 One app, many experiences
The best likely implementation is:
- one application platform
- one auth system
- one backend API
- one data model
- different portal views based on roles/permissions

### Why this is better than separate apps at first
- shared data stays consistent
- permissions stay centralized
- lower engineering overhead
- fewer duplicated code paths
- easier to evolve quickly

---

## 5.2 Route design example
Possible structure:
- `/admin/...`
- `/worker/...`
- `/parent/...`
- `/birth-parent/...`
- `/vendor/...`
- `/public/...`

Or a more unified navigation approach based on dynamic role-aware menus.

---

# 6. Permission Architecture

This is one of the most important technical areas in FosterHub.

## 6.1 Recommended model
Use a layered permission system:

### Layer 1: Role templates
Default bundles like:
- Administrator
- Manager
- Worker
- Placement Finder
- Resource Parent
- Birth Parent
- Vendor

### Layer 2: Permission grants
Each role template maps to discrete permissions.

### Layer 3: User-specific overrides
Admins can customize individual users, HubSpot-style.

### Layer 4: Contextual access rules
Even if a permission exists, access is still filtered by context such as:
- assigned cases
- child in placement
- participant relationship
- public vs private vendor status

---

## 6.2 Enforcement points
Permissions should be enforced at:
- route level
- API endpoint/service level
- query/data filtering level
- UI action visibility level

### Important note
Do not rely only on hidden buttons in the frontend. Backend authorization must be authoritative.

---

# 7. Multi-Tenancy / Organization Model

FosterHub likely needs a tenant-aware architecture.

## Recommendation
Use a **single database with organization_id scoping** for MVP unless legal/compliance requirements require harder isolation.

### Why
- simpler operations
- easier reporting and deployment
- easier to support multiple organizations if needed

### Important rule
Every tenant-aware entity should include organization_id or derive tenant scope through secure relationships.

### Later option
Move to stronger tenant isolation only if required by scale or regulatory demands.

---

# 8. Domain Module Recommendations

## 8.1 Auth Module
Responsibilities:
- login
- password reset
- MFA later
- sessions/tokens
- invite acceptance

## 8.2 Users / Permissions Module
Responsibilities:
- users
- teams
- roles
- permissions
- overrides
- access evaluation

## 8.3 Cases Module
Responsibilities:
- child records
- cases
- assignments
- participants
- notes
- documents

## 8.4 Intake Module
Responsibilities:
- intake record creation
- intake status
- participant invitations
- assignment flows

## 8.5 Placement Module
Responsibilities:
- resource homes
- preferences
- placement search
- placement requests
- placement responses
- placement records

## 8.6 Requests Module
Responsibilities:
- request creation
- request routing
- approvals/denials
- supporting documents
- comments/history

## 8.7 Messaging Module
Responsibilities:
- threads
- messages
- notifications
- attachments
- broadcast messages later

## 8.8 Vendor Module
Responsibilities:
- vendor profiles
- applications
- submissions
- review queue
- approval states
- offerings later

## 8.9 Scheduling Module
Responsibilities:
- appointments
- participation
- reminders
- scheduling workflows

## 8.10 Reporting Module
Responsibilities:
- computed dashboard data
- queue counts
- activity summaries
- later advanced analytics

---

# 9. API Strategy

## Recommendation
Use a structured internal API with clear domain boundaries.

### Good options
- REST for most operational APIs
- optional GraphQL later if frontend data aggregation needs become painful

### Recommendation for MVP
Use **REST** with clean resource/service design.

### Why
- simpler and faster for a workflow-heavy CRUD + queue product
- easier to debug
- easier for smaller teams

---

## 9.1 Example API domain groupings
- `/auth/*`
- `/users/*`
- `/roles/*`
- `/cases/*`
- `/intake/*`
- `/placements/*`
- `/requests/*`
- `/messages/*`
- `/vendors/*`
- `/appointments/*`
- `/reports/*`

---

# 10. Realtime Strategy

FosterHub probably needs light realtime features, not full chat-app complexity at first.

## MVP realtime needs
- new message indicator
- request status updates
- placement response updates
- notification badges

## Recommended approach
- websocket gateway or socket layer
- event-driven updates from backend
- fallback polling where acceptable

### Why not overbuild this early
The system needs responsiveness, but not necessarily Slack-level realtime complexity in MVP.

---

# 11. Document Handling Architecture

Documents are a major part of the system.

## Recommended approach
- store metadata in Postgres
- store files in object storage
- use signed URLs or backend-mediated access for secure downloads
- apply permission checks before file access

## Helpful document capabilities
- category tagging
- versioning later
- visibility scope
- expiration tracking for vendor docs
- malware scanning if needed

---

# 12. Notification Architecture

Notifications should be event-driven.

## Notification channels
### MVP
- in-app notifications
- email notifications

### Phase 2
- SMS/broadcast
- scheduled reminders
- more configurable templates

## Notification events may include
- request submitted
- request updated
- request approved/denied
- new message received
- vendor document missing
- vendor approved
- placement request sent
- placement response received
- appointment changed

---

# 13. Audit and Compliance Architecture

Because FosterHub handles sensitive data, auditing matters.

## Recommended logging categories
- authentication events
- permission changes
- document access events
- request decisions
- vendor decisions
- placement decisions
- data export events

## Recommendation
Use structured audit logging from the start for sensitive actions.

---

# 14. Reporting Architecture

## MVP approach
- query-based dashboards
- cached summary tables if needed
- metric snapshot jobs for expensive counts

## Later approach
- analytics/event warehouse if scale justifies it
- more advanced BI/reporting layer

Start simple unless reporting needs are intense immediately.

---

# 15. Security Considerations

## 15.1 Core security recommendations
- encrypted transport (TLS everywhere)
- encrypted secrets management
- hashed passwords using strong modern algorithms
- RBAC + contextual access filtering
- backend authorization enforcement
- signed file access
- strong audit logging
- session expiration / revocation
- optional MFA for staff/admins

## 15.2 Sensitive record controls
Especially protect:
- child identity data
- medical documents
- legal records
- internal notes
- financial/payment records

## 15.3 Least privilege
Default role templates should start conservative and expand only as needed.

---

# 16. Deployment Recommendation

## MVP deployment pattern
### Frontend
- Next.js app deployment

### Backend
- NestJS API deployment
- separate worker process for background jobs

### Managed services
- PostgreSQL
- Redis
- Object storage
- Email provider

### Monitoring
- app logs
- error tracking
- uptime monitoring
- queue monitoring

---

# 17. Observability and Reliability

## Recommended tools / concerns
- error tracking (e.g. Sentry)
- structured logs
- health checks
- DB backups
- queue failure monitoring
- audit reportability

## Reliability concerns
- failed notification sends
- stalled background jobs
- document upload failures
- permission bugs
- orphaned workflow states

---

# 18. MVP Technical Build Order

## Step 1: Foundation
- auth
- users
- organizations
- role templates
- permission engine
- audit basics

## Step 2: Case core
- child/case records
- case assignments
- notes/documents
- case views

## Step 3: Resource parent portal basics
- parent login
- child info access
- messaging
- request submission

## Step 4: Requests and approvals
- request creation
- review queues
- status changes
- document attachments

## Step 5: Placement workflows
- resource homes
- placement search
- placement request sending
- response capture
- placement record creation

## Step 6: Vendor onboarding basics
- vendor invite
- onboarding application
- document upload
- review queue
- approval visibility

## Step 7: Reporting basics
- dashboard metrics
- queue counts
- overdue indicators

---

# 19. Later Technical Expansion Areas

These can layer in later without changing the overall architecture too much.

### Phase 2+
- SMS provider integration
- broadcast engine
- invoice/payment workflows
- advanced permission UI
- child portal
- birth parent portal
- outreach/recruitment tools
- richer analytics
- external integrations

---

# 20. Final Recommendation

FosterHub should be built as a **TypeScript-first modular monolith** using:
- **Next.js** for frontend portals and public pages
- **NestJS** for backend services and business logic
- **PostgreSQL** for relational data
- **Redis** for queues/cache/realtime support
- **S3-compatible storage** for documents

### Why this architecture fits
It supports:
- multiple portals
- complex permissions
- workflow-heavy modules
- document management
- scalable growth without premature complexity

### Best architectural principle
Keep FosterHub as **one coherent platform with modular domain boundaries**, not a pile of disconnected apps or premature microservices.
