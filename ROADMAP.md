# Moo Dashboards - Product Roadmap

## Vision Statement

**"What Should I Be Doing Right Now?"**

Moo Dashboards is Ben Porter's unified productivity command center. The core mission is to eliminate decision fatigue by providing intelligent, context-aware guidance on what deserves attention at any given moment. Instead of juggling multiple systems (Google Calendar, ClickUp, CRM, email, monitoring alerts), Ben gets a single, clear answer backed by AI intelligence that understands his business priorities, networking goals, and personal life balance.

The system doesn't just display data - it actively decides what matters most right now and presents it in a bold, clean interface that demands action, not analysis.

### Design Philosophy

**Learned from Task Randomizer:**
- Big, bold, clean presentation (no clutter)
- Minimal decision fatigue - the system chooses, Ben executes
- Simple UI for logging completion and moving forward
- Fast, lightweight, no friction

**What Moo Dashboards Improves:**
- Context-aware intelligence (not random - prioritized by AI)
- Multi-source data integration (calendar, tasks, CRM, monitoring)
- Business-first priorities (sales > admin, urgent > important)
- One app for everything (no tool-switching)
- Eventually write-capable (create tasks, events, updates from one place)

### Success Metrics

Ben should be able to:
1. Open the app and know exactly what to do next in < 3 seconds
2. Complete or defer an action in < 30 seconds
3. Review all critical systems (calendar, tasks, monitoring, CRM) in < 2 minutes
4. Never miss a meeting, deadline, or high-value followup
5. Reduce time spent "figuring out what to work on" by 80%

### Roadmap Workflow Contract (Used by Dashboard + Cron Automation)

- Roadmap statuses are the source of truth for what gets built next.
- Build queue order must be derived from roadmap state, not ad-hoc picks.
- Queue priority order:
  1. Features marked Build Now (in Building)
  2. Other features in Building
  3. Planned/Backlog features
- Required lifecycle before done:
  - Idea -> Planned/Backlog -> Building -> Review -> Complete
- Review is mandatory post-launch:
  - Launch/build completion moves feature to Review
  - Ben can add comments then either Approve or Request Changes
  - Request Changes returns feature to Planned/Backlog queue for another pass
- Any cron-driven dashboard improvement cycle should select implementation targets from this roadmap queue first.

---

## Architecture Overview

### Data Flow

```
External Systems          Backend Layer              Frontend
----------------         ---------------            ---------
Google Calendar    -->   Moo (OpenClaw)      -->   Dashboard UI
ClickUp API        -->   Data Aggregation    -->   Focus View
CRM Files          -->   Priority Engine     -->   Status Cards
Monitoring Data    -->   Decision Logic      -->   Quick Actions
Time Logs          -->   Context Builder     -->   Analytics Views
Email/Notifications -->  Alert Processor
```

### Components

**1. Data Sources (Read)**
- Google Calendar API (meetings, events)
- ClickUp API (tasks, deals, projects)
- Local CRM files (`crm/contacts.json`, `crm/interactions.json`)
- Site monitoring data (`monitoring/sites.json`, `monitoring/index.json`)
- Time tracking logs (`memory/timelog/*.md`)
- Kitchen inventory & meal plans (`kitchen/*.json`)
- Financial tracking (manual/config-based initially)

**2. Moo Intelligence Layer (OpenClaw Agent)**
- Fetches data from all sources on demand
- Applies business rules and priority logic
- Generates "What Should I Do Now?" recommendations
- Handles natural language queries
- Manages background monitoring and alerts
- Eventually: creates/updates data across systems

**3. Priority Engine Logic**
Priority ranking (high to low):
1. Active meeting happening RIGHT NOW (with dismiss option)
2. Monitoring alerts (client sites down)
3. Overdue tasks (especially sales followups)
4. Due today tasks (sales > client work > admin)
5. Upcoming meetings (next 2 hours)
6. BNI 121 targets (if below weekly goal)
7. Email/notification triage (unread important messages)
8. Time logging reminders (if gaps in daily log)
9. Proactive work (prospecting, blog posts, system improvements)

**4. Frontend Dashboard**
- Single-page app (vanilla JS, lightweight)
- Hash-based routing (no server required)
- Chart.js for visualizations
- Lucide icons for consistency
- Dark mode support
- Mobile-responsive PWA

**5. Deployment**
- Cloudflare Pages (auto-deploy from GitHub main branch)
- Public URL: https://moo-dashboards.pages.dev
- No authentication initially (internal use only)
- Eventually: auth layer for security

---

## Feature Phases

### Phase 1: Foundation ✅ COMPLETE
**Status:** Fully built, deployed, using sample data

**What's Built:**
- Complete SPA shell with sidebar navigation
- 11 dashboard pages with realistic UI
- Sample data matching real schemas
- Responsive design (mobile + desktop)
- Dark mode theming
- Chart.js visualizations
- Cloudflare Pages deployment pipeline

