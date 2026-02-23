# Parse Time Log Markdown Files
# Reads memory/timelog/*.md files and generates aggregated time tracking data

param(
    [string]$WorkspaceRoot = "C:\Users\benke\.openclaw\workspace",
    [string]$OutputPath = "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards\data\time-data.json"
)

function Parse-TimeEntry {
    param([string]$Line)
    
    # Parse table row: | Start | End | Duration | Activity | Category |
    # Example: | 12:00 AM | 7:30 AM | 7.5h | Sleep | sleep |
    if ($Line -match '\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|') {
        $start = $matches[1].Trim()
        $end = $matches[2].Trim()
        $duration = $matches[3].Trim()
        $activity = $matches[4].Trim()
        $category = $matches[5].Trim()
        
        # Extract numeric hours from duration (e.g., "7.5h" -> 7.5)
        if ($duration -match '(\d+\.?\d*)h?') {
            $hours = [double]$matches[1]
            
            return @{
                Start = $start
                End = $end
                Hours = $hours
                Activity = $activity
                Category = $category
            }
        }
    }
    
    return $null
}

function Get-TopLevelCategory {
    param([string]$Category)
    
    # Map detailed categories to top-level (e.g., "personal/morning" -> "personal")
    if ($Category -match '^([^/]+)') {
        return $matches[1].ToLower()
    }
    
    return $Category.ToLower()
}

# Find all time log files
$timeLogDir = Join-Path $WorkspaceRoot "memory\timelog"
if (-not (Test-Path $timeLogDir)) {
    Write-Error "Time log directory not found: $timeLogDir"
    exit 1
}

$logFiles = Get-ChildItem -Path $timeLogDir -Filter "*.md" | Sort-Object Name -Descending

# Parse all entries
$allEntries = @()
$entriesByDate = @{}

foreach ($file in $logFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"
    
    # Extract date from filename (YYYY-MM-DD.md)
    $dateStr = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    
    $dateEntries = @()
    
    foreach ($line in $lines) {
        $entry = Parse-TimeEntry $line
        if ($entry) {
            $entry.Date = $dateStr
            $allEntries += $entry
            $dateEntries += $entry
        }
    }
    
    if ($dateEntries.Count -gt 0) {
        $entriesByDate[$dateStr] = $dateEntries
    }
}

# Get today's date and recent dates
$today = Get-Date -Format "yyyy-MM-dd"
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")

# Calculate this week's start (Monday)
$todayDayOfWeek = (Get-Date).DayOfWeek.value__
$daysToMonday = if ($todayDayOfWeek -eq 0) { 6 } else { $todayDayOfWeek - 1 }
$weekStart = (Get-Date).AddDays(-$daysToMonday).ToString("yyyy-MM-dd")

# Filter entries for this week
$thisWeekEntries = $allEntries | Where-Object {
    $_.Date -ge $weekStart
}

# If this week has no data yet (e.g., Monday morning), use last week instead
if ($thisWeekEntries.Count -eq 0) {
    $lastWeekStart = (Get-Date).AddDays(-$daysToMonday - 7).ToString("yyyy-MM-dd")
    $lastWeekEnd = (Get-Date).AddDays(-$daysToMonday - 1).ToString("yyyy-MM-dd")
    $thisWeekEntries = $allEntries | Where-Object {
        $_.Date -ge $lastWeekStart -and $_.Date -le $lastWeekEnd
    }
}

# Aggregate by top-level category for the week
$categoryTotals = @{}
foreach ($entry in $thisWeekEntries) {
    $topCategory = Get-TopLevelCategory $entry.Category
    if (-not $categoryTotals.ContainsKey($topCategory)) {
        $categoryTotals[$topCategory] = 0
    }
    $categoryTotals[$topCategory] += $entry.Hours
}

# Calculate category breakdown
$categories = @()
$totalHours = ($categoryTotals.Values | Measure-Object -Sum).Sum
if ($totalHours -eq 0) { $totalHours = 1 }  # Avoid division by zero

foreach ($cat in $categoryTotals.Keys | Sort-Object) {
    $categories += @{
        name = $cat
        hours = [math]::Round($categoryTotals[$cat], 1)
        percentage = [math]::Round(($categoryTotals[$cat] / $totalHours) * 100, 1)
    }
}

# Calculate today's totals
$todayEntries = $allEntries | Where-Object { $_.Date -eq $today }

# If today has no data yet, use yesterday instead
if ($todayEntries.Count -eq 0) {
    $todayEntries = $allEntries | Where-Object { $_.Date -eq $yesterday }
}

$todayByCategory = @{}
foreach ($entry in $todayEntries) {
    $topCategory = Get-TopLevelCategory $entry.Category
    if (-not $todayByCategory.ContainsKey($topCategory)) {
        $todayByCategory[$topCategory] = 0
    }
    $todayByCategory[$topCategory] += $entry.Hours
}

$todayTotal = ($todayByCategory.Values | Measure-Object -Sum).Sum

# Get recent entries (last 20)
$recentEntries = $allEntries | Select-Object -First 20 | ForEach-Object {
    @{
        date = $_.Date
        category = $_.Category
        description = $_.Activity
        hours = [math]::Round($_.Hours, 1)
    }
}

# Build output structure
$output = @{
    week = @{
        totalWork = [math]::Round($(if ($categoryTotals.ContainsKey('work')) { $categoryTotals['work'] } else { 0 }), 1)
        totalSleep = [math]::Round($(if ($categoryTotals.ContainsKey('sleep')) { $categoryTotals['sleep'] } else { 0 }), 1)
        totalPersonal = [math]::Round($(if ($categoryTotals.ContainsKey('personal')) { $categoryTotals['personal'] } else { 0 }), 1)
        totalBreak = [math]::Round($(if ($categoryTotals.ContainsKey('break')) { $categoryTotals['break'] } else { 0 }), 1)
    }
    categories = $categories
    today = @{
        total = [math]::Round($todayTotal, 1)
        sleep = [math]::Round($(if ($todayByCategory.ContainsKey('sleep')) { $todayByCategory['sleep'] } else { 0 }), 1)
        work = [math]::Round($(if ($todayByCategory.ContainsKey('work')) { $todayByCategory['work'] } else { 0 }), 1)
        personal = [math]::Round($(if ($todayByCategory.ContainsKey('personal')) { $todayByCategory['personal'] } else { 0 }), 1)
        break = [math]::Round($(if ($todayByCategory.ContainsKey('break')) { $todayByCategory['break'] } else { 0 }), 1)
    }
    recentEntries = $recentEntries
}

# Convert to JSON and save
$json = $output | ConvertTo-Json -Depth 10 -Compress
Set-Content -Path $OutputPath -Value $json -NoNewline

Write-Host "Parsed $($allEntries.Count) time entries from $($logFiles.Count) log files"
Write-Host "This week: Work $($output.week.totalWork)h | Sleep $($output.week.totalSleep)h | Personal $($output.week.totalPersonal)h"
Write-Host "Saved to: $OutputPath"
