/*
  Fetch pending feedback/actions from Moo feedback platform.
  Used by automation/cron jobs every 3 hours.

  Env:
  - FEEDBACK_API_URL (required)
  - FEEDBACK_API_TOKEN (optional, if worker enforces auth)
  - FEEDBACK_MODULE (optional, defaults to roadmap)
*/

const apiUrl = process.env.FEEDBACK_API_URL;
const apiToken = process.env.FEEDBACK_API_TOKEN;
const moduleName = process.env.FEEDBACK_MODULE || 'roadmap';

if (!apiUrl) {
  console.error('FEEDBACK_API_URL is required');
  process.exit(1);
}

async function main() {
  const url = new URL('/api/feedback/queue', apiUrl);
  url.searchParams.set('module', moduleName);
  url.searchParams.set('limit', '100');

  const headers = {};
  if (apiToken) headers.authorization = `Bearer ${apiToken}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Queue fetch failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
