# moo-dashboards

Moo's internal dashboards and analytics.

## Feedback Backend (Cloudflare Worker + D1)

This repo includes a generic input-output backend for dashboard actions and Ben feedback.

See: `FEEDBACK-PLATFORM.md`

### Quick deploy

```bash
cd worker
npx wrangler d1 create moo_feedback
# put returned database_id into wrangler.toml
npx wrangler d1 migrations apply moo_feedback --remote
npx wrangler deploy
```

### Worker env vars

- `ALLOWED_ORIGIN` - dashboard origin (or `*`)
- `CRON_API_TOKEN` - optional Bearer token for queue/ack endpoints

### Dashboard config

Set API URL in browser once (or inject via `window.MOO_FEEDBACK_API`):

```js
localStorage.setItem('moo-feedback-api', 'https://moo-feedback-api.<subdomain>.workers.dev')
```

Roadmap now reads/writes backend state via this API.

### 3-hour automation source of truth

Use:

```bash
npm run feedback:queue
```

With env vars:
- `FEEDBACK_API_URL`
- `FEEDBACK_API_TOKEN` (if required)
- `FEEDBACK_MODULE` (optional, defaults to `roadmap`)

Automation should prioritize queued feedback items before non-critical dashboard work.
