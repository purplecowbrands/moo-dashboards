Set-Location "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards"

# Check current remote
Write-Host "Current remote URL:"
git remote get-url origin

# Stage changes
git add scripts/parse-time-logs-timeline.ps1
git add data/time-data.json

# Show status
Write-Host "`nGit status:"
git status --short

# Commit
Write-Host "`nCommitting..."
git commit -m "Time Tracking: Weekly Timeline View

- Created parse-time-logs-timeline.ps1 to generate timeline block data
- Parses 184 time entries into 7 days with 29 hourly blocks
- Timeline grid shows 3am-3am daily view with color-coded categories
- Week navigation and calendar overlay UI ready
- Priority 2 redesign complete per Ben's feedback"

# Push
Write-Host "`nPushing to main..."
git push origin main

Write-Host "`nDone! Cloudflare Pages will auto-deploy."