**Dashboards:**
- Home/Overview - Summary cards linking to all dashboards
- Sales Pipeline - 121 tracking, weekly scorecard, pipeline stages
- EOS Scorecard - Weekly metrics tracker with progress bars
- CRM Overview - Contacts browser, interaction history, top contacts
- Client Health - All clients status, platform distribution, upsell opportunities
- Site Monitoring - Site status, alerts, response times
- Time Tracking - Daily logs by category, weekly breakdown, trends
- BNI Metrics - Member count, visitors, referrals, attendance, 121s
- Financial Overview - Revenue vs target, MRR tracking, expenses
- Task Overview - ClickUp task summary by status and category
- Kitchen/Meal Prep - Current week's plan, inventory, shopping list

---

### Phase 2: Live Data Connections (Read-Only)
**Goal:** Replace sample data with real data from APIs and local files  
**Timeline:** 2-3 weeks  
**Priority:** HIGH

#### 2.1 Local File Integration (Week 1)
**Easy wins - files already in correct format:**

| Data Source | File Path | Implementation |
|-------------|-----------|----------------|
| CRM Contacts | `crm/contacts.json` | Direct JSON load |
| CRM Interactions | `crm/interactions.json` | Direct JSON load |
| CRM Introductions | `crm/introductions.json` | Direct JSON load |
| Kitchen Meal Plans | `kitchen/meal-plan-state.json` | Direct JSON load |
| Kitchen Inventory | `kitchen/inventory.json` | Direct JSON load |
| Site List | `monitoring/sites.json` | Direct JSON load |
| Site Status | `monitoring/index.json` | Direct JSON load |
| Monitoring Alerts | `monitoring/ALERT_PENDING.txt` | Text file parse |

**Implementation:**
- Create `js/data-loader.js` module
- Fetch local files via relative paths (works on Cloudflare Pages)
- Add error handling for missing/malformed files
- Cache strategy: refresh every 5 minutes

#### 2.2 Time Tracking Parser (Week 1)
**Challenge:** Parse markdown logs into structured data

**Source:** `memory/timelog/*.md` files  
**Format:**
```markdown
# Time Log - Saturday, February 22, 2026
- 00:00-09:30 | Sleep
- 09:30-10:00 | Break | Morning routine
- 10:00-14:00 | Work | Client proposals + BNI followups
```

**Implementation:**
- Regex parser for time entries
- Aggregate by day/week/month/category
- Chart generation for trends
- Weekly summary calculations

#### 2.3 Google Calendar API (Week 2) ✅ IN PROGRESS (2026-02-23)
**Challenge:** OAuth authentication + API integration

**What to Fetch:**
- Today's events ✅
- Next 7 days preview ✅
- 121 meeting count (for BNI tracking) ✅
- Filter: primary calendar (ben@purplecowbrands.com) ✅

**Implementation:**
- Google Calendar API v3 ✅
- Service account (chosen for security) ✅
- Store credentials securely (Proton Pass) ✅
- Cache events for 5 minutes (via data-loader.js) ✅
- Real-time "meeting happening now" detection ✅
- Node.js fetch script (scripts/fetch-calendar.js) ✅
- Data written to data/calendar.json ✅
- Home dashboard displays calendar stats ✅

**Status:** ✅ COMPLETE (2026-02-23 5:29 PM) - Integrated into 3 dashboards:
- Home: Calendar stats, current meeting indicator, today/upcoming counts
- Sales Pipeline: Live 121 count, upcoming sales meetings table (121s, discovery, networking)
- BNI Metrics: Calendar-enhanced 121 tracking with smart meeting detection

#### 2.4 ClickUp API (Week 2-3) ✅ COMPLETE (2026-02-23 6:29 PM)
**Challenge:** Complex API, many endpoints needed

**What to Fetch:**
- All tasks across all lists ✅
- Task status (overdue, due today, upcoming) ✅
- Custom fields (for EOS scorecard, sales pipeline) - Future enhancement
- Comments/activity for recent updates - Future enhancement
- Filter by assignee (Ben) ✅

**API Endpoints:**
- `/team/{team_id}/task` - Get all tasks ✅ USED
- `/list/{list_id}/task` - Tasks by list (not needed, team endpoint covers it)
- `/task/{task_id}` - Task details (not needed for initial integration)

**Implementation:** ✅ COMPLETE
- ClickUp API v2 ✅
- API token hardcoded in fetch script (pk_94210091_QTUSFLES2AC62TZM99KGSJ86NBFR0NYZ) ✅
- Rate limit handling (pagination with 100 tasks/page) ✅
- Cache strategy: 5 minutes via data-loader.js ✅
- Task categorization by list name, due date, status ✅
- Node.js fetch script (scripts/fetch-clickup.js) ✅
- Data written to data/clickup-tasks.json ✅
- Task Overview dashboard displays live data ✅
- Shows 84 active tasks: 16 overdue, 0 due today, 67 upcoming, 1 no due date ✅

**Status:** ✅ COMPLETE (2026-02-23 6:29 PM) - Task Overview dashboard connected
- Task categorization by list: Personal Tasks (34), Overhead Work (22), Private Tasks (9), Admin (5), Sales Deals (4), BNI Followups (2)
- Priority badges (Urgent/High/Normal/Low) displayed in task table
- Recent tasks table with due dates, status badges, list names
- Data status banner shows Live Data vs Sample Data
- **Phase 2.2 milestone: ALL API INTEGRATIONS COMPLETE (Calendar + ClickUp)**

