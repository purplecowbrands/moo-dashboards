# Deployment Guide

Step-by-step instructions for deploying the Website Commenter Tool to Cloudflare Workers.

## Prerequisites

- Cloudflare account
- `wrangler` CLI installed (optional, can use dashboard)
- Node.js 16+ (only if using wrangler CLI)

## Option 1: Deploy via Cloudflare Dashboard (Easiest)

### Step 1: Create KV Namespace

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** in left sidebar
3. Click **KV** tab
4. Click **Create namespace**
5. Name it: `COMMENTER_DATA`
6. Click **Add**
7. Copy the **Namespace ID** (you'll need this later)

### Step 2: Create Worker

1. Still in Workers & Pages, click **Create Application**
2. Select **Create Worker**
3. Name it: `commenter` (or your preferred name)
4. Click **Deploy**
5. After deployment, click **Edit Code**
6. Delete all default code
7. Copy/paste the entire contents of `worker.js` from this directory
8. Click **Save and Deploy**

### Step 3: Bind KV Namespace to Worker

1. Go back to your worker overview (click the worker name)
2. Click **Settings** tab
3. Click **Variables** in left sidebar
4. Scroll down to **KV Namespace Bindings**
5. Click **Add binding**
6. Variable name: `COMMENTER_KV`
7. KV namespace: Select `COMMENTER_DATA` (the one you created)
8. Click **Deploy**

### Step 4: Set Worker URL (Optional)

If you want the embed script to be pre-configured with your worker URL:

1. Still in Settings > Variables
2. Scroll to **Environment Variables**
3. Click **Add variable**
4. Variable name: `WORKER_URL`
5. Value: Your full worker URL (e.g., `https://commenter.yoursubdomain.workers.dev`)
6. Click **Deploy**

### Step 5: Test Your Worker

1. Visit your worker URL: `https://commenter.yoursubdomain.workers.dev`
2. You should see the admin login page
3. Enter any password (this sets your admin password on first login)
4. You should see the empty admin dashboard

### Step 6: Add to Your Website

Copy this script tag and add it to your website:

```html
<script src="https://commenter.yoursubdomain.workers.dev/embed.js"></script>
```

For domain restriction (recommended for Framer):

```html
<script src="https://commenter.yoursubdomain.workers.dev/embed.js" data-allowed-domains="framer.app"></script>
```

## Option 2: Deploy via Wrangler CLI

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### Step 3: Create KV Namespace

```bash
wrangler kv:namespace create "COMMENTER_KV"
```

Copy the namespace ID from the output.

### Step 4: Update wrangler.toml

Edit `wrangler.toml` and uncomment the KV namespace section, adding your ID:

```toml
[[kv_namespaces]]
binding = "COMMENTER_KV"
id = "your-namespace-id-here"
```

### Step 5: Deploy

```bash
wrangler deploy
```

The worker will be deployed and you'll get your worker URL.

### Step 6: Test

Visit your worker URL to confirm it's working.

## Updating the Worker

Whenever you make changes to `worker.js`:

**Dashboard method:**
1. Go to your worker in Cloudflare dashboard
2. Click **Edit Code**
3. Paste updated code
4. Click **Save and Deploy**

**CLI method:**
```bash
wrangler deploy
```

## Resetting Admin Password

If you forget your admin password:

1. Go to Workers & Pages > KV > Your namespace
2. Find the key `admin_password`
3. Click the three dots > Delete
4. Visit the admin dashboard and enter a new password (this will be your new password)

## Custom Domain (Optional)

To use a custom domain like `commenter.yourdomain.com`:

### Dashboard Method:

1. Go to your worker settings
2. Click **Triggers** tab
3. Under **Custom Domains**, click **Add Custom Domain**
4. Enter your domain: `commenter.yourdomain.com`
5. Click **Add Custom Domain**
6. Cloudflare will handle DNS automatically if your domain uses Cloudflare DNS

### CLI Method:

Add to `wrangler.toml`:

```toml
routes = [
  { pattern = "commenter.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

Then redeploy with `wrangler deploy`.

## Monitoring and Limits

### Free Plan Limits (as of 2026):

- **Requests**: 100,000 requests/day
- **KV Reads**: 100,000/day
- **KV Writes**: 1,000/day
- **KV Storage**: 1 GB

For most use cases (10-20 client sites with moderate commenting), this is plenty.

### Monitoring:

1. Go to your worker in Cloudflare dashboard
2. View metrics: requests, errors, CPU time
3. Check KV usage in the KV namespace view

## Troubleshooting Deployment

### "KV namespace not found"

- Make sure you created the KV namespace
- Check the binding name is exactly `COMMENTER_KV`
- Verify the namespace ID is correct in settings

### "Worker script too large"

- The worker.js file should be under 1MB (we're well under this)
- If you hit this, you may have accidentally pasted duplicate code

### "CORS errors" in browser console

- This shouldn't happen with our setup (we use `*` for CORS)
- If you see CORS errors, check that you deployed the latest `worker.js`

### Embed script shows 404

- Verify your worker URL is correct
- Check that the worker deployed successfully
- Try accessing `/embed.js` directly in your browser

## Next Steps

After deployment:

1. Test with the included `test.html` file
2. Add to your Framer site (see README.md - Framer Integration)
3. Share the worker URL with your team
4. Add custom domain (optional)
5. Monitor usage in Cloudflare dashboard

## Security Notes

- Admin password is stored in plain text in KV (v1 implementation)
- For production with sensitive sites, consider:
  - Hashing passwords (bcrypt)
  - Adding rate limiting
  - Restricting CORS to specific origins
  - Using Cloudflare Access for admin dashboard

## Cost Estimates

**Free tier** should handle:
- 10-20 client sites
- 100+ comments per day
- Unlimited admin dashboard views (reads are free until 100K/day)

**Paid tier** ($5/month Workers Paid) increases limits significantly:
- 10 million requests/day
- No KV limits

For a small agency, the free tier is sufficient.
