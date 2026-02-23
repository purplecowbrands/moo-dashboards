// Cloudflare Worker for Website Commenter Tool
// Handles API endpoints, serves embed script and admin dashboard

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Serve embed script
      if (path === '/embed.js') {
        return serveEmbedScript(corsHeaders, env);
      }

      // Serve admin dashboard
      if (path === '/' || path === '/admin') {
        return serveAdminDashboard();
      }

      // Serve page preview for admin (iframe with pins)
      if (path === '/preview') {
        return servePagePreview(url);
      }

      // API endpoints
      if (path.startsWith('/api/')) {
        return handleAPI(request, env, url, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// API handler
async function handleAPI(request, env, url, corsHeaders) {
  const path = url.pathname;
  const method = request.method;

  // POST /api/auth - Admin login
  if (path === '/api/auth' && method === 'POST') {
    const { password } = await request.json();
    const storedPassword = await env.COMMENTER_KV.get('admin_password');
    
    if (!storedPassword) {
      // First time setup - set the password
      await env.COMMENTER_KV.put('admin_password', password);
      return jsonResponse({ success: true, token: 'admin-authenticated' }, corsHeaders);
    }
    
    if (password === storedPassword) {
      return jsonResponse({ success: true, token: 'admin-authenticated' }, corsHeaders);
    }
    
    return jsonResponse({ success: false, error: 'Invalid password' }, corsHeaders, 401);
  }

  // POST /api/comments - Create comment
  if (path === '/api/comments' && method === 'POST') {
    const comment = await request.json();
    const commentId = generateId();
    const timestamp = new Date().toISOString();
    
    const commentData = {
      id: commentId,
      site: comment.site,
      url: comment.url,
      x: comment.x,
      y: comment.y,
      text: comment.text,
      name: comment.name || 'Anonymous',
      attachment: comment.attachment || null,
      screenshot: comment.screenshot || null,
      status: 'open',
      timestamp,
    };
    
    // Store comment
    const key = `comment:${comment.site}:${comment.url}:${commentId}`;
    await env.COMMENTER_KV.put(key, JSON.stringify(commentData));
    
    // Add to site index
    await addToIndex(env, comment.site, comment.url, commentId);
    
    return jsonResponse({ success: true, comment: commentData }, corsHeaders);
  }

  // GET /api/comments - Get comments
  if (path === '/api/comments' && method === 'GET') {
    const site = url.searchParams.get('site');
    const pageUrl = url.searchParams.get('url');
    
    if (!site) {
      return jsonResponse({ error: 'Site parameter required' }, corsHeaders, 400);
    }
    
    const comments = await getComments(env, site, pageUrl);
    return jsonResponse({ comments }, corsHeaders);
  }

  // PUT /api/comments/:id - Update comment status (admin only)
  if (path.startsWith('/api/comments/') && method === 'PUT') {
    const auth = request.headers.get('Authorization');
    if (!await verifyAdmin(env, auth)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }
    
    const commentId = path.split('/')[3];
    const { status, site, url: pageUrl } = await request.json();
    
    const key = `comment:${site}:${pageUrl}:${commentId}`;
    const commentStr = await env.COMMENTER_KV.get(key);
    
    if (!commentStr) {
      return jsonResponse({ error: 'Comment not found' }, corsHeaders, 404);
    }
    
    const comment = JSON.parse(commentStr);
    comment.status = status;
    await env.COMMENTER_KV.put(key, JSON.stringify(comment));
    
    return jsonResponse({ success: true, comment }, corsHeaders);
  }

  // DELETE /api/comments/:id - Delete comment (admin only)
  if (path.startsWith('/api/comments/') && method === 'DELETE') {
    const auth = request.headers.get('Authorization');
    if (!await verifyAdmin(env, auth)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }
    
    const commentId = path.split('/')[3];
    const site = url.searchParams.get('site');
    const pageUrl = url.searchParams.get('url');
    
    const key = `comment:${site}:${pageUrl}:${commentId}`;
    await env.COMMENTER_KV.delete(key);
    await removeFromIndex(env, site, pageUrl, commentId);
    
    return jsonResponse({ success: true }, corsHeaders);
  }

  // POST /api/upload - Upload attachment
  if (path === '/api/upload' && method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return jsonResponse({ error: 'No file provided' }, corsHeaders, 400);
    }
    
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const fileId = generateId();
    
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64,
    };
    
    await env.COMMENTER_KV.put(`file:${fileId}`, JSON.stringify(fileData));
    
    return jsonResponse({ success: true, fileId, file: fileData }, corsHeaders);
  }

  return jsonResponse({ error: 'Not Found' }, corsHeaders, 404);
}

