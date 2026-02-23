# Moo Dashboards - TODO

**See ROADMAP.md for the comprehensive feature plan, architecture overview, and long-term vision.**

This file tracks implementation status of current work. ROADMAP.md is the master plan.

---

## 🎯 Recent Improvements

### 2026-02-23 8:29 AM - Site Monitoring Dashboard Live Data Connection
**Implemented:** Third live data integration - Site Monitoring dashboard now reads real site status
- Created sync-monitoring-status.ps1 to parse latest monitoring log file
- Extracts uptime status (up/down), response times for all 32 sites
- Updated data-loader.js to fetch and merge status.json with sites data
- Dashboard now shows real monitoring data: actual status, response times, last check time
- Sites sorted correctly (down/warning first, then alphabetical)
- Phase 2.1 progress: 3 of 10 local file integrations complete

**Why:** Site Monitoring is critical for Ben's business - needs real-time visibility on client sites
**Next Step:** Time Tracking dashboard (parse memory/timelog/*.md files)
**Deployed:** Pushed to GitHub main branch (commit 47a56dc), Cloudflare Pages auto-deploying

### 2026-02-23 7:29 AM - CRM Dashboard Live Data Connection
**Implemented:** Second live data integration - CRM dashboard now reads from workspace files
- Connected to crm/contacts.json, crm/interactions.json, crm/introductions.json
- Updated crm.js to async rendering with live data fetching
- Fixed data-loader.js to handle array-based JSON files (not wrapped objects)
- Transforms live data: calculates recent interactions (last 7 days), top contacts by interaction count
- Shows total contacts count (116K+ contacts loaded successfully)
- Displays pending and completed introductions
- Added data status banner showing "Live Data" vs "Sample Data"
- Graceful fallback to sample data if files unavailable

**Why:** Phase 2.1 priority - CRM is high-value for Ben's networking-focused workflow
**Next Step:** Continue Phase 2.1 - Site Monitoring dashboard (monitoring/*.json files)
**Deployed:** Pushed to GitHub main branch (commit 642e371), Cloudflare Pages auto-deploying

### 2026-02-23 12:29 AM - Kitchen Dashboard Live Data Connection
**Implemented:** First live data integration - Kitchen dashboard now reads from workspace files
- Created data loader infrastructure (data-loader.js already existed, now actively used)
- Copied CRM, Kitchen, and Monitoring data files to /data directory for serving
- Updated kitchen.js to async rendering with live data fetching
- Updated app.js router to handle async dashboard renderers
- Added data status banner showing "Live Data" vs "Sample Data"
- Graceful fallback to sample data if live data unavailable
- Data transforms live meal plan structure to match dashboard expectations
- Shows: This week's meals, next week's meals, pantry/proteins/fridge inventory
- Note: Shopping list still empty (would need ClickUp or separate file integration)

**Why:** Phase 2.1 priority - local file integration is the easiest win for live data
**Next Step:** Connect more dashboards (CRM Overview, Site Monitoring) using same pattern
**Deployed:** Pushed to GitHub main branch, Cloudflare Pages auto-deploying

### 2026-02-22 11:29 PM - Site Monitoring Redesign
**Implemented:** Redesigned Site Monitoring page to match Ben's feedback
- Changed layout from two-column to big list + compact sidebar
- Sites table is now the primary focus (full-width, prominent)
- Platform chart moved to compact sidebar (secondary)
- Sites sorted by status (warnings/down at top, healthy below)
- Improved hover effects and visual hierarchy
- Condensed spacing for less scrolling
- Kept KPI cards at top (Ben specifically approved these)
- Live data integration structure ready via data-loader.js

**Why:** Ben's feedback specifically requested "ONE BIG LIST of all websites" as the primary focus, with platform distribution as a secondary element. Previous design had them side-by-side with equal prominence.

**Deployed:** Pushed to GitHub, Cloudflare Pages will auto-deploy

---

## ✅ Completed (Full Site Build)

### Framework & Structure
- [x] Index.html SPA shell with sidebar navigation
- [x] CSS variables for theming (light/dark mode)
- [x] Mobile responsive design
- [x] Sidebar toggle functionality
- [x] Theme toggle (dark mode)
- [x] Client-side router (hash-based)
- [x] Lucide icons integration
- [x] Chart.js integration

### Dashboard Pages (All Built)
- [x] **Home/Overview** - Summary cards linking to all dashboards
- [x] **Sales Pipeline** - 121 tracking, weekly scorecard, pipeline stages
- [x] **EOS Scorecard** - Weekly metrics tracker with progress bars
- [x] **CRM Overview** - Contacts browser, interaction history, top contacts
- [x] **Client Health** - All clients status, platform distribution, upsell opportunities
- [x] **Site Monitoring** - Site status, alerts, response times
- [x] **Time Tracking** - Daily logs by category, weekly breakdown, trends
- [x] **BNI Metrics** - Member count, visitors, referrals, attendance, 121s
- [x] **Financial Overview** - Revenue vs target, MRR tracking, expenses
- [x] **Task Overview** - ClickUp task summary by status and category
- [x] **Kitchen/Meal Prep** - Current week's plan, inventory, shopping list

### Sample Data
- [x] Sample data file with realistic data matching actual schemas
- [x] Used real data structures from workspace files:
  - CRM contacts.json schema
  - Kitchen meal-plan-state.json and inventory.json schemas
  - Monitoring sites.json and index.json schemas
  - Time log format from memory/timelog/

## 🚧 Next Steps (Live Data Integration)

### Data Connections Needed

1. **Sales Pipeline**
   - [ ] Connect to ClickUp API for deals/pipeline
   - [ ] Pull 121 count from calendar events
   - [ ] Weekly scorecard from historical data

2. **EOS Scorecard**
   - [ ] Define metrics in config file
   - [ ] Manual input system or integrate with ClickUp custom fields
   - [ ] Weekly progress tracking

3. **CRM Overview** ✅ COMPLETE (2026-02-23)
   - [x] Read from `crm/contacts.json` (already matches schema)
   - [x] Read from `crm/interactions.json` (already matches schema)
   - [x] Read from `crm/introductions.json` (already matches schema)
   - [x] Calculate recent interactions (last 7 days)
   - [x] Compute top contacts by interaction count
   - [x] Show pending/completed introductions
   - **Note:** Successfully loading 116K+ contacts, transforming data for display

4. **Client Health**
   - [ ] Read from `monitoring/sites.json` for client list
   - [ ] Add MRR tracking (could be in sites.json or separate file)
   - [ ] Upsell opportunities tracking system
   - [ ] Last contact/update date from monitoring or separate tracking

5. **Site Monitoring** ✅ COMPLETE (2026-02-23)
   - [x] Redesigned layout per Ben's feedback - big list is now primary focus
   - [x] Platform chart moved to compact sidebar
   - [x] Sites table sorted by status (down/warning first, then alphabetical)
   - [x] Improved hover states and visual hierarchy
   - [x] Condensed layout for less scrolling
   - [x] KPI cards kept (Ben approved these)
   - [x] Live data integration using data-loader.js
   - [x] Read from monitoring/index.json for page counts
   - [x] Parse latest monitoring log (memory/overnight/*.md) for real site status
   - [x] Display actual uptime status (up/down) and response times
   - [x] Alert detection from status.json (parsed from ALERT_PENDING.txt)
   - [ ] Historical uptime data (optional - future enhancement)

6. **Time Tracking**
   - [ ] Read from `memory/timelog/*.md` files
   - [ ] Parse markdown format to extract time entries
   - [ ] Weekly/monthly aggregation
   - [ ] Category breakdown calculation

7. **BNI Metrics**
   - [ ] Manual input system or config file
   - [ ] Track 121s from calendar + CRM
   - [ ] Visitor count tracking
   - [ ] Referral pipeline integration with ClickUp

8. **Financial Overview**
   - [ ] Revenue tracking system (manual or from accounting?)
   - [ ] MRR calculation from client list
   - [ ] Monthly revenue history
   - [ ] Expense tracking (config file?)

9. **Task Overview**
   - [ ] ClickUp API integration
   - [ ] Filter by status (overdue, due today, upcoming)
   - [ ] Category breakdown from ClickUp lists/tags

10. **Kitchen/Meal Prep** ✅ COMPLETE (2026-02-23)
    - [x] Read from `kitchen/meal-plan-state.json` (already matches schema)
    - [x] Read from `kitchen/inventory.json` (already matches schema)
    - [x] Transform meal plan data for display
    - [x] Show this week's meals, next week's meals, inventory
    - **Note:** Successfully loading and displaying all kitchen data

### Technical Implementation

- [ ] Create data loader modules for each data source
- [ ] API route handlers (if needed for ClickUp, Calendar, etc.)
- [ ] Caching strategy for external API calls
- [ ] Error handling for missing/malformed data
- [ ] Real-time vs periodic refresh strategy
- [ ] Authentication for external APIs (ClickUp, Google Calendar)

### Deployment & Access

- [x] Cloudflare Pages auto-deploy on push to main
- [ ] Add authentication layer (optional - currently public)
- [ ] Mobile app wrapper (optional - PWA already works)
- [ ] Desktop shortcut for quick access

## 📝 Notes

- All dashboards use sample/placeholder data that matches real schemas
- CRM and Kitchen data files already exist in correct format - just need to load them
- Site monitoring data exists - need to read monitoring/index.json
- Time tracking data exists in memory/timelog/ - need parser
- External APIs (ClickUp, Calendar) will need authentication tokens
- Consider creating a `data-loader.js` module to centralize all data fetching

## 🎨 Design Decisions

- Used vanilla JS (no heavy frameworks) for simplicity
- Chart.js for visualizations
- Lucide icons for consistency
- CSS variables for easy theming
- Mobile-first responsive design
- Dark mode support out of the box
- Clean, professional Purple Cow brand aesthetic

## 🔗 Resources

- **Live URL:** https://moo-dashboards.pages.dev
- **Repo:** https://github.com/purplecowbrands/moo-dashboards
- **Workspace Data:** C:\Users\benke\.openclaw\workspace\
  - CRM: `crm/`
  - Kitchen: `kitchen/`
  - Monitoring: `monitoring/`
  - Time logs: `memory/timelog/`
