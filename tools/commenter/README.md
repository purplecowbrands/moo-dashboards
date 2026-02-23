# Website Commenter Tool

A lightweight website feedback tool that allows visitors to click anywhere on a page and leave comments. Similar to SimpleCommenter, but self-hosted on Cloudflare Workers.

## Features

- **Zero-friction feedback**: No login required for visitors
- **Visual pin placement**: Click anywhere on the page to leave a comment
- **Screenshot capture**: Automatically captures page screenshot at comment location for context
- **File attachments**: Attach images/files to comments
- **Status management**: Mark comments as open/resolved/closed
- **Admin dashboard**: View all comments across all sites
- **Screenshot preview**: Admin can see exactly where each comment was placed with visual overlay
- **Domain restriction**: Only show on specific domains (perfect for staging vs production)
- **Lightweight embed**: Single script tag, no dependencies
- **Color-coded pins**: Red (open), green (resolved), gray (closed)

## Architecture

- **Frontend**: Vanilla JavaScript embed script
- **Screenshot Capture**: html2canvas library (loaded from CDN)
- **Backend**: Cloudflare Worker
- **Storage**: Cloudflare KV (comments + attachments + screenshots as base64)
- **Admin**: Built-in dashboard with password protection

**Dependencies:**
- [html2canvas](https://html2canvas.hertzen.com/) v1.4.1 - Loaded automatically from jsDelivr CDN
- No build tools required
- No npm installation needed
- Works with simple script tag injection

## Setup

### 1. Create Cloudflare Worker

1. Log in to your Cloudflare dashboard
2. Go to Workers & Pages > Create Application > Create Worker
3. Name it (e.g., "commenter")
4. Deploy the worker

### 2. Create KV Namespace

1. Go to Workers & Pages > KV
2. Create a namespace (e.g., "COMMENTER_DATA")
3. Copy the namespace ID

### 3. Bind KV to Worker

1. Go to your worker settings
2. Under Variables > KV Namespace Bindings
3. Add binding:
   - Variable name: `COMMENTER_KV`
   - KV namespace: Select your namespace

### 4. Deploy Worker Code

Copy the contents of `worker.js` and paste it into your Cloudflare Worker editor, then deploy.

### 5. Configure Admin Password

**First-time setup:** The first login will set the admin password. Just visit the admin dashboard and enter any password - this will become your admin password.

**To change password later:**
1. Go to Workers & Pages > KV > Your namespace
2. Find the key `admin_password`
3. Delete it
4. Visit the admin dashboard again and set a new password

### 6. Add to Your Website

Add this script tag to any website you want to enable comments on:

```html
<script src="https://your-worker-name.your-subdomain.workers.dev/embed.js"></script>
```

Replace `your-worker-name.your-subdomain.workers.dev` with your actual worker URL.

### 7. Domain Restriction (Optional but Recommended)

If you're adding the script to a site that has multiple domains (like Framer sites with both staging `.framer.app` URLs and custom production domains), you can restrict which domains show the commenter tool:

```html
<script src="https://your-worker-name.your-subdomain.workers.dev/embed.js" data-allowed-domains="staging.framer.app,site.framer.app"></script>
```

The `data-allowed-domains` attribute accepts a comma-separated list of domains. The script will only activate on those domains (including subdomains). This is perfect for:

- **Framer sites**: Show only on `.framer.app` staging URLs, not on custom domains
- **Development sites**: Show only on `dev.example.com`, not on `example.com`
- **Client review sites**: Show only on specific review URLs

**Examples:**

```html
<!-- Only show on Framer staging URLs -->
<script src="https://commenter.yourworker.workers.dev/embed.js" data-allowed-domains="framer.app"></script>

<!-- Multiple specific domains -->
<script src="https://commenter.yourworker.workers.dev/embed.js" data-allowed-domains="staging.example.com,preview.example.com"></script>

<!-- Show everywhere (no restriction) -->
<script src="https://commenter.yourworker.workers.dev/embed.js"></script>
```

**How it works:**
- Exact match: `staging.example.com` only matches that exact domain
- Subdomain match: `framer.app` matches `site.framer.app`, `anything.framer.app`, etc.
- The check happens client-side before any UI is rendered
- If the domain doesn't match, the script silently exits (no console errors, no UI)

## Usage

### For Visitors

1. Click the floating 💬 button (bottom-right corner)
2. Click anywhere on the page to place a comment pin
3. Fill out the comment form (name optional)
4. Optionally attach a file
5. Submit (automatically captures screenshot of the page for admin context)

**Screenshot Capture:**
When you submit a comment, the tool automatically captures a screenshot of the current viewport. This happens in the background and only takes 1-2 seconds. The screenshot helps admins see exactly what the page looked like when you left the comment, even if the page changes later.

### For Admins

1. Visit `https://your-worker-name.your-subdomain.workers.dev/`
2. Log in with your admin password
3. View all comments across all sites
4. Click "View Screenshot" on any comment to see the captured page context
5. Filter by site, status, or date
6. Change comment status (open/resolved/closed)
7. Delete comments
8. Export comments to CSV

**Screenshot Preview:**
When you click "View Screenshot" on a comment, you'll see:
- The exact page screenshot as it appeared when the comment was made
- A pin overlay showing precisely where on the page the comment was placed
- The comment text and metadata
- Any attached files

This makes it easy to understand context without having to visit the live page (which may have changed since the comment was made).

## API Endpoints

All endpoints support CORS for cross-origin requests.

### Public Endpoints

**GET /embed.js**
- Returns the embed script
- Add this to your website via `<script>` tag

**POST /api/comments**
- Create a new comment
- Body: `{ site, url, x, y, text, name, attachment }`
- Returns: `{ success: true, comment: {...} }`

**GET /api/comments**
- Get comments for a site/page
- Query params: `?site=example.com&url=/page` (url is optional)
- Returns: `{ comments: [...] }`

**POST /api/upload**
- Upload a file attachment
- Body: FormData with `file` field
- Returns: `{ success: true, fileId, file: {...} }`

### Admin Endpoints

These require `Authorization: Bearer admin-authenticated` header.

**POST /api/auth**
- Admin login
- Body: `{ password: "your-password" }`
- Returns: `{ success: true, token: "admin-authenticated" }`

**PUT /api/comments/:id**
- Update comment status
- Body: `{ status: "open|resolved|closed", site, url }`
- Returns: `{ success: true, comment: {...} }`

**DELETE /api/comments/:id**
- Delete a comment
- Query params: `?site=example.com&url=/page`
- Returns: `{ success: true }`

## Framer Integration

This tool is designed to work seamlessly with Framer sites. Here's how to add it:

### 1. Get Your Worker URL

After deploying your Cloudflare Worker, copy the worker URL (e.g., `commenter.yoursubdomain.workers.dev`)

### 2. Add to Framer

1. Open your Framer project
2. Click the **Settings** icon (gear) in the top-left
3. Go to **General** > **Custom Code**
4. In the **End of `<body>` tag** section, paste:

```html
<script src="https://commenter.yoursubdomain.workers.dev/embed.js" data-allowed-domains="framer.app"></script>
```

**Important:** Use `data-allowed-domains="framer.app"` so the commenter tool only appears on your staging Framer URLs (like `yoursite.framer.app`), NOT on your custom production domain.

### 3. Publish and Test

1. Click **Publish** in Framer
2. Visit your staging URL (yoursite.framer.app)
3. You should see the 💬 button in the bottom-right
4. Visit your custom domain - the button should NOT appear

### Why Use Domain Restriction for Framer?

Framer's Custom Code section applies to **both** your staging `.framer.app` URL and your custom domain. By using `data-allowed-domains="framer.app"`, you ensure:

- Clients can leave feedback on staging URLs
- The tool doesn't appear on your live production site
- No code duplication needed
- One simple script tag works for everything

### Troubleshooting Framer

**Button doesn't appear on staging:**
- Check browser console for errors
- Verify your worker URL is correct
- Make sure you pasted the code in "End of `<body>` tag", not "Start of `<head>` tag"

**Button appears on production (custom domain):**
- Double-check you included `data-allowed-domains="framer.app"` in the script tag
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**Screenshot capture fails:**
- This can happen with complex Framer sites that use external resources
- The comment will still be submitted, just without the screenshot
- Check browser console for CORS errors

## Data Structure

### Comment Object

```json
{
  "id": "unique-id",
  "site": "example.com",
  "url": "/page-path",
  "x": 450,
  "y": 320,
  "text": "This section is confusing",
  "name": "John Doe",
  "status": "open",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "attachment": {
    "id": "file-id",
    "name": "screenshot.png",
    "type": "image/png",
    "size": 45678,
    "data": "base64-encoded-data"
  },
  "screenshot": {
    "data": "data:image/jpeg;base64,...",
    "width": 1920,
    "height": 1080,
    "scrollX": 0,
    "scrollY": 250,
    "viewportWidth": 1920,
    "viewportHeight": 1080
  }
}
```

**Screenshot object fields:**
- `data`: Base64-encoded JPEG image (data URL format)
- `width`: Screenshot canvas width in pixels
- `height`: Screenshot canvas height in pixels
- `scrollX`: Horizontal scroll position when comment was made
- `scrollY`: Vertical scroll position when comment was made
- `viewportWidth`: Browser viewport width
- `viewportHeight`: Browser viewport height

These fields allow the admin to reconstruct the exact view and pin position.

### KV Storage Keys

- `comment:{site}:{url}:{commentId}` - Individual comment
- `index:{site}:{url}` - Array of comment IDs for a page
- `file:{fileId}` - Uploaded file data
- `admin_password` - Hashed admin password

## Customization

### Changing Colors

Edit the CSS in `embed.js` or `worker.js` (serveEmbedScript function):

```css
.commenter-pin.open { background: #dc2626; }     /* Red */
.commenter-pin.resolved { background: #16a34a; } /* Green */
.commenter-pin.closed { background: #6b7280; }   /* Gray */
```

### Changing Button Position

Edit the `.commenter-button` CSS:

```css
.commenter-button {
  bottom: 20px;  /* Distance from bottom */
  right: 20px;   /* Distance from right */
}
```

### File Size Limits

Cloudflare KV has a 25MB value size limit. For v1, we store attachments as base64 in KV. For larger files, consider:

1. Upgrading to Cloudflare R2 for file storage
2. Adding file size validation in the upload endpoint
3. Compressing images before storage

## Security Considerations

### Current Implementation (v1)

- Admin auth is password-based (stored in KV)
- No HTTPS requirement enforced
- CORS allows all origins (`*`)
- No rate limiting

### Recommended Improvements for Production

1. **HTTPS Only**: Add middleware to reject non-HTTPS requests
2. **Rate Limiting**: Use Cloudflare Workers rate limiting
3. **Better Auth**: Consider JWT tokens with expiration
4. **Origin Whitelist**: Replace `*` CORS with specific domains
5. **Input Validation**: Sanitize user inputs server-side
6. **File Type Validation**: Restrict allowed file types
7. **Spam Protection**: Add honeypot or CAPTCHA for comments

## Monitoring

### Check Comment Count

Visit your KV namespace in the Cloudflare dashboard to see:
- Number of keys (each comment is a key)
- Storage usage

### Export All Data

Use the admin dashboard Export button to download a CSV of all comments.

## Troubleshooting

### Comments Not Loading

1. Check browser console for CORS errors
2. Verify worker URL is correct in embed script
3. Check KV namespace is properly bound to worker

### Admin Can't Log In

1. Delete `admin_password` key from KV namespace
2. Visit admin dashboard to set new password

### Pins Not Appearing

1. Check if page has absolute positioning conflicts
2. Verify z-index of pins (999997) isn't being overridden
3. Check browser console for JavaScript errors

### File Upload Fails

1. Check file size (keep under 5MB for KV storage)
2. Verify file type is allowed
3. Check worker CPU time limits (large files take longer to encode)

## Future Enhancements

- [ ] Cloudflare R2 for large file attachments
- [ ] Email notifications for new comments
- [ ] Reply threads on comments
- [ ] @mentions in comments
- [ ] Screenshot annotations (draw on images)
- [ ] Slack/Discord webhooks
- [ ] Multi-user admin with roles
- [ ] Comment templates
- [ ] Analytics dashboard

## License

MIT - Use freely for personal or commercial projects.

## Support

For issues or questions, contact the Purple Cow Brands team.