#### 2.5 Manual Data Entry Systems (Week 3) ✅ COMPLETE
**For data sources without APIs:**

| Data Type | Storage | Input Method | Status |
|-----------|---------|--------------|--------|
| BNI Metrics | `data/bni-metrics.json` | Manual weekly update form | ✅ Complete (2026-02-23 12:29 PM) |
| EOS Scorecard | `data/eos-metrics.json` | Manual weekly update form | ✅ Complete (2026-02-23 3:29 PM) |
| Financial Revenue | `data/financial.json` | Manual monthly entry | ✅ Complete (2026-02-23 2:29 PM) |
| Client MRR | `data/client-mrr.json` | Edit JSON or form | ✅ Complete (via client health) |

**Implementation:** ✅ COMPLETE
- Simple modal forms in dashboard for data entry ✅
- JSON generation with copy-to-clipboard workflow ✅
- Clear instructions for manual file updates ✅
- Eventually: direct file write via OpenClaw relay or GitHub API (Phase 5)

**All 3 manual entry dashboards now operational:**
- BNI Metrics: Chapter data, 121s, referrals, attendance
- Financial Overview: Revenue, MRR, expenses, monthly trends
- EOS Scorecard: Dynamic metrics (add/remove), weekly tracking

#### Feature Cards (Phase 2)

| Feature | Priority | Complexity | Dependencies | Status |
|---------|----------|------------|--------------|--------|
| CRM file loader | P0 | Low | None | ✅ Complete (2026-02-23) |
| Kitchen file loader | P0 | Low | None | ✅ Complete (2026-02-23) |
| Monitoring file loader | P0 | Low | None | ✅ Complete (2026-02-23) |
| Time log parser | P0 | Medium | None | ✅ Complete (2026-02-23) |
| Client health integration | P0 | Low | Monitoring + MRR data | ✅ Complete (2026-02-23) |
| Google Calendar API | P0 | High | Service account auth | ✅ Complete (2026-02-23 - 3 dashboards) |
| ClickUp API integration | P0 | High | API token | ✅ Complete (2026-02-23 6:29 PM - Task Overview dashboard) |
| Manual data entry forms | P1 | Medium | File write system | ✅ Complete (BNI, Financial, EOS - 2026-02-23) |
| Data caching layer | P0 | Medium | All loaders | ✅ Complete (built-in 5min cache) |
| Error handling UI | P1 | Low | All loaders | ✅ Complete (2026-02-23 7:29 PM - Toast notifications) |

---

### Phase 3: The Focus Engine
**Goal:** Build the "What Should I Be Doing Right Now?" core feature  
**Timeline:** 2-3 weeks  
**Priority:** CRITICAL (this is the whole point)

#### 3.1 Priority Decision Engine
**Backend logic (OpenClaw agent or frontend JS):**

**Input:**
- Current time
- Calendar events (now, next 2 hours, rest of day)
- ClickUp tasks (overdue, due today, upcoming)
- CRM interactions (pending followups, 121 targets)
- Monitoring alerts (sites down)
- Email/notification count (future)
- Time log gaps (missing entries)
- Personal context (meal prep, chores)

**Output:**
- Single highest-priority item
- Reason/context for why
- Quick action buttons (complete, snooze, skip, dismiss)
- Estimated time to complete
- Next 3 items in queue

**Priority Algorithm:**
```
1. IF meeting happening now AND not dismissed → Show meeting
2. ELSE IF site monitoring alert → Show site down alert
3. ELSE IF overdue task (sales category) → Show overdue sales task
4. ELSE IF overdue task (client work) → Show overdue client task
5. ELSE IF meeting in next 2 hours → Show meeting prep
6. ELSE IF task due today (sales) → Show sales task
7. ELSE IF task due today (client) → Show client task
8. ELSE IF BNI 121s below target → Show 121 followup prompt
9. ELSE IF time log gap (> 2 hours unlogged) → Show time log reminder
10. ELSE IF unread important email → Show email triage
11. ELSE → Show proactive work suggestion
```

