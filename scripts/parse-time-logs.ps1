# Parse Time Log Markdown Files
# Reads memory/timelog/*.md files and generates aggregated time tracking data

param(
    [string]$WorkspaceRoot = "C:\Users\benke\.openclaw\workspace",
    [string]$OutputPath = "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards\data\time-data.json"
)

function Parse-TimeEntry {
    param([string]$Line)
    
    # Parse list format: - START-END | CATEGORY | DESCRIPTION (DURATIONh)
    # Example: - 12:00-8:30 AM | Sleep | Night sleep (8.5h)
    if ($Line -match '^-\s+([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^(]+)\s*\(([^)]+)\)') {
        $timeRange = $matches[1].Trim()
        $category = $matches[2].Trim()
        $description = $matches[3].Trim()
        $duration = $matches[4].Trim()
        
        # Extract numeric hours from duration (e.g., "8.5h" -> 8.5)
        if ($duration -match '(\d+\.?\d*)h?') {
            $hours = [double]$matches[1]
            
            return @{
                TimeRange = $timeRange
                Hours = $hours
                Activity = $description
                Category = $category
            }
        }
    }
    
    return $null
}

function Get-TopLevelCategory {
    param([string]$Category)
    
    # Map detailed categories to top-level (e.g., "Personal" -> "personal", "Moo/Systems" -> "work")
    $cat = $Category.ToLower()
    
    # Handle special categories
    if ($cat -match 'moo|systems|dev|admin|finance|work') {
        return 'work'
    }
    
    if ($cat -match 'personal') {
        return 'personal'
    }
    
    if ($cat -match 'sleep') {
        return 'sleep'
    }
    
    if ($cat -match 'break') {
        return 'break'
    }
    
    # Default
    return $cat
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
    
    # Extract date from filename or header (YYYY-MM-DD)
    if ($file.Name -match '(\d{4}-\d{2}-\d{2})') {
        $dateStr = $matches[1]
    } else {
        continue
    }
    
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
    $weekStart = $lastWeekStart
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

# NEW: Build daily breakdown for this week (Mon-Sun)
$weekStartDate = [DateTime]::ParseExact($weekStart, "yyyy-MM-dd", $null)
$dailyBreakdown = @()
$dayNames = @('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')

for ($i = 0; $i -lt 7; $i++) {
    $date = $weekStartDate.AddDays($i).ToString("yyyy-MM-dd")
    $dayName = $dayNames[$i]
    
    # Get entries for this day
    $dayEntries = $allEntries | Where-Object { $_.Date -eq $date }
    
    # Aggregate by top-level category
    $dayCategories = @{}
    foreach ($entry in $dayEntries) {
        $topCategory = Get-TopLevelCategory $entry.Category
        if (-not $dayCategories.ContainsKey($topCategory)) {
            $dayCategories[$topCategory] = 0
        }
        $dayCategories[$topCategory] += $entry.Hours
    }
    
    # Build day object
    $dayData = @{
        date = $date
        dayName = $dayName
        sleep = [math]::Round($(if ($dayCategories.ContainsKey('sleep')) { $dayCategories['sleep'] } else { 0 }), 1)
        work = [math]::Round($(if ($dayCategories.ContainsKey('work')) { $dayCategories['work'] } else { 0 }), 1)
        personal = [math]::Round($(if ($dayCategories.ContainsKey('personal')) { $dayCategories['personal'] } else { 0 }), 1)
        break = [math]::Round($(if ($dayCategories.ContainsKey('break')) { $dayCategories['break'] } else { 0 }), 1)
    }
    
    $dailyBreakdown += $dayData
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
    dailyBreakdown = $dailyBreakdown
}

# Convert to JSON and save
$json = $output | ConvertTo-Json -Depth 10 -Compress
Set-Content -Path $OutputPath -Value $json -NoNewline

Write-Host "Parsed $($allEntries.Count) time entries from $($logFiles.Count) log files"
Write-Host "This week: Work $($output.week.totalWork)h | Sleep $($output.week.totalSleep)h | Personal $($output.week.totalPersonal)h"
Write-Host "Daily breakdown: $($dailyBreakdown.Count) days"
Write-Host "Saved to: $OutputPath"
