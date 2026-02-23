# Ben's Feedback on Dashboards

## 2026-02-22

### Home Page
- REPLACE entirely with the Focus Engine ("What Should I Be Doing Right Now?")
- Current overview page is not the final design

### Sales Pipeline
- Add a visual weekly calendar showing all events with actual event names
- Color code events: 121 (one color), Event (another), Other (third)
- One-click to change event type between 121/Event/Other
- Clicking a week's column in the scorecard chart should show that week's calendar view so Ben can correct discrepancies
- REMOVE pipeline value tracking - too much work for too little value
- REMOVE pipeline stage value tracking - same reason

### EOS Scorecard
- Real measurables (from Airtable - need API integration):
  - Days to Go-Live (target: under 60 days, 90-day rolling avg)
  - Unbranded Clicks (target: 400/mo in Q1)
  - Profit (target: $140k 2026 / $22k Q1)
  - Revenue (target: $285k 2026 / $48k Q1)
  - MRR Velocity (target: $1,250/mo)
  - MRR Stability (target: $25k 2026)
  - ACV Velocity (target: $14,375/mo)
  - Sales Cycle Length (target: under 1 month, 90-day rolling avg)
  - 121s/week (target: 6) - ADDING
  - Networking Events - ADDING
- Data source: Airtable (need to connect API)

### EOS Scorecard
- TOTALLY REDO - should look like the Airtable screenshot (series of line charts and histograms, NOT cards)
- Each chart should be clickable - links to the related dashboard (e.g. 121s chart -> Sales Pipeline)
- Acts as a directory/hub to the other dashboards
- Start with 121s linking to Sales Pipeline, add more links as data connects

### CRM
- Remove KPI cards at top - not applicable to a CRM
- Keep recent interactions (last 3-5 people reached out to)
- ADD: next 3-5 follow-ups I should be doing
- Need a way to easily browse and manage contacts
- SEPARATE PAGE NEEDED: Contact Triage dashboard - recreate the localhost triage UI that grouped contacts into categories (Pipedrive imports etc). Search workspace files for the old triage groupings/code.
- That triage system let Ben browse all contacts grouped into 5-10 categories

### Client Health
- DELETE this page - not ready, would need a lot more thought
- Move the Framer/Shopify/WordPress pie chart to the Site Monitoring page

### Site Monitoring
- KPIs at top are GOOD (sites down, warnings, last check, sites up)
- Remove "monitoring info", "status distribution card", "recent site checks vs active alerts" - all redundant
- Replace with ONE BIG LIST of all websites, sorted by status (warnings/down at top, healthy below)
- Clicking a row should go to that actual website
- Active alerts should be single-clickable to go straight to the issue

### Time Tracking
- This is cool, keep developing it
- Add: bar chart of each day of the week showing time breakdown per day (sleep/work/personal/breaks)
- Add: actual timeline view - like a weekly calendar showing time blocks color coded, each day 3am to 3am
- Add: overlay button to show calendar events on top of time tracking (past weeks show tracked time + events, future weeks show upcoming events)
- Future idea: plan future time blocks by category
- Category breakdown is good but progress bars don't indicate anything real - fix them
- Build the weekly timeline + calendar overlay first, then Ben will have more ideas

### BNI Metrics
- DELETE this page - Ben has BNI Connect app, doesn't need this
- 121s tracking belongs in Sales Pipeline, not a separate BNI page

### Financial Overview
- DELETE this page - no actual data source yet
- Add to roadmap as future idea to discuss

### Tasks
- Remove ALL KPIs, category breakdowns, etc - it's clutter
- Just show actual tasks organized by status
- Whatever tasks I'm doing today
- REFERENCE: ClickUp screenshot shows grouped by status (Do Next / Coming Up / Backlog)
- Columns: Name (with list/folder breadcrumb), Time estimate, Due date, Comments count, Task type
- Subtasks shown indented under parent tasks
- Each status group shows count and total time estimate
- Clean table layout, no charts, no graphs, just the actual tasks
- Should pull live from ClickUp API

### Kitchen
- Remove the 4 KPI cards at top - clutter
- Keep this week and next week planned recipes - that's good
- Add: click on a recipe to swap to a different one easily
- Keep shopping list below recipes
- Inventory: add "Prepped Food" as its own top category showing actual meal prepped items, easily updatable
- Other inventory tables (proteins, pantry, fridge, freezer) should match what's actually in inventory.json

### Roadmap Page - TOTAL REDESIGN
- Replace current phase/accordion layout with a KANBAN BOARD
- Columns: Idea | Backlog | Building Next | Blocked | Complete
- Complete column hidden by default
- Each feature is a card that moves through columns
- Two buttons per card ONLY: "Build Now" (moves to Building Next) and "Reject" (vetoes)
- Plus a notes/chat field for free-form feedback
- REMOVE: priority buttons (critical/high/medium/low), approve/skip buttons, Ben's Feedback Summary at top
- Move search/filters to be less prominent
- Don't show Phase 1 (complete) at the top - completed stuff goes to the end or is hidden
- Most ideas go straight to Backlog (approved by default)
- Idea column is ONLY for big/risky changes needing Ben's sign-off before building
- If Ben clicks "Build Now" on an Idea/Backlog card, Moo should build it in the very next hourly cycle
- SECOND VIEW: Add toggle button to switch to "Architecture View" - logical breakdown of where features fit in the system (data connections, focus engine, UI layer, APIs, etc.)
- Phases should become architecture categories (not sequential stages) - e.g. "Live Data Connections" shows what's connected
- Features should live independently, not locked to phases - can work on input UI before all data connections are done

### New Dashboard: Moo Status
- Live view of all active subagents (what's running, how long, what task)
- Summary of completed/recent subagents
- All cron jobs with: last run time, next run time, status (success/fail), description of purpose
- Basically a window into Moo's brain so Ben can see what's happening behind the scenes

### General
- Need clear indicators on each dashboard showing what's live data vs sample data
- All sample data should be replaced with real data ASAP
- KPI summary cards are mostly unwanted clutter - only use them where they genuinely add value (Site Monitoring is good, most others are not)
- DESIGN: More condensed layouts - maximize info per screen, minimize scrolling. Target scroll-less UIs that fit on a normal desktop monitor (1920x1080) without scrolling. Tighter padding, smaller fonts where appropriate, use the full viewport.
- Pages to DELETE: Client Health, BNI Metrics, Financial Overview
- Pages to TOTALLY REDO: EOS Scorecard, Home (becomes Focus Engine)
- Pages to SIGNIFICANTLY REWORK: CRM, Sales Pipeline, Tasks, Site Monitoring, Time Tracking
- Pages that are CLOSE: Kitchen (minor tweaks)