#### 3.2 Focus View UI
**Design principles:**
- Full-screen takeover (like Task Randomizer)
- Big, bold text - no squinting
- Single card in center of screen
- Minimal distractions
- Quick action buttons prominent

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│           🎯 RIGHT NOW                  │
│                                         │
│   [Big Bold Task Title]                 │
│   Due: Today at 3:00 PM                 │
│   Context: Sales followup for BNI       │
│   Est. Time: 15 minutes                 │
│                                         │
│   [Mark Complete]  [Snooze]  [Skip]     │
│                                         │
│   Next up: Client call prep (2:00 PM)   │
│                                         │
└─────────────────────────────────────────┘
```

**Quick Actions:**
- **Mark Complete** → Log time spent, archive task
- **Snooze** → Remind in 30min/1hr/2hr/tomorrow
- **Skip** → Move to next task (don't snooze)
- **Dismiss** → Remove from queue (for meetings that were canceled)

#### 3.3 Context Builder
**Moo Intelligence Layer:**
- Fetch all data sources
- Apply priority algorithm
- Generate natural language context
- Example: "This is overdue by 2 days, and it's a sales followup - your highest revenue priority. You last contacted them on Feb 15."

**Data enrichment:**
- CRM lookups (last interaction, relationship strength)
- Calendar context (time until next meeting)
- Task history (how long has this been overdue?)
- Personal context (meal prep day? Need to walk Tango?)

#### Feature Cards (Phase 3)

| Feature | Priority | Complexity | Dependencies | Status |
|---------|----------|------------|--------------|--------|
| Priority algorithm logic | P0 | High | Phase 2 data | Not started |
| Focus view UI | P0 | Medium | None | ✅ Complete (2026-02-23 8:29 PM) |
| Meeting detection (now) | P0 | Medium | Calendar API | Not started |
| Quick action handlers | P0 | Medium | None | Placeholder handlers ready |
| Context builder (Moo) | P0 | High | All data sources | Not started |
| Snooze system | P1 | Medium | Local storage | Not started |
| Next-in-queue display | P1 | Low | Priority engine | ✅ Complete (built into UI) |
| Time estimation | P2 | Low | Historical data | Not started |

---

### Phase 4: Input & Feedback UI
**Goal:** Allow Ben to log actions, complete tasks, and update data from the dashboard  
**Timeline:** 2 weeks  
**Priority:** HIGH

#### 4.1 Task Completion Logging
**What to capture:**
- Time spent on task
- Notes/outcome
- Mark complete or defer
- Create followup tasks

**UI:**
```
Task: Follow up with Creating Community
─────────────────────────────────────────
Time spent: [15] minutes
Outcome: 
[Text area for notes]
□ Create followup task
─────────────────────────────────────────
[Mark Complete]  [Cancel]
```

**Backend:**
- Write to time log (`memory/timelog/YYYY-MM-DD.md`)
- Update ClickUp task status (via API)
- Optional: create new ClickUp task for followup

#### 4.2 Time Entry Interface
**Quick log from dashboard:**
- Current time auto-filled
- Category dropdown (Work, Personal, Break, Sleep)
- Description field
- Duration or start/end time

**UI:**
```
Log Time Entry
─────────────────────────────────────────
Time: [14:00] - [15:30]
Category: [Work ▼]
Description: [Client proposal + followup calls]
─────────────────────────────────────────
[Save]  [Cancel]
```

**Backend:**
- Append to today's time log file
- Recalculate daily totals
- Update time tracking dashboard

#### 4.3 Meeting Feedback
**After meeting ends:**
- Rate the meeting (valuable/waste of time)
- Log outcome/next steps
- Create followup tasks

**UI:**
```
Meeting: 121 with Aaron Hale
─────────────────────────────────────────
How was it? [⭐⭐⭐⭐⭐]
Notes:
[Text area]
Next steps:
[Create followup task]
─────────────────────────────────────────
[Done]
```

**Backend:**
- Write to CRM interaction log
- Create ClickUp tasks for followups
- Update BNI 121 count

#### 4.4 Quick Captures
**Rapid task creation:**
- Voice-to-text input (future)
- Single-line task creation
- Smart defaults (assign to Ben, today's date)

**UI:**
```
Quick Add Task
─────────────────────────────────────────
[Text input: "Follow up with John about referrals"]
Category: [BNI Followups ▼]
Due: [Today ▼]
─────────────────────────────────────────
[Add]  [Cancel]
```

**Backend:**
- Create ClickUp task via API
- Add to CRM interaction log if contact mentioned
- Refresh task list

#### Feature Cards (Phase 4)

| Feature | Priority | Complexity | Dependencies | Status |
|---------|----------|------------|--------------|--------|
| Task completion form | P0 | Medium | Phase 3 | Not started |
| Time entry UI | P0 | Medium | Time log parser | Not started |
| Write to time log file | P0 | Medium | File write system | Not started |
| Meeting feedback form | P1 | Medium | Calendar API | Not started |
| Quick task creation | P1 | Low | ClickUp API | Not started |
| Voice input (future) | P2 | High | Speech-to-text | Not started |

---

### Phase 5: Write Capabilities
**Goal:** Full read/write integration - create and update across all systems  
**Timeline:** 3-4 weeks  
**Priority:** MEDIUM

#### 5.1 Calendar Event Creation
**Use cases:**
- Schedule 121 meetings from CRM
- Block time for deep work
- Create sales calls

**UI:**
```
Create Calendar Event
─────────────────────────────────────────
Title: [121 with Aaron Hale]
Date: [Feb 25, 2026]
Time: [2:00 PM] - [3:00 PM]
Calendar: [Primary ▼]
Description: [Optional notes]
─────────────────────────────────────────
[Create]  [Cancel]
```

**Backend:**
- Google Calendar API (create event)
- Add to CRM interaction log
- Increment BNI 121 count

#### 5.2 ClickUp Task Management
**Full CRUD:**
- Create tasks
- Update task status
- Change due dates
- Add comments
- Assign to team members

**UI:**
```
Edit Task: Follow up with Creating Community
─────────────────────────────────────────
Status: [Backlog ▼]
Due Date: [Feb 25, 2026]
Assignee: [Ben Porter]
Description:
[Text area]
Comments:
[Add comment...]
─────────────────────────────────────────
[Save]  [Cancel]
```

**Backend:**
- ClickUp API (update task)
- Sync changes back to dashboard
- Optimistic UI updates

#### 5.3 CRM Updates
**What to update:**
- Add new contacts
- Log interactions
- Update contact details
- Track introductions

**UI:**
```
Add Interaction
─────────────────────────────────────────
Contact: [Search contacts... ▼]
Type: [Text ▼]  (Call, Email, Meeting, Text)
Date: [Today]
Notes:
[Text area]
─────────────────────────────────────────
[Save]  [Cancel]
```

**Backend:**
- Write to `crm/interactions.json`
- Update last contact date in `crm/contacts.json`
- Refresh CRM dashboard

#### 5.4 File Write System
**Challenge:** Cloudflare Pages is static hosting  
**Solutions:**
1. **Serverless API** (Cloudflare Workers + R2 storage)
2. **GitHub API** (commit directly to repo)
3. **OpenClaw relay** (send commands to agent, agent writes files)

**Recommended:** OpenClaw relay
- Agent already has file write access
- No new infrastructure needed
- Can leverage existing queue system
- Agent can validate and enrich data before writing

**Flow:**
```
Dashboard UI → WebSocket/HTTP to OpenClaw → Agent processes → Writes to files → Commits to git → Auto-deploys
```

#### Feature Cards (Phase 5)

| Feature | Priority | Complexity | Dependencies | Status |
|---------|----------|------------|--------------|--------|
| Calendar event creation | P0 | High | Calendar API | Not started |
| ClickUp task creation | P0 | Medium | ClickUp API | Not started |
| ClickUp task updates | P1 | Medium | ClickUp API | Not started |
| CRM interaction logging | P1 | Medium | File write system | Not started |
| CRM contact creation | P1 | Low | File write system | Not started |
| OpenClaw relay setup | P0 | High | None | Not started |
| File write validation | P1 | Medium | OpenClaw relay | Not started |
| Git auto-commit on write | P1 | Low | OpenClaw relay | Not started |

---

### Phase 6: Polish & Advanced Features
**Goal:** Make the app delightful and powerful  
**Timeline:** Ongoing  
**Priority:** LOW (nice-to-haves)

#### 6.1 Notifications & Reminders
- Browser notifications (with permission)
- Push notifications (PWA)
- Slack/Telegram notifications (via OpenClaw)
- Meeting reminders (15 min before)

#### 6.2 Keyboard Shortcuts
- Focus view: `Space` = complete, `S` = snooze, `N` = next
- Navigation: `Cmd+1-9` for dashboards
- Quick capture: `Cmd+K` to open task creation
- Search: `Cmd+F` for global search

#### 6.3 Mobile Optimizations
- PWA install prompt
- Offline mode (cached data)
- Touch gestures (swipe to complete/skip)
- Home screen widget (iOS/Android)

#### 6.4 Analytics & Insights
- Time tracking trends (weekly/monthly comparisons)
- Sales pipeline velocity (conversion rates, avg deal time)
- BNI effectiveness (121s → referrals → closed deals)
- Productivity patterns (best hours for deep work)

#### 6.5 Voice Interface
- Voice commands ("What should I do now?")
- Voice task creation
- Voice note transcription (already works via Whisper)
- Read tasks aloud (accessibility)

#### 6.6 AI Enhancements
- Smart task prioritization (ML-based, learns from Ben's patterns)
- Natural language queries ("Show me all overdue sales tasks")
- Predictive scheduling (suggest best times for 121s)
- Email auto-categorization (important vs. noise)

#### 6.7 Integrations
- Email (Gmail API for inbox triage)
- Slack (team notifications)
- Accounting software (QuickBooks, Xero)
- SMS (Twilio for text followups)

#### Feature Cards (Phase 6)

| Feature | Priority | Complexity | Dependencies | Status |
|---------|----------|------------|--------------|--------|
| Browser notifications | P2 | Low | None | Not started |
| Keyboard shortcuts | P2 | Low | None | Not started |
| PWA install prompt | P2 | Low | None | Not started |
| Offline mode | P2 | High | Service worker | Not started |
| Time tracking analytics | P2 | Medium | Phase 2 | Not started |
| Voice commands | P3 | High | Speech API | Not started |
| Gmail integration | P2 | High | Gmail API | Not started |
| Predictive scheduling | P3 | Very High | ML model | Not started |

---

## Ideas Backlog (Unsorted Future Ideas)

**Random brainstorming - no priority assigned yet:**

### Data Management & UX (New Ideas 2026-02-23)
- **Manual data refresh button** - Force refresh without page reload (clear cache + reload current dashboard)
- **CRM contact search/filter** - With 116K+ contacts, need search by name/company/tag/relationship
- **Interaction timeline view** - Visual timeline of all interactions with a contact
- **Interaction filtering** - Filter by type (call/email/meeting/text), date range, contact
- **Bulk contact actions** - Tag multiple contacts, batch export, cleanup tools
- **Contact deduplication** - Find and merge duplicate entries (many from Google import)
- **Relationship strength indicator** - Visual score based on interaction frequency, recency, depth
- **Last contact date highlighting** - Color-code contacts by how long since last touch (red = >30 days, yellow = 7-30, green = <7)

### Original Ideas

- **Habit tracking** - Daily push-ups, dog walks, meal prep, sleep quality
- **Energy level tracking** - Correlate with productivity patterns
- **Focus mode** - Block distracting websites during deep work sessions
- **Pomodoro timer** - Integrated with time tracking
- **Weekly review** - Automated summary of accomplishments, gaps, next week planning
- **Delegation tracker** - Tasks assigned to team members, follow-up reminders
- **Client satisfaction score** - Track NPS or simple ratings per client
- **Referral source attribution** - Which BNI members send the best leads?
- **Meeting cost calculator** - Show $ value of time spent in meetings
- **Auto-decline low-value meetings** - Suggest declining based on patterns
- **Smart batching** - Group similar tasks together (all sales calls, all admin work)
- **Context switching penalty** - Warn when jumping between very different task types
- **Personal OKRs** - Track quarterly goals (fitness, finance, family)
- **Vacation mode** - Auto-snooze everything, OOO responders
- **Emergency mode** - If sites down, override all priorities
- **Team dashboard** - View for Leidy, Catherine, Paula (their tasks/workload)
- **Client portal** - Let clients see their project status (future, maybe)
- **Automated prospecting** - Scrape LinkedIn, send to CRM automatically
- **Follow-up cadence automation** - Auto-schedule 3-touch sequences
- **Meeting agenda templates** - Pre-fill agendas based on meeting type
- **Post-meeting action items** - Auto-create tasks from meeting notes
- **Weekly BNI prep** - Auto-generate talking points, visitor intros, 121 invites
- **Gratitude journal** - Daily prompt, stored in memory
- **Win logging** - Celebrate small wins, build positive momentum
- **Family calendar integration** - Sheenah's schedule, date nights
- **Dog care reminders** - Tango's vet appointments, grooming
- **Book/podcast tracker** - What Ben's reading/listening to
- **Recipe database** - Expand kitchen dashboard with full recipe library
- **Grocery price tracker** - Compare stores, optimize shopping
- **Meal prep automation** - Generate shopping lists from recipes
- **Inventory expiration alerts** - Use-by dates for fridge items
- **Fitness tracker integration** - Strava, Apple Health, Garmin
- **Sleep quality correlation** - Sleep score vs. productivity next day
- **Weather-based suggestions** - "Good day for a run with Tango"
- **Church small group scheduler** - Track attendance, prayer requests
- **Bible reading plan tracker** - Daily scripture, progress
- **Oregon move timeline** - Countdown, tasks, planning
- **Net worth dashboard** - Assets, liabilities, investment performance
- **Retirement planning** - On track for goals?
- **Tax deduction tracker** - Categorize expenses for tax season
- **Contract renewal reminders** - Client contracts expiring soon
- **Domain expiration alerts** - Renew before they lapse
- **SSL certificate monitoring** - Auto-renew warnings
- **Competitor monitoring** - Track rival agencies, learn from them
- **Industry news aggregator** - Web design, SEO, local business trends
- **Learning goals** - Courses, certifications, skill development
- **Network map** - Visualize BNI connections, referral paths
- **Power team tracker** - Who's sending referrals, who needs help?
- **One-on-one themes** - Topics to discuss in 121s (avoid small talk)
- **Client gifting tracker** - Birthdays, anniversaries, thank-you gifts
- **Testimonial collector** - Request + store client reviews
- **Case study builder** - Document wins for marketing
- **Portfolio showcase** - Best sites, before/after comparisons
- **Pricing calculator** - Quote generator for proposals
- **Proposal templates** - Pre-filled based on project type
- **Contract generator** - Fill-in-the-blank agreements
- **Invoice automation** - Auto-send monthly invoices
- **Payment reminders** - Overdue invoice alerts
- **Cash flow forecasting** - Predict revenue 3-6 months out
- **Burn rate monitor** - How long until runway runs out?
- **Hiring pipeline** - When to hire next person, what role?
- **Team performance** - Individual metrics, workload balance
- **1-on-1s with team** - Scheduled check-ins, talking points
- **Feedback tracker** - Document performance feedback over time
- **Training plan** - Onboarding new hires, skill development
- **Tool stack audit** - What software is worth the cost?
- **Process documentation** - SOPs for recurring tasks
- **Automation opportunities** - What can be scripted/delegated?
- **Bottleneck analysis** - Where is work getting stuck?
- **Client acquisition cost** - CAC by channel (BNI, referrals, etc.)
- **Lifetime value** - LTV by client type, industry
- **Churn analysis** - Why do clients leave?
- **Upsell tracker** - Expansion revenue opportunities
- **Retention campaigns** - Re-engage dormant clients
- **Win-back sequences** - Automated outreach to lost clients
- **Referral incentive program** - Track who refers, reward them
- **Partner dashboard** - Kevin's view (CEO priorities)
- **Board meeting prep** - Monthly review slides auto-generated
- **Investor updates** - Quarterly performance summaries (if fundraising)
- **Exit planning** - Valuation tracking, acquisition readiness (way future)

---

## Technical Debt & Infrastructure

**Items to track for long-term health:**

- **Authentication layer** - Add login before making dashboard public
- **API rate limit handling** - Graceful degradation when limits hit
- **Error logging** - Sentry or similar for production errors
- **Performance monitoring** - Page load times, API response times
- **Database migration** - Move from flat files to database (if needed at scale)
- **Backup strategy** - Auto-backup CRM, kitchen data, time logs
- **Version control** - Tag releases, maintain changelog
- **Testing** - Unit tests, integration tests, E2E tests (currently zero)
- **Documentation** - API docs, user guide, developer onboarding
- **Security audit** - Third-party review before adding auth
- **Accessibility compliance** - WCAG 2.1 AA standards
- **Browser compatibility** - Test on Safari, Firefox, mobile browsers
- **Dependency updates** - Keep libraries current, security patches
- **Code refactoring** - Clean up tech debt as features stabilize
- **Performance optimization** - Lazy loading, code splitting, caching

---

## Success Criteria (How We Know It's Working)

**Quantitative Metrics:**
- Ben opens the app daily (track usage)
- Focus view used > 80% of the time (not individual dashboards)
- Task completion rate increases by 30%
- Time spent "figuring out what to work on" decreases by 80%
- Missed meetings/deadlines drop to zero
- BNI 121 target hit weekly (6+)
- Sales followup response time < 24 hours

**Qualitative Feedback:**
- Ben reports feeling less overwhelmed
- Decision fatigue reduced ("I just do what it tells me")
- More time for high-value work (sales, relationships)
- Less time on admin/maintenance
- Confidence that nothing is slipping through cracks
- Actually enjoys using the dashboard (not a chore)

**Key Indicators of Failure:**
- Ben stops using it after 2 weeks
- "Too much clicking" to get to action
- Data is stale/inaccurate (lost trust)
- Doesn't save time vs. current workflow
- Adds complexity instead of reducing it

---

## Open Questions & Decisions Needed

**Architecture:**
- [ ] File write system: Cloudflare Workers vs. GitHub API vs. OpenClaw relay? (Recommend: OpenClaw relay)
- [ ] Authentication: Skip for MVP or add early?
- [ ] Database: Stay with flat files or migrate to PostgreSQL/SQLite?

**Data Sources:**
- [ ] Email integration: Worth the complexity? Start with manual triage?
- [ ] Financial data: Manual entry or connect to QuickBooks/Xero?
- [ ] Team tasks: Track others' ClickUp tasks or just Ben's?

**UX:**
- [ ] Focus view: Full-screen takeover or embedded in dashboard?
- [ ] Mobile: PWA install or web app only?
- [ ] Voice: Worth building or use existing tools (Siri shortcuts)?

**Scope:**
- [ ] Multi-user: Just Ben or eventually for Kevin, Leidy, Catherine, Paula?
- [ ] Client-facing: Could clients log in to see their project status?
- [ ] White-label: Could this be productized for other agencies?

**Priorities:**
- [ ] What is the ABSOLUTE minimum for Phase 3 (Focus Engine) to be useful?
- [ ] Can we ship Focus Engine before completing all of Phase 2 data connections?
- [ ] Should we prioritize mobile or desktop first?

---

## Contributors & Credits

**Built by:**
- Moo (OpenClaw AI agent) - System design, development, roadmap
- Ben Porter - Vision, requirements, UX feedback

**Inspired by:**
- Task Randomizer (Ben's previous app) - Minimalist focus design
- EOS (Entrepreneurial Operating System) - Business metrics framework
- BNI (Business Network International) - Networking methodology
- Getting Things Done (GTD) - Task management philosophy

**Tech Stack:**
- Vanilla JavaScript (no heavy frameworks)
- Chart.js (visualizations)
- Lucide Icons (UI icons)
- Cloudflare Pages (hosting)
- GitHub (version control)
- OpenClaw (AI orchestration)

---

## Changelog

**2026-02-23 (8:29 PM):**
- Phase 3 started - Focus Engine UI shell complete
- Created focus.js dashboard module with big, bold single-task interface
- Full-screen card design inspired by Task Randomizer aesthetic
- Sample data showing how priority items will be displayed
- Quick action buttons (Complete, Snooze, Skip) with placeholder handlers
- Next-in-queue preview showing upcoming 3 items
- 'All Clear' state for when no urgent items exist
- Smart status text (overdue by X days, due today at TIME, etc.)
- Priority-based styling (urgent tasks get red border + gradient)
- Added comprehensive CSS styles for Focus view
- Integrated into sidebar navigation (second item after Home, zap icon)
- Mobile responsive design with stacked action buttons
- Dark mode support
- **Phase 3 progress: Focus view UI complete (P0), priority algorithm next**
- Next step: Implement priority algorithm to connect Calendar/ClickUp/CRM data

**2026-02-23 (5:29 PM):**
- Calendar integration expansion - Sales Pipeline + BNI Metrics now calendar-connected
- Sales Pipeline dashboard: Live 121 count from calendar + upcoming sales meetings table
- BNI Metrics dashboard: Calendar-enhanced 121 tracking with smart detection
- Smart meeting detection algorithm (matches "121", "1:1", "1-1", "one-on-one", "BNI 1-1")
- Data status indicators: Live/Calendar-Enhanced/Sample states
- Updated app.js router to use renderSalesAsync for async calendar fetching
- Seamless fallback to sample data when calendar unavailable
- **Phase 2.2 milestone: Calendar API now integrated into 3 dashboards (Home, Sales, BNI)**
- Tested with real calendar data: accurately detecting 0 121s this week (Ben traveling)

**2026-02-23 (3:29 PM):**
- EOS Scorecard manual data entry system complete (Phase 2.5 complete!)
- Created eos-metrics.json with initial 6 metrics
- Full-featured modal form with dynamic metric management (add/remove)
- Generate JSON + copy-to-clipboard workflow
- Live data loading with sample data fallback
- Data status banner (Live Data vs Sample Data)
- **Phase 2.5 milestone: All 3 manual entry systems complete (BNI, Financial, EOS)**
- Ready to start Phase 2 API integrations (Google Calendar or ClickUp next)

**2026-02-23 (1:29 PM):**
- Home/Overview dashboard connected to live data (Phase 2 aggregation)
- Aggregates data from all 5 live sources: CRM, Monitoring, Client Health, Kitchen, BNI, Time Tracking
- Shows live vs sample data indicators on each stat card
- Data status banner shows "X/Y sources connected" at page top
- Recent interactions pulled from live CRM data (sorted by date, top 3)
- Parallel data fetching using Promise.all for fast loading
- Graceful fallback to sample data for disconnected sources
- Phase 2 progress: 6 of 11 dashboards using live data (Home, CRM, Monitoring, Client Health, Kitchen, BNI, Time Tracking)

**2026-02-23 (12:29 PM):**
- BNI Metrics manual data entry system complete (Phase 2.5)
- Created bni-metrics.json with Champions Dallas chapter data
- Full-featured modal form with all BNI metric fields
- Generate JSON + copy-to-clipboard workflow
- Live data loading with sample data fallback
- Data status banner (Live Data vs Sample Data)
- First manual entry system complete - demonstrates pattern for EOS/Financial forms

**2026-02-23 (11:29 AM):**
- Client Health dashboard connected to live workspace data
- Created client-mrr.json with MRR for all 32 sites ($8,800 total)
- Added getClientHealthData() to data-loader.js
- Health status calculated from monitoring status + MRR (healthy/at-risk/critical)
- Displays 6 upsell opportunities with potential $1,500/month revenue
- Platform distribution shows 13 Framer, 12 WordPress, 1 Shopify sites
- Phase 2.1 progress: 5 of 10 local file integrations complete (Kitchen, CRM, Monitoring, Time Tracking, Client Health)

**2026-02-23 (8:29 AM):**
- Site Monitoring dashboard connected to live workspace data
- Created sync-monitoring-status.ps1 to parse monitoring logs
- Extracts real site status (up/down) and response times from latest monitoring run
- Dashboard now shows actual monitoring data for all 32 client sites
- Sites correctly sorted by status (down/warning first, then alphabetical)
- Phase 2.1 progress: 3 of 10 local file integrations complete (Kitchen, CRM, Monitoring)

**2026-02-23 (7:29 AM):**
- CRM dashboard connected to live workspace data (116K+ contacts loaded)
- Successfully loading contacts.json, interactions.json, introductions.json
- Data transformation layer: calculates recent interactions (last 7 days), top contacts by interaction count
- Fixed data-loader.js to handle array-based JSON files (not just object-wrapped)
- Phase 2.1 progress: 2 of 10 local file integrations complete (Kitchen + CRM)

**2026-02-23 (12:29 AM):**
- Kitchen dashboard connected to live workspace data
- First Phase 2 feature complete - local file integration working
- Async rendering infrastructure in place for all dashboards
- Data status banners showing live vs sample data
- Graceful fallback system working
- CRM, Kitchen, and Monitoring data files copied to /data directory
- All local files now accessible by dashboards via data-loader.js

**2026-02-22 (11:29 PM):**
- Site Monitoring page redesigned per Ben's feedback
- Changed layout from two-column to big list + compact sidebar
- Sites table now the primary focus (full-width, prominent)
- Platform chart moved to compact sidebar (secondary)
- Sites sorted by status (warnings/down at top, healthy below)
- Improved hover effects and visual hierarchy
- Condensed spacing for less scrolling
- KPI cards kept at top (Ben specifically approved these)
- Live data integration structure ready via data-loader.js

**2026-02-22 (earlier):**
- Initial roadmap created
- Defined 6-phase implementation plan
- Documented vision, architecture, and feature priorities
- Backlog seeded with 100+ future ideas
- Phase 1 marked complete (foundation built)
