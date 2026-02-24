# Feedback Platform (Generic Input-Output Backend)

This repo now uses a generic Cloudflare Worker + D1 backend for all dashboard write events.

## Goals

- Backend is source of truth (not localStorage)
- Shared schema across modules (roadmap, tasks, calendar, kitchen, chat, future)
- Queue endpoint for automation and cron prioritization
- Local fallback in UI only when backend is unavailable

## API Contract

### POST `/api/events`
Write an event + update state store.

Body:
```json
{
  "module": "roadmap",
  "actionType": "review_comment_updated",
  "entityType": "feature",
  "entityId": "focus-live-timer",
  "payload": { "reviewComment": "Looks good, tighten spacing" },
  "source": "dashboard-ui",
  "clientTimestamp": "2026-02-24T13:00:00.000Z",
  "requiresAttention": 1
}
```

Required fields:
- `module`
- `actionType`
- `entityId`

### GET `/api/state/:module`
Read current state snapshot for a module.

Example:
- `/api/state/roadmap`
- `/api/state/tasks`
- `/api/state/calendar`

Response item shape:
```json
{
  "module": "roadmap",
  "entityType": "feature",
  "entityId": "focus-live-timer",
  "state": { "status": "review", "reviewComment": "..." },
  "updatedAt": "2026-02-24 12:58:21"
}
```

### GET `/api/feedback/queue?module=roadmap&limit=100`
Returns unacked items where `requiresAttention = 1`.

Optional query filters:
- `module`
- `actionType`
- `limit`

### POST `/api/feedback/ack/:id`
Mark queue item as acknowledged by automation.

## Storage Schema (D1)

### `events`
Append-only event log.
- `module`, `action_type`, `entity_type`, `entity_id`
- `payload_json`
- `requires_attention`
- `acked_at`

### `state_store`
Current materialized state by `(module, entity_type, entity_id)`.

This allows new dashboards to plug in without schema rewrite.

## Extension Pattern (for new dashboards)

1) Choose module name: `tasks`, `calendar`, `kitchen`, `chat`, etc.
2) Emit events to `/api/events` with:
   - module
   - actionType
   - entityType
   - entityId
   - payload
3) Set `requiresAttention=1` when Ben feedback or correction needs automation handling.
4) Read module state from `/api/state/:module`.
5) Cron polls `/api/feedback/queue` and handles by module/action.

## Current implementation status

- Implemented client: `roadmap` dashboard
- Roadmap writes status changes/comments to backend via shared `/api/events`
- Roadmap bootstraps state from `/api/state/roadmap`
- If backend is down, local queue persists and replays when backend returns

## 3-hour cron usage

Cron should run:

1) `npm run feedback:queue`
2) Prioritize returned items first (especially roadmap module for now)
3) Process item
4) ACK item using `/api/feedback/ack/:id`

Suggested env vars for cron runtime:
- `FEEDBACK_API_URL`
- `FEEDBACK_API_TOKEN` (if enabled)
- `FEEDBACK_MODULE=roadmap` (or omit/filter in your orchestrator)