// Helper functions
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function verifyAdmin(env, authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === 'admin-authenticated';
}

async function addToIndex(env, site, url, commentId) {
  const indexKey = `index:${site}:${url}`;
  const indexStr = await env.COMMENTER_KV.get(indexKey);
  const index = indexStr ? JSON.parse(indexStr) : [];
  
  if (!index.includes(commentId)) {
    index.push(commentId);
    await env.COMMENTER_KV.put(indexKey, JSON.stringify(index));
  }
}

async function removeFromIndex(env, site, url, commentId) {
  const indexKey = `index:${site}:${url}`;
  const indexStr = await env.COMMENTER_KV.get(indexKey);
  
  if (indexStr) {
    const index = JSON.parse(indexStr);
    const filtered = index.filter(id => id !== commentId);
    await env.COMMENTER_KV.put(indexKey, JSON.stringify(filtered));
  }
}

async function getComments(env, site, pageUrl) {
  const comments = [];
  
  if (pageUrl) {
    // Get comments for specific page
    const indexKey = `index:${site}:${pageUrl}`;
    const indexStr = await env.COMMENTER_KV.get(indexKey);
    
    if (indexStr) {
      const commentIds = JSON.parse(indexStr);
      for (const id of commentIds) {
        const key = `comment:${site}:${pageUrl}:${id}`;
        const commentStr = await env.COMMENTER_KV.get(key);
        if (commentStr) {
          comments.push(JSON.parse(commentStr));
        }
      }
    }
  } else {
    // Get all comments for site (for admin dashboard)
    const list = await env.COMMENTER_KV.list({ prefix: `comment:${site}:` });
    
    for (const key of list.keys) {
      const commentStr = await env.COMMENTER_KV.get(key.name);
      if (commentStr) {
        comments.push(JSON.parse(commentStr));
      }
    }
  }
  
  return comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Serve embed script
function serveEmbedScript(corsHeaders, env) {
  // Read the embed.js file content
  // In production, this would be the actual embed.js content
  // For now, we'll serve a dynamic version with the worker URL injected
  
  const workerUrl = env.WORKER_URL || 'https://commenter.yourworker.workers.dev';
  
  const script = `
// Website Commenter Embed Script
// This script is automatically configured with your worker URL
(function() {
  'use strict';
  
  const API_URL = '${workerUrl}';
  
  // Check if current domain is allowed
  const scriptTag = document.currentScript;
  const allowedDomains = scriptTag?.getAttribute('data-allowed-domains');
  
  if (allowedDomains) {
    const currentDomain = window.location.hostname;
    const allowed = allowedDomains.split(',').map(d => d.trim());
    
    const isAllowed = allowed.some(domain => {
      return currentDomain === domain || currentDomain.endsWith('.' + domain);
    });
    
    if (!isAllowed) {
      console.log('[Commenter] Not loading on this domain:', currentDomain);
      return;
    }
  }
  
  const SITE = window.location.hostname;
  const PAGE_URL = window.location.pathname;
  
  let commentMode = false;
  let comments = [];
  
  const html2canvasScript = document.createElement('script');
  html2canvasScript.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  document.head.appendChild(html2canvasScript);
  
  const style = document.createElement('style');
  style.textContent = \`
    .commenter-button { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background: #2563eb; color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 999998; font-size: 24px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .commenter-button:hover { background: #1d4ed8; transform: scale(1.05); }
    .commenter-button.active { background: #dc2626; }
    .commenter-pin { position: absolute; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; z-index: 999997; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: transform 0.2s; }
    .commenter-pin:hover { transform: scale(1.2); }
    .commenter-pin.open { background: #dc2626; }
    .commenter-pin.resolved { background: #16a34a; }
    .commenter-pin.closed { background: #6b7280; }
    .commenter-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999999; display: none; align-items: center; justify-content: center; }
    .commenter-modal.show { display: flex; }
    .commenter-modal-content { background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .commenter-modal h3 { margin: 0 0 16px 0; font-size: 18px; font-weight: 600; }
    .commenter-modal label { display: block; margin-bottom: 4px; font-size: 14px; font-weight: 500; }
    .commenter-modal input, .commenter-modal textarea { width: 100%; padding: 8px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; font-size: 14px; }
    .commenter-modal textarea { min-height: 100px; resize: vertical; }
    .commenter-modal-buttons { display: flex; gap: 8px; justify-content: flex-end; }
    .commenter-modal button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .commenter-modal button.primary { background: #2563eb; color: white; }
    .commenter-modal button.primary:hover { background: #1d4ed8; }
    .commenter-modal button.primary:disabled { background: #9ca3af; cursor: not-allowed; }
    .commenter-modal button.secondary { background: #e5e7eb; color: #374151; }
    .commenter-modal button.secondary:hover { background: #d1d5db; }
    .commenter-comment-text { margin-bottom: 12px; line-height: 1.5; }
    .commenter-comment-meta { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
    .commenter-comment-attachment { margin-top: 12px; }
    .commenter-comment-attachment img { max-width: 100%; border-radius: 4px; }
    .commenter-loading { font-size: 14px; color: #6b7280; margin-top: 8px; }
  \`;
  document.head.appendChild(style);
  
  const button = document.createElement('button');
  button.className = 'commenter-button';
  button.innerHTML = '💬';
  button.title = 'Toggle Comment Mode';
  button.onclick = toggleCommentMode;
  document.body.appendChild(button);
  
  const modal = document.createElement('div');
  modal.className = 'commenter-modal';
  modal.innerHTML = \`
    <div class="commenter-modal-content">
      <h3 id="modal-title">New Comment</h3>
      <div id="modal-body">
        <label>Name (optional)</label>
        <input type="text" id="commenter-name" placeholder="Your name">
        <label>Comment</label>
        <textarea id="commenter-text" placeholder="Leave your feedback..." required></textarea>
        <label>Attach File (optional)</label>
        <input type="file" id="commenter-file" accept="image/*">
        <div id="commenter-loading" class="commenter-loading" style="display:none;">Processing...</div>
      </div>
      <div class="commenter-modal-buttons">
        <button class="secondary" onclick="window.commenterCloseModal()">Cancel</button>
        <button class="primary" id="commenter-submit-btn" onclick="window.commenterSubmit()">Submit</button>
      </div>
    </div>
  \`;
  document.body.appendChild(modal);
  
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  let currentX, currentY;
  
  function toggleCommentMode() {
    commentMode = !commentMode;
    button.classList.toggle('active');
    if (commentMode) {
      document.body.style.cursor = 'crosshair';
      button.innerHTML = '✖️';
      document.addEventListener('click', handlePageClick, true);
    } else {
      document.body.style.cursor = '';
      button.innerHTML = '💬';
      document.removeEventListener('click', handlePageClick, true);
    }
  }
  
  function handlePageClick(e) {
    if (e.target.closest('.commenter-button') || e.target.closest('.commenter-modal')) return;
    e.preventDefault();
    e.stopPropagation();
    currentX = e.pageX;
    currentY = e.pageY;
    openModal();
    toggleCommentMode();
  }
  
  function openModal() {
    modal.classList.add('show');
    document.getElementById('commenter-text').value = '';
    document.getElementById('commenter-name').value = '';
    document.getElementById('commenter-file').value = '';
    document.getElementById('commenter-loading').style.display = 'none';
    document.getElementById('commenter-submit-btn').disabled = false;
  }
  
  function closeModal() { modal.classList.remove('show'); }
  
  async function captureScreenshot() {
    if (typeof html2canvas === 'undefined') {
      console.warn('[Commenter] html2canvas not loaded');
      return null;
    }
    try {
      modal.style.display = 'none';
      button.style.display = 'none';
      document.querySelectorAll('.commenter-pin').forEach(el => el.style.display = 'none');
      
      const canvas = await html2canvas(document.body, {
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        useCORS: true,
        allowTaint: true,
      });
      
      modal.style.display = '';
      button.style.display = '';
      document.querySelectorAll('.commenter-pin').forEach(el => el.style.display = '');
      
      return {
        data: canvas.toDataURL('image/jpeg', 0.8),
        width: canvas.width,
        height: canvas.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    } catch (error) {
      console.error('[Commenter] Screenshot failed:', error);
      modal.style.display = '';
      button.style.display = '';
      document.querySelectorAll('.commenter-pin').forEach(el => el.style.display = '');
      return null;
    }
  }
  
  async function submitComment() {
    const text = document.getElementById('commenter-text').value.trim();
    if (!text) { alert('Please enter a comment'); return; }
    
    const loadingEl = document.getElementById('commenter-loading');
    const submitBtn = document.getElementById('commenter-submit-btn');
    loadingEl.style.display = 'block';
    loadingEl.textContent = 'Capturing screenshot...';
    submitBtn.disabled = true;
    
    const name = document.getElementById('commenter-name').value.trim();
    const fileInput = document.getElementById('commenter-file');
    
    let screenshot = null;
    try { screenshot = await captureScreenshot(); } catch (e) {}
    
    loadingEl.textContent = 'Uploading...';
    
    let attachment = null;
    if (fileInput.files[0]) attachment = await uploadFile(fileInput.files[0]);
    
    const comment = { site: SITE, url: PAGE_URL, x: currentX, y: currentY, text, name, attachment, screenshot };
    
    try {
      const response = await fetch(\`\${API_URL}/api/comments\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
      const result = await response.json();
      if (result.success) { closeModal(); loadComments(); }
      else { alert('Failed to submit'); submitBtn.disabled = false; loadingEl.style.display = 'none'; }
    } catch (error) {
      alert('Failed to submit');
      submitBtn.disabled = false;
      loadingEl.style.display = 'none';
    }
  }
  
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(\`\${API_URL}/api/upload\`, { method: 'POST', body: formData });
      const result = await response.json();
      return result.success ? result.file : null;
    } catch (e) { return null; }
  }
  
  async function loadComments() {
    try {
      const response = await fetch(\`\${API_URL}/api/comments?site=\${SITE}&url=\${PAGE_URL}\`);
      const result = await response.json();
      comments = result.comments || [];
      renderComments();
    } catch (e) {}
  }
  
  function renderComments() {
    document.querySelectorAll('.commenter-pin').forEach(el => el.remove());
    comments.forEach((comment, index) => {
      const pin = document.createElement('div');
      pin.className = \`commenter-pin \${comment.status}\`;
      pin.style.left = \`\${comment.x}px\`;
      pin.style.top = \`\${comment.y}px\`;
      pin.innerHTML = index + 1;
      pin.onclick = () => showComment(comment);
      document.body.appendChild(pin);
    });
  }
  
  function showComment(comment) {
    document.getElementById('modal-title').textContent = \`Comment by \${comment.name}\`;
    let attachmentHtml = '';
    if (comment.attachment) {
      if (comment.attachment.type.startsWith('image/')) {
        attachmentHtml = \`<div class="commenter-comment-attachment"><img src="data:\${comment.attachment.type};base64,\${comment.attachment.data}" alt="Attachment"></div>\`;
      } else {
        attachmentHtml = \`<div class="commenter-comment-attachment">📎 \${comment.attachment.name}</div>\`;
      }
    }
    document.getElementById('modal-body').innerHTML = \`
      <div class="commenter-comment-meta">Status: <strong>\${comment.status}</strong> | \${new Date(comment.timestamp).toLocaleString()}</div>
      <div class="commenter-comment-text">\${comment.text}</div>
      \${attachmentHtml}
    \`;
    document.querySelector('.commenter-modal-buttons').innerHTML = \`<button class="secondary" onclick="window.commenterCloseModal()">Close</button>\`;
    modal.classList.add('show');
  }
  
  window.commenterCloseModal = closeModal;
  window.commenterSubmit = submitComment;
  
  loadComments();
})();
`;
  
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      ...corsHeaders,
    },
  });
}

