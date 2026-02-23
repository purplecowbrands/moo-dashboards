# Website Commenter Tool - Build Summary

## ✅ What Was Built

A complete website feedback/commenting system similar to SimpleCommenter, optimized for Framer sites and client review workflows.

### Core Features Implemented

1. **Click-to-Comment Interface**
   - Floating 💬 button (bottom-right)
   - Click anywhere on page to place comment pins
   - Color-coded pins: Red (open), Green (resolved), Gray (closed)
   - No login required for visitors

2. **Screenshot Capture (Your Requirement #2a)**
   - Automatically captures full page screenshot when comment is submitted
   - Uses html2canvas library (loaded from CDN)
   - Stores screenshot with scroll position metadata
   - Admin can see exactly where comment was placed with visual overlay
   - Works even if page changes later (archival)

3. **Domain Restriction (Your Requirement #1)**
   - Script tag accepts `data-allowed-domains` attribute
   - Perfect for Framer: show on `.framer.app` staging, hide on custom domain
   - Client-side filtering (no unnecessary API calls on production sites)
   - Supports exact match and subdomain wildcards

4. **Admin Dashboard**
   - Password-protected (first login sets password)
   - View all comments across all sites
   - Filter by site, status, date
   - Click "View Screenshot" to see captured page with pin overlay
   - Update comment status (open/resolved/closed)
   - Delete comments
   - Export to CSV

5. **File Attachments**
   - Upload images/files with comments
   - Displayed in admin dashboard
   - Stored as base64 in Cloudflare KV

### Tech Stack

- **Frontend**: Vanilla JavaScript (no build tools needed)
- **Screenshot**: html2canvas 1.4.1 (CDN)
- **Backend**: Cloudflare Workers
- **Storage**: Cloudflare KV (comments + screenshots + attachments as base64)
- **Deployment**: Simple script tag - paste and go

## 📁 Files Created

Located in `moo-dashboards/tools/commenter/`:

1. **worker.js** (36KB)
   - Cloudflare Worker with all API endpoints
   - Serves embed script dynamically
   - Admin dashboard HTML/CSS/JS inline
   - Screenshot preview with pin overlay

2. **embed.js** (14KB)
   - Client-side embed script
   - Domain filtering logic
   - html2canvas integration
   - Comment submission with screenshot capture

3. **README.md** (10KB)
   - Complete documentation
   - Feature list, architecture, API endpoints
   - Framer integration guide
   - Usage instructions for visitors and admins

4. **DEPLOYMENT.md** (6KB)
   - Step-by-step deployment to Cloudflare
   - Dashboard method and CLI method
   - KV namespace setup
   - Custom domain configuration
   - Troubleshooting guide

5. **wrangler.toml** (0.5KB)
   - Cloudflare Workers configuration
   - Ready for `wrangler deploy`

6. **test.html** (6.5KB)
   - Test page with sample content
   - Multiple colored sections for testing pins
   - Scroll test section
   - Instructions for testing all features

## 🚀 Deployment Status

- ✅ Code committed to GitHub: `main` branch
- ✅ Located at: `tools/commenter/`
- ❌ Not yet deployed to Cloudflare (waiting for your deployment)

## 📋 Next Steps for Deployment

### Option 1: Cloudflare Dashboard (Easiest, No CLI)

1. Create KV namespace in Cloudflare dashboard
2. Create new Worker
3. Copy/paste `worker.js` content
4. Bind KV namespace to worker (variable name: `COMMENTER_KV`)
5. Deploy
6. Visit worker URL to set admin password

**Time:** ~10 minutes

### Option 2: Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler kv:namespace create "COMMENTER_KV"
# Update wrangler.toml with namespace ID
wrangler deploy
```

**Time:** ~5 minutes (if you have Node.js)

## 🎯 Framer Integration

Once deployed, add this to Framer's Custom Code (End of `<body>` tag):

```html
<script src="https://your-worker-url.workers.dev/embed.js" data-allowed-domains="framer.app"></script>
```

This will:
- ✅ Show commenter tool on `yoursite.framer.app` (staging)
- ❌ Hide commenter tool on `yourcustomdomain.com` (production)

## 🔍 How It Solves Your Requirements

### Requirement 1: Domain Restriction
**Solution:** `data-allowed-domains` attribute filters client-side before any UI renders.

```html
<!-- Only on Framer staging -->
<script src="..." data-allowed-domains="framer.app"></script>

<!-- Multiple domains -->
<script src="..." data-allowed-domains="staging.example.com,preview.example.com"></script>

<!-- Everywhere -->
<script src="..."></script>
```

### Requirement 2a: Screenshot Capture (Preferred)
**Solution:** html2canvas automatically captures page screenshot on comment submission.

- Captures full viewport at exact scroll position
- Stores screenshot metadata (dimensions, scroll position)
- Admin sees screenshot with pin overlay
- Works even if page changes later (archival)

### Requirement 2b: Live Preview (Bonus)
**Solution:** iframe preview endpoint included (not fully implemented in v1).

The infrastructure is there (`/preview` endpoint), but focus is on screenshot capture (2a) which you said was preferred.

## 💰 Cost Estimate (Cloudflare Free Tier)

For 10-20 client sites with moderate commenting:

- **Requests**: 100,000/day (plenty for 100+ comments/day)
- **KV Storage**: 1GB (thousands of comments with screenshots)
- **KV Writes**: 1,000/day (100+ comments/day)
- **Cost**: $0/month ✅

## 🎨 Customization Options

All easily customizable via CSS in `embed.js` or `worker.js`:

- Button position (bottom-right default)
- Pin colors (red/green/gray default)
- Modal styling
- Admin dashboard theme

## 🐛 Known Limitations

1. **Screenshots and CORS**: Pages with external images from domains without CORS may have issues with html2canvas. The comment still submits, just without screenshot.

2. **Large screenshots**: Stored as base64 in KV (25MB limit per value). For huge screenshots, this could be an issue (but unlikely in practice).

3. **Admin auth**: Simple password-based (no hashing in v1). For production with sensitive data, consider adding bcrypt hashing.

4. **Mobile testing**: html2canvas can be slower on mobile devices (1-3 seconds).

## 📊 What Makes This Better Than SimpleCommenter

1. **Self-hosted**: No monthly fees, no per-site charges
2. **Screenshot capture**: Built-in, not an add-on
3. **Domain filtering**: Perfect for Framer multi-domain sites
4. **Open source**: Full control, customize anything
5. **Cloudflare Workers**: Global edge network, fast everywhere
6. **No build tools**: Paste script tag and go

## 🔗 Repository

GitHub: https://github.com/purplecowbrands/moo-dashboards/tree/main/tools/commenter

Latest commit: `fda1bcd` - "Add Website Commenter Tool"

## ✉️ Questions or Issues?

1. Check `README.md` for full documentation
2. Check `DEPLOYMENT.md` for deployment help
3. Test locally with `test.html` before deploying
4. Open GitHub issue or message Moo

---

**Built by Moo on 2026-02-23**
