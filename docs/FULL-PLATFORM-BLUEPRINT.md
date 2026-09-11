# REALESTATE — Full platform blueprint

## 1. Platform Owner
Internal operating system:
- Companies / tenants
- Users and roles
- Projects and onboarding
- Project health
- AI/content processing queue
- Assets and storage
- Publication/domains
- Leads/conversion
- Experience templates
- Audit trail
- Integrations and platform settings

## 2. Client / Tenant Workspace
One company can have multiple users and multiple projects. Tenant isolation is mandatory.
- Dashboard
- Projects
- Project setup
- Buildings / floors / units
- Inventory and pricing
- Plans and documents
- Media / renders / video / 360 / 3D
- Amenities
- Location / POIs
- Branding
- Experience configuration
- AI import and review
- Preview / publication
- Leads and commercial follow-up
- Team members
- Embed / custom domain / integrations

## 3. Consumer Showroom
Public shareable URL, independent of the client's website:
- Project story and location
- Interactive building
- Floors
- Availability
- Unit detail
- Plans / renders / amenities
- 360 / video
- Commercial information
- Deep links and sharing
- Lead capture
- Analytics events

## Canonical data flow
Company -> Project -> Building -> Floor -> Unit
Project -> Plans / Assets / Amenities / Location / Branding / Experience Config
Project -> Publication -> Public Showroom
Showroom -> Events -> Lead -> Client Workspace

## AI content pipeline
Developer package -> upload/storage -> AI job -> classification -> OCR/vision -> architectural extraction -> normalized draft -> confidence/validation -> human approval -> canonical database -> experience manifest -> renderer.

AI must never silently invent commercial facts. Low-confidence values are REVIEW_REQUIRED.

## Lifecycle
DRAFT -> PROCESSING -> REVIEW_REQUIRED -> READY -> PUBLISHED
Published projects can be UNPUBLISHED without data loss.

## Product principle
The renderer is replaceable. The data model is the source of truth. A second client is onboarded by configuration/content, never by forking the application.

## Completion criterion
Platform owner creates a client; client users manage several projects; content can be imported and reviewed; inventory is maintained; showroom is previewed/published; consumers explore and submit leads; client can publish/link/embed the showroom without developer intervention.
