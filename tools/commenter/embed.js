// Website Commenter Embed Script
// Add this to any website: <script src="https://your-worker.workers.dev/embed.js" data-allowed-domains="site.framer.app,staging.example.com"></script>

(function() {
  'use strict';
  
  // Configuration - update this to your worker URL
  const API_URL = 'https://commenter.yourworker.workers.dev';
  
  // Check if current domain is allowed
  const scriptTag = document.currentScript;
  const allowedDomains = scriptTag?.getAttribute('data-allowed-domains');
  
  if (allowedDomains) {
    const currentDomain = window.location.hostname;
    const allowed = allowedDomains.split(',').map(d => d.trim());
    
    // Check if current domain matches any allowed domain (exact match or ends with for subdomains)
    const isAllowed = allowed.some(domain => {
      return currentDomain === domain || currentDomain.endsWith('.' + domain);
    });
    
    if (!isAllowed) {
      console.log('[Commenter] Not loading on this domain:', currentDomain);
      return; // Don't load the tool on this domain
    }
  }
  
  // Get site and page info
  const SITE = window.location.hostname;
  const PAGE_URL = window.location.pathname;
  
  let commentMode = false;
  let comments = [];
  
  // Load html2canvas from CDN for screenshot capture
  const html2canvasScript = document.createElement('script');
  html2canvasScript.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  document.head.appendChild(html2canvasScript);
  
  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    .commenter-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999998;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .commenter-button:hover {
      background: #1d4ed8;
      transform: scale(1.05);
    }
    .commenter-button.active {
      background: #dc2626;
    }
    .commenter-pin {
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 999997;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .commenter-pin:hover {
      transform: scale(1.2);
    }
    .commenter-pin.open { background: #dc2626; }
    .commenter-pin.resolved { background: #16a34a; }
    .commenter-pin.closed { background: #6b7280; }
    .commenter-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999999;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .commenter-modal.show {
      display: flex;
    }
    .commenter-modal-content {
      background: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .commenter-modal h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
    }
    .commenter-modal label {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
      font-weight: 500;
    }
    .commenter-modal input,
    .commenter-modal textarea {
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 16px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-family: inherit;
      font-size: 14px;
    }
    .commenter-modal textarea {
      min-height: 100px;
      resize: vertical;
    }
    .commenter-modal-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .commenter-modal button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .commenter-modal button.primary {
      background: #2563eb;
      color: white;
    }
    .commenter-modal button.primary:hover {
      background: #1d4ed8;
    }
    .commenter-modal button.primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .commenter-modal button.secondary {
      background: #e5e7eb;
      color: #374151;
    }
    .commenter-modal button.secondary:hover {
      background: #d1d5db;
    }
    .commenter-comment-text {
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .commenter-comment-meta {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .commenter-comment-attachment {
      margin-top: 12px;
    }
    .commenter-comment-attachment img {
      max-width: 100%;
      border-radius: 4px;
    }
    .commenter-loading {
      font-size: 14px;
      color: #6b7280;
      margin-top: 8px;
    }
  `;
  document.head.appendChild(style);
  
  // Create floating button
  const button = document.createElement('button');
  button.className = 'commenter-button';
  button.innerHTML = '💬';
  button.title = 'Toggle Comment Mode';
  button.onclick = toggleCommentMode;
  document.body.appendChild(button);
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'commenter-modal';
  modal.innerHTML = `
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
  `;
  document.body.appendChild(modal);
  
  // Close modal on background click
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
  
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
    if (e.target.closest('.commenter-button') || e.target.closest('.commenter-modal')) {
      return;
    }
    
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
  
  function closeModal() {
    modal.classList.remove('show');
  }
  
  async function captureScreenshot() {
    // Wait for html2canvas to load
    if (typeof html2canvas === 'undefined') {
      console.warn('[Commenter] html2canvas not loaded, skipping screenshot');
      return null;
    }
    
    try {
      // Temporarily hide the modal and pins for clean screenshot
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
      
      // Restore UI elements
      modal.style.display = '';
      button.style.display = '';
      document.querySelectorAll('.commenter-pin').forEach(el => el.style.display = '');
      
      // Convert canvas to base64 JPEG (smaller than PNG)
      const screenshot = canvas.toDataURL('image/jpeg', 0.8);
      
      return {
        data: screenshot,
        width: canvas.width,
        height: canvas.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    } catch (error) {
      console.error('[Commenter] Screenshot capture failed:', error);
      
      // Restore UI elements on error
      modal.style.display = '';
      button.style.display = '';
      document.querySelectorAll('.commenter-pin').forEach(el => el.style.display = '');
      
      return null;
    }
  }
  
  async function submitComment() {
    const text = document.getElementById('commenter-text').value.trim();
    if (!text) {
      alert('Please enter a comment');
      return;
    }
    
    // Show loading state
    const loadingEl = document.getElementById('commenter-loading');
    const submitBtn = document.getElementById('commenter-submit-btn');
    loadingEl.style.display = 'block';
    loadingEl.textContent = 'Capturing screenshot...';
    submitBtn.disabled = true;
    
    const name = document.getElementById('commenter-name').value.trim();
    const fileInput = document.getElementById('commenter-file');
    
    // Capture screenshot of the page at comment location
    let screenshot = null;
    try {
      screenshot = await captureScreenshot();
    } catch (error) {
      console.error('[Commenter] Screenshot failed:', error);
    }
    
    loadingEl.textContent = 'Uploading...';
    
    let attachment = null;
    if (fileInput.files[0]) {
      attachment = await uploadFile(fileInput.files[0]);
    }
    
    const comment = {
      site: SITE,
      url: PAGE_URL,
      x: currentX,
      y: currentY,
      text,
      name,
      attachment,
      screenshot,
    };
    
    try {
      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
      
      const result = await response.json();
      
      if (result.success) {
        closeModal();
        loadComments();
      } else {
        alert('Failed to submit comment');
        submitBtn.disabled = false;
        loadingEl.style.display = 'none';
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
      submitBtn.disabled = false;
      loadingEl.style.display = 'none';
    }
  }
  
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      return result.success ? result.file : null;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }
  
  async function loadComments() {
    try {
      const response = await fetch(`${API_URL}/api/comments?site=${SITE}&url=${PAGE_URL}`);
      const result = await response.json();
      comments = result.comments || [];
      renderComments();
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }
  
  function renderComments() {
    // Remove existing pins
    document.querySelectorAll('.commenter-pin').forEach(el => el.remove());
    
    // Add pins for each comment
    comments.forEach((comment, index) => {
      const pin = document.createElement('div');
      pin.className = `commenter-pin ${comment.status}`;
      pin.style.left = `${comment.x}px`;
      pin.style.top = `${comment.y}px`;
      pin.innerHTML = index + 1;
      pin.onclick = () => showComment(comment);
      document.body.appendChild(pin);
    });
  }
  
  function showComment(comment) {
    document.getElementById('modal-title').textContent = `Comment by ${comment.name}`;
    
    let attachmentHtml = '';
    if (comment.attachment) {
      if (comment.attachment.type.startsWith('image/')) {
        attachmentHtml = `<div class="commenter-comment-attachment"><img src="data:${comment.attachment.type};base64,${comment.attachment.data}" alt="Attachment"></div>`;
      } else {
        attachmentHtml = `<div class="commenter-comment-attachment">📎 ${comment.attachment.name}</div>`;
      }
    }
    
    document.getElementById('modal-body').innerHTML = `
      <div class="commenter-comment-meta">
        Status: <strong>${comment.status}</strong> | 
        ${new Date(comment.timestamp).toLocaleString()}
      </div>
      <div class="commenter-comment-text">${comment.text}</div>
      ${attachmentHtml}
    `;
    
    document.querySelector('.commenter-modal-buttons').innerHTML = `
      <button class="secondary" onclick="window.commenterCloseModal()">Close</button>
    `;
    
    modal.classList.add('show');
  }
  
  // Global functions
  window.commenterCloseModal = closeModal;
  window.commenterSubmit = submitComment;
  
  // Load comments on page load
  loadComments();
})();