// Serve page preview (Option B - iframe with pins)
function servePagePreview(url) {
  const pageUrl = url.searchParams.get('url');
  const site = url.searchParams.get('site');
  
  if (!pageUrl || !site) {
    return new Response('Missing url or site parameter', { status: 400 });
  }
  
  const fullUrl = `https://${site}${pageUrl}`;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Page Preview</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    #preview-frame { width: 100%; height: 100vh; border: none; }
    .preview-pin {
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      z-index: 999999;
      pointer-events: none;
    }
    .preview-pin.open { background: #dc2626; }
    .preview-pin.resolved { background: #16a34a; }
    .preview-pin.closed { background: #6b7280; }
  </style>
</head>
<body>
  <iframe id="preview-frame" src="${fullUrl}"></iframe>
  <div id="pins-container"></div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

// Serve admin dashboard
function serveAdminDashboard() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commenter Admin Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 24px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .filters { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
    .filters select, .filters input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-card h3 { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #111827; }
    .comments-list { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .comment-item { padding: 20px; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background 0.2s; }
    .comment-item:hover { background: #f9fafb; }
    .comment-item:last-child { border-bottom: none; }
    .comment-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; }
    .comment-meta { font-size: 14px; color: #6b7280; }
    .comment-meta strong { color: #111827; }
    .comment-text { margin: 12px 0; line-height: 1.6; }
    .comment-actions { display: flex; gap: 8px; margin-top: 12px; }
    .comment-actions button { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
    .btn-open { background: #fee2e2; color: #991b1b; }
    .btn-resolved { background: #dcfce7; color: #166534; }
    .btn-closed { background: #e5e7eb; color: #374151; }
    .btn-delete { background: #fee2e2; color: #991b1b; }
    .btn-view { background: #dbeafe; color: #1e40af; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.open { background: #fee2e2; color: #991b1b; }
    .status-badge.resolved { background: #dcfce7; color: #166534; }
    .status-badge.closed { background: #e5e7eb; color: #374151; }
    .login-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .login-box { background: white; padding: 32px; border-radius: 8px; max-width: 400px; width: 90%; }
    .login-box h2 { margin-bottom: 20px; }
    .login-box input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 16px; font-size: 14px; }
    .login-box button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .login-box button:hover { background: #1d4ed8; }
    .hidden { display: none; }
    .export-btn { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .export-btn:hover { background: #1d4ed8; }
    .preview-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: none; align-items: center; justify-content: center; }
    .preview-modal.show { display: flex; }
    .preview-content { background: white; padding: 24px; border-radius: 8px; max-width: 90vw; max-height: 90vh; overflow: auto; position: relative; }
    .preview-close { position: absolute; top: 12px; right: 12px; background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; z-index: 1; }
    .preview-close:hover { background: #b91c1c; }
    .screenshot-container { position: relative; display: inline-block; }
    .screenshot-pin { position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white; }
    .preview-screenshot { max-width: 100%; border-radius: 4px; display: block; }
    .preview-info { margin-bottom: 16px; padding: 12px; background: #f3f4f6; border-radius: 4px; }
  </style>
</head>
<body>
  <div id="login-modal" class="login-modal">
    <div class="login-box">
      <h2>Admin Login</h2>
      <input type="password" id="password" placeholder="Enter admin password">
      <button onclick="login()">Login</button>
    </div>
  </div>

  <div id="dashboard" class="hidden">
    <div class="container">
      <div class="header">
        <h1>Commenter Admin Dashboard</h1>
        <div class="filters">
          <select id="site-filter" onchange="filterComments()"><option value="">All Sites</option></select>
          <select id="status-filter" onchange="filterComments()">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button class="export-btn" onclick="exportComments()">Export CSV</button>
        </div>
      </div>

      <div class="stats">
        <div class="stat-card"><h3>Total Comments</h3><div class="value" id="stat-total">0</div></div>
        <div class="stat-card"><h3>Open</h3><div class="value" id="stat-open">0</div></div>
        <div class="stat-card"><h3>Resolved</h3><div class="value" id="stat-resolved">0</div></div>
        <div class="stat-card"><h3>Closed</h3><div class="value" id="stat-closed">0</div></div>
      </div>

      <div class="comments-list" id="comments-list">
        <div style="padding: 40px; text-align: center; color: #6b7280;">Loading comments...</div>
      </div>
    </div>
  </div>

  <div id="preview-modal" class="preview-modal">
    <div class="preview-content">
      <button class="preview-close" onclick="closePreview()">Close</button>
      <div id="preview-body"></div>
    </div>
  </div>

  <script>
    let authToken = null;
    let allComments = [];
    
    async function login() {
      const password = document.getElementById('password').value;
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const result = await response.json();
        if (result.success) {
          authToken = result.token;
          document.getElementById('login-modal').classList.add('hidden');
          document.getElementById('dashboard').classList.remove('hidden');
          loadAllComments();
        } else { alert('Invalid password'); }
      } catch (error) { alert('Login failed'); }
    }
    
    async function loadAllComments() {
      try {
        const sites = new Set();
        const response = await fetch('/api/comments?site=*');
        const result = await response.json();
        allComments = result.comments || [];
        allComments.forEach(c => sites.add(c.site));
        const siteFilter = document.getElementById('site-filter');
        sites.forEach(site => {
          const option = document.createElement('option');
          option.value = site;
          option.textContent = site;
          siteFilter.appendChild(option);
        });
        renderComments(allComments);
      } catch (error) { console.error('Error loading comments:', error); }
    }
    
    function filterComments() {
      const siteFilter = document.getElementById('site-filter').value;
      const statusFilter = document.getElementById('status-filter').value;
      let filtered = allComments;
      if (siteFilter) filtered = filtered.filter(c => c.site === siteFilter);
      if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
      renderComments(filtered);
    }
    
    function renderComments(comments) {
      document.getElementById('stat-total').textContent = comments.length;
      document.getElementById('stat-open').textContent = comments.filter(c => c.status === 'open').length;
      document.getElementById('stat-resolved').textContent = comments.filter(c => c.status === 'resolved').length;
      document.getElementById('stat-closed').textContent = comments.filter(c => c.status === 'closed').length;
      
      const list = document.getElementById('comments-list');
      if (comments.length === 0) {
        list.innerHTML = '<div style="padding: 40px; text-align: center; color: #6b7280;">No comments found</div>';
        return;
      }
      
      list.innerHTML = comments.map(comment => {
        const hasScreenshot = comment.screenshot && comment.screenshot.data;
        return \`
          <div class="comment-item">
            <div class="comment-header">
              <div class="comment-meta">
                <strong>\${comment.name}</strong> on <strong>\${comment.site}\${comment.url}</strong><br>
                <span>\${new Date(comment.timestamp).toLocaleString()}</span> | Position: (\${comment.x}, \${comment.y})
                \${hasScreenshot ? ' | 📸 Screenshot available' : ''}
              </div>
              <span class="status-badge \${comment.status}">\${comment.status}</span>
            </div>
            <div class="comment-text">\${comment.text}</div>
            <div class="comment-actions">
              \${hasScreenshot ? \`<button class="btn-view" onclick="viewScreenshot('\${comment.id}')">View Screenshot</button>\` : ''}
              <button class="btn-open" onclick="updateStatus('\${comment.id}', '\${comment.site}', '\${comment.url}', 'open')">Mark Open</button>
              <button class="btn-resolved" onclick="updateStatus('\${comment.id}', '\${comment.site}', '\${comment.url}', 'resolved')">Mark Resolved</button>
              <button class="btn-closed" onclick="updateStatus('\${comment.id}', '\${comment.site}', '\${comment.url}', 'closed')">Mark Closed</button>
              <button class="btn-delete" onclick="deleteComment('\${comment.id}', '\${comment.site}', '\${comment.url}')">Delete</button>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function viewScreenshot(commentId) {
      const comment = allComments.find(c => c.id === commentId);
      if (!comment || !comment.screenshot) return;
      
      const screenshot = comment.screenshot;
      const previewBody = document.getElementById('preview-body');
      
      let attachmentHtml = '';
      if (comment.attachment && comment.attachment.type.startsWith('image/')) {
        attachmentHtml = \`
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <h3 style="margin-bottom: 12px;">Attached Image:</h3>
            <img src="data:\${comment.attachment.type};base64,\${comment.attachment.data}" style="max-width: 100%; border-radius: 4px;">
          </div>
        \`;
      }
      
      previewBody.innerHTML = \`
        <div class="preview-info">
          <strong>\${comment.name}</strong> - \${comment.text}<br>
          <span style="color: #6b7280; font-size: 14px;">\${comment.site}\${comment.url} | \${new Date(comment.timestamp).toLocaleString()}</span>
        </div>
        <div class="screenshot-container">
          <img src="\${screenshot.data}" class="preview-screenshot">
          <div class="screenshot-pin" style="left: \${comment.x - screenshot.scrollX}px; top: \${comment.y - screenshot.scrollY}px;">📌</div>
        </div>
        \${attachmentHtml}
      \`;
      
      document.getElementById('preview-modal').classList.add('show');
    }
    
    function closePreview() {
      document.getElementById('preview-modal').classList.remove('show');
    }
    
    async function updateStatus(commentId, site, url, status) {
      try {
        const response = await fetch(\`/api/comments/\${commentId}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${authToken}\` },
          body: JSON.stringify({ status, site, url }),
        });
        const result = await response.json();
        if (result.success) {
          const comment = allComments.find(c => c.id === commentId);
          if (comment) comment.status = status;
          filterComments();
        } else { alert('Failed to update status'); }
      } catch (error) { alert('Failed to update status'); }
    }
    
    async function deleteComment(commentId, site, url) {
      if (!confirm('Are you sure you want to delete this comment?')) return;
      try {
        const response = await fetch(\`/api/comments/\${commentId}?site=\${site}&url=\${url}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${authToken}\` },
        });
        const result = await response.json();
        if (result.success) {
          allComments = allComments.filter(c => c.id !== commentId);
          filterComments();
        } else { alert('Failed to delete comment'); }
      } catch (error) { alert('Failed to delete comment'); }
    }
    
    function exportComments() {
      const siteFilter = document.getElementById('site-filter').value;
      const statusFilter = document.getElementById('status-filter').value;
      let filtered = allComments;
      if (siteFilter) filtered = filtered.filter(c => c.site === siteFilter);
      if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
      
      const headers = ['ID', 'Site', 'URL', 'Name', 'Comment', 'Status', 'X', 'Y', 'Timestamp', 'Has Screenshot'];
      const rows = filtered.map(c => [
        c.id, c.site, c.url, c.name, c.text.replace(/"/g, '""'), c.status, c.x, c.y, c.timestamp,
        c.screenshot ? 'Yes' : 'No'
      ]);
      const csv = [headers.join(','), ...rows.map(row => row.map(cell => \`"\${cell}"\`).join(','))].join('\\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`comments-\${new Date().toISOString().split('T')[0]}.csv\`;
      a.click();
    }
    
    document.getElementById('preview-modal').onclick = (e) => {
      if (e.target.id === 'preview-modal') closePreview();
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
