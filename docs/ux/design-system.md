# PaceOps CRM Design System

## Product feel

PaceOps CRM must feel like a modern enterprise CRM: clean, calm, minimal, fast, professional, and trustworthy.

It should feel closer to HubSpot, Linear, Attio, Folk, Salesforce Starter, and modern B2B SaaS tools — not like a flashy AI product.

AI should be present as a helpful assistant layer, not as the main brand identity.

The interface should support:
- PaceOps team members
- multiple clients
- multiple campaigns per client
- companies/accounts
- contacts/leads
- calling workflows
- pipeline management
- AI-assisted research
- HubSpot/Cognism/Aircall integrations

## Visual references

Use these files as visual style references:
- docs/ux/references/hubspot-onboarding-reference.png
- docs/ux/references/hubspot-sales-workspace-reference.png

Reference the clean spacing, simple typography, sidebar icons, onboarding assistant, and calm professional layouts.

Do not copy HubSpot branding, logos, or exact UI. Use the design principles only.

## Core design principles

1. Minimal over busy.
2. Clear hierarchy over decoration.
3. Business-first, not AI-first.
4. Fast switching between clients, campaigns, companies, and contacts.
5. Clean data tables and simple cards.
6. Every screen should show the next best action.
7. AI should be tucked into useful places: research drawer, onboarding assistant, data formatting, summaries.
8. The app should be usable in light mode and dark mode.
9. Enterprise users should trust it immediately.
10. Avoid gradients, gimmicks, excessive animation, cartoon visuals, and “AI sparkle” overload.

## Layout

Use a HubSpot-inspired layout:

- Narrow left icon sidebar.
- Top global search bar.
- Client/campaign switcher.
- Main content area.
- Optional right-side assistant/research panel.
- Settings/profile menu in top-right.
- Clean cards and tables.
- Subtle borders.
- Lots of whitespace.

Primary navigation:
- Dashboard
- Clients
- Campaigns
- Accounts
- Contacts
- Pipeline
- Calls
- Research
- Files
- Integrations
- Settings

## Client and campaign workflow

The system is designed around client work.

Example:
PaceOps user: Account owner
Client: User-created client workspace
Colleague: Campaign Manager
Campaigns:
- Survey outreach campaign
- Priority account targeting campaign
- Discovery call sprint campaign
- UX research recruitment campaign

Users must be able to switch quickly between:
- client
- campaign
- account/company
- contact
- pipeline view

## Core objects in UX language

Use these labels in the interface:

- Clients
- Campaigns
- Accounts
- Contacts
- Pipeline
- Tasks
- Calls
- Research
- Files
- Integrations

Prefer "Accounts" instead of only "Companies" in the navigation, because this feels more CRM-native.

## Colours

Support both light and dark mode.

### Light mode

Background: #F8FAFC
Surface: #FFFFFF
Card: #FFFFFF
Text: #111827
Muted text: #6B7280
Border: #E5E7EB
Sidebar: #2E2E2E
Accent: #0C69C8
Accent hover: #0A58A8
Success: #16A34A
Warning: #F59E0B
Danger: #DC2626

### Dark mode

Background: #0B1220
Surface: #101827
Card: #162033
Text: #F9FAFB
Muted text: #9CB3CC
Border: #26364A
Sidebar: #08111F
Accent: #3B82F6
Accent hover: #60A5FA
Success: #22C55E
Warning: #FBBF24
Danger: #EF4444

## Typography

Use a modern, clean sans-serif font.

Preferred:
- Inter
- Geist
- system-ui fallback

Headings should be clear and bold, but not oversized.
Body text should be readable and calm.
Tables should be compact but not cramped.

## Icons

Use a professional icon package:
- lucide-react preferred
- optionally Radix icons

Icons must be:
- simple line icons
- consistent stroke width
- not playful
- not colourful by default

## Components

Build reusable components:

- AppShell
- Sidebar
- TopBar
- GlobalSearch
- ClientSwitcher
- CampaignSwitcher
- PageHeader
- DataTable
- FilterBar
- StatusBadge
- MetricCard
- EmptyState
- LoadingState
- AccountCard
- ContactCard
- PipelineBoard
- PipelineColumn
- PipelineCard
- ActivityTimeline
- RightDrawer
- AIAssistantPanel
- OnboardingAssistant
- SettingsPanel
- ThemeToggle

## Onboarding

Create a smooth onboarding system similar in spirit to HubSpot's onboarding assistant.

It should ask:
1. What type of work are you setting up?
2. Who is the client?
3. What campaign are you running?
4. What accounts are you targeting?
5. What contacts/personas are you looking for?
6. What tools will you connect?
7. Do you want to import a CSV?
8. Do you want AI to help structure the workspace?

Example options:
- Manage client accounts
- Run outbound campaign
- Import leads
- Track cold calls
- Build research list
- Sync with HubSpot
- Use Cognism enrichment
- Connect Aircall

The onboarding should feel professional and calm, not gimmicky.

## AI placement

AI should appear in these places:
- Right-side research drawer
- Onboarding assistant
- CSV mapping assistant
- HubSpot export formatting assistant
- Account research summary
- Contact/persona summary
- Call prep
- Follow-up suggestions

Avoid making the whole app look like a chatbot.

## Aircall calling UX

For phone numbers:
- Phone number should be clickable.
- Clicking should open calling action.
- MVP can use tel: links.
- Later it should open Aircall or trigger Aircall API.
- Every call should create an activity.
- User should be able to log outcome after call.

Call outcomes:
- Connected
- No answer
- Voicemail
- Gatekeeper
- Not interested
- Call back
- Meeting booked
- Wrong number

## Pipeline UX

Create drag-and-drop boards.

Default campaign pipeline:
- Researching
- Account selected
- Contacts Found
- Enriched
- Ready to Call
- In Progress
- Engaged
- Meeting Booked
- Disqualified

Cards should support accounts or contacts depending on view.

Card fields:
- account/company name
- contact name
- title
- phone/email status
- owner
- campaign
- last activity
- next task
- status

## Settings

Settings must include:
- Profile
- Team
- Clients
- Campaigns
- Integrations
- Theme: Light / Dark / System
- API connections
- Field mappings
- Import/export settings

## Quality bar

The UI should feel like a real enterprise SaaS product.

Avoid:
- cluttered dashboards
- excessive gradients
- fake AI sparkle design
- childish illustrations
- too many colours
- overly complex screens
- hardcoded mock-only layouts

Prefer:
- calm layout
- consistent spacing
- simple typography
- practical workflows
- clean tables
- clear empty states
- obvious actions
