# Sync Monitoring Status to Dashboard Data Directory
# Parses the most recent monitoring log and creates a status.json file

$workspaceRoot = "C:\Users\benke\.openclaw\workspace"
$dashboardDataDir = "$workspaceRoot\tmp\moo-dashboards\data\monitoring"
$monitoringLogsDir = "$workspaceRoot\memory\overnight"

# Find most recent site-monitoring log
$latestLog = Get-ChildItem "$monitoringLogsDir\*site-monitoring.md" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $latestLog) {
    Write-Host "No monitoring logs found"
    exit 1
}

Write-Host "Reading monitoring log: $($latestLog.Name)"

# Parse log file for uptime status
$logContent = Get-Content $latestLog.FullName -Raw
$statusData = @{
    lastUpdated = $latestLog.LastWriteTime.ToString("o")
    logDate = $latestLog.Name -replace '(\d{4}-\d{2}-\d{2})-site-monitoring\.md', '$1'
    sites = @{}
}

# Extract uptime section
if ($logContent -match '## Uptime\s+([\s\S]+?)(?:\n## |\z)') {
    $uptimeSection = $matches[1]
    
    # Parse each site status line
    # Format: - **sitename**: UP (123ms) or DOWN (error)
    $uptimeSection -split "`n" | ForEach-Object {
        if ($_ -match '- \*\*(\w+)\*\*:\s+(UP|DOWN)\s+\(([^)]+)\)') {
            $siteName = $matches[1]
            $status = $matches[2]
            $detail = $matches[3]
            
            $statusData.sites[$siteName] = @{
                status = $status.ToLower()
                detail = $detail
                responseTime = if ($detail -match '(\d+)ms') { [int]$matches[1] } else { $null }
            }
        }
    }
}

# Check for alerts
$alertFile = "$workspaceRoot\monitoring\ALERT_PENDING.txt"
$statusData.hasAlerts = Test-Path $alertFile
if ($statusData.hasAlerts) {
    $statusData.alertContent = Get-Content $alertFile -Raw
}

# Write to dashboard data directory
$outputPath = "$dashboardDataDir\status.json"
$statusData | ConvertTo-Json -Depth 10 | Set-Content $outputPath -Encoding UTF8

Write-Host "Status file updated"
Write-Host "Sites parsed: $($statusData.sites.Count)"
