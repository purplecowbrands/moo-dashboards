# Parse Time Log Markdown Files with Timeline Data
# Reads memory/timelog/*.md files and generates aggregated time tracking data + timeline blocks

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
            
            # Parse start/end times
            $times = Parse-TimeRange $timeRange
            
            return @{
                TimeRange = $timeRange
                StartTime = $times.Start
                EndTime = $times.End
                Hours = $hours
                Activity = $description
                Category = $category
            }
        }
    }
    
    return $null
}

function Parse-TimeRange {
    param([string]$TimeRange)
    
    # Handle formats like "12:00-8:30 AM", "09:30-10:00", "3:00 PM-5:30 PM"
    if ($TimeRange -match '(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?') {
        $startHour = [int]$matches[1]
        $startMin = [int]$matches[2]
        $endHour = [int]$matches[3]
        $endMin = [int]$matches[4]
        $modifier = if ($matches[5]) { $matches[5] } else { "" }
        
        # Convert to 24-hour format
        if ($modifier -eq "PM" -and $endHour -lt 12) {
            $endHour += 12
        } elseif ($modifier -eq "AM" -and $endHour -eq 12) {
            $endHour = 0
        }
        
        # Handle implicit AM/PM (e.g., "12:00-8:30 AM" means 12:00 AM to 8:30 AM)
        if ($modifier -eq "AM" -and $startHour -eq 12) {
            $startHour = 0
        }
        
        # Handle day wraparound (e.g., 23:00 to 07:00 next day)
        # If end < start, assume it wrapped to next day
        # For our 3am-3am timeline, we'll handle this later
        
        return @{
            Start = "{0:D2}:{1:D2}" -f $startHour, $startMin
            End = "{0:D2}:{1:D2}" -f $endHour, $endMin
        }
    }
    
    # Fallback for unparseable formats
    return @{
        Start = "00:00"
        End = "00:00"
    }
}

function Get-TopLevelCategory {
    param([string]$Category)
    
    # Map detailed categories to top-level
    $cat = $Category.ToLower()
    
    if ($cat -match 'moo|systems|dev|admin|finance|work') {
        return 'Work'
    }
    
    if ($cat -match 'personal') {
        return 'Personal'
    }
    
    if ($cat -match 'sleep') {
        return 'Sleep'
    }
    
    if ($cat -match 'break') {
        return 'Break'
    }
    
    # Default
    return $cat
}

function Calculate-DurationMinutes {
    param(
        [string]$StartTime,
        [string]$EndTime
    )
    
    # Parse HH:MM format
    if ($StartTime -match '(\d{2}):(\d{2})' -and $EndTime -match '(\d{2}):(\d{2})') {
        $startHour = [int]$matches[1]
        $startMin = [int]$matches[2]
        $StartTime -match '(\d{2}):(\d{2})' | Out-Null
        $startTotalMin = $startHour * 60 + $startMin
        
        $EndTime -match '(\d{2}):(\d{2})' | Out-Null
        $endHour = [int]$matches[1]
        $endMin = [int]$matches[2]
        $endTotalMin = $endHour * 60 + $endMin
        
        # Handle day wraparound
        if ($endTotalMin -lt $startTotalMin) {
            $endTotalMin += 24 * 60
        }
        
        return $endTotalMin - $startTotalMin
    }
    
    return 0
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
    
    # Extract date from filename (YYYY-MM-DD)
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

# If this week has no data yet, use last week instead
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
if ($totalHours -eq 0) { $totalHours = 1 }

foreach ($cat in $categoryTotals.Keys | Sort-Object) {
    $categories += @{
        name = $cat
        hours = [math]::Round($categoryTotals[$cat], 1)
        percentage = [math]::Round(($categoryTotals[$cat] / $totalHours) * 100, 1)
    }
}

# Calculate today's totals
$todayEntries = $allEntries | Where-Object { $_.Date -eq $today }
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

# Build daily breakdown for bar chart (Mon-Sun)
$weekStartDate = [DateTime]::ParseExact($weekStart, "yyyy-MM-dd", $null)
$dailyBreakdown = @()
$dayNames = @('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')

for ($i = 0; $i -lt 7; $i++) {
    $date = $weekStartDate.AddDays($i).ToString("yyyy-MM-dd")
    $dayName = $dayNames[$i]
    
    $dayEntries = $allEntries | Where-Object { $_.Date -eq $date }
    
    $dayCategories = @{}
    foreach ($entry in $dayEntries) {
        $topCategory = Get-TopLevelCategory $entry.Category
        if (-not $dayCategories.ContainsKey($topCategory)) {
            $dayCategories[$topCategory] = 0
        }
        $dayCategories[$topCategory] += $entry.Hours
    }
    
    $dayData = @{
        date = $date
        dayName = $dayName
        sleep = [math]::Round($(if ($dayCategories.ContainsKey('Sleep')) { $dayCategories['Sleep'] } else { 0 }), 1)
        work = [math]::Round($(if ($dayCategories.ContainsKey('Work')) { $dayCategories['Work'] } else { 0 }), 1)
        personal = [math]::Round($(if ($dayCategories.ContainsKey('Personal')) { $dayCategories['Personal'] } else { 0 }), 1)
        break = [math]::Round($(if ($dayCategories.ContainsKey('Break')) { $dayCategories['Break'] } else { 0 }), 1)
    }
    
    $dailyBreakdown += $dayData
}

# NEW: Build timeline data for this week
$timelineDays = @()

for ($i = 0; $i -lt 7; $i++) {
    $date = $weekStartDate.AddDays($i).ToString("yyyy-MM-dd")
    $dayName = $dayNames[$i]
    $dayOfMonth = $weekStartDate.AddDays($i).Day
    $month = $weekStartDate.AddDays($i).Month
    $dateLabel = "{0}/{1}" -f $month, $dayOfMonth
    
    $dayEntries = $allEntries | Where-Object { $_.Date -eq $date }
    
    # Convert entries to timeline blocks
    $blocks = @()
    foreach ($entry in $dayEntries) {
        $topCategory = Get-TopLevelCategory $entry.Category
        $durationMin = Calculate-DurationMinutes $entry.StartTime $entry.EndTime
        
        $blocks += @{
            category = $topCategory
            description = $entry.Activity
            startTime = $entry.StartTime
            endTime = $entry.EndTime
            durationMinutes = $durationMin
        }
    }
    
    # Sort blocks by start time
    $blocks = $blocks | Sort-Object { [DateTime]::ParseExact($_.startTime, "HH:mm", $null) }
    
    $timelineDays += @{
        dayName = $dayName
        date = $dateLabel
        blocks = $blocks
    }
}

# Build output structure
$output = @{
    week = @{
        totalWork = [math]::Round($(if ($categoryTotals.ContainsKey('Work')) { $categoryTotals['Work'] } else { 0 }), 1)
        totalSleep = [math]::Round($(if ($categoryTotals.ContainsKey('Sleep')) { $categoryTotals['Sleep'] } else { 0 }), 1)
        totalPersonal = [math]::Round($(if ($categoryTotals.ContainsKey('Personal')) { $categoryTotals['Personal'] } else { 0 }), 1)
        totalBreak = [math]::Round($(if ($categoryTotals.ContainsKey('Break')) { $categoryTotals['Break'] } else { 0 }), 1)
    }
    categories = $categories
    today = @{
        total = [math]::Round($todayTotal, 1)
        sleep = [math]::Round($(if ($todayByCategory.ContainsKey('Sleep')) { $todayByCategory['Sleep'] } else { 0 }), 1)
        work = [math]::Round($(if ($todayByCategory.ContainsKey('Work')) { $todayByCategory['Work'] } else { 0 }), 1)
        personal = [math]::Round($(if ($todayByCategory.ContainsKey('Personal')) { $todayByCategory['Personal'] } else { 0 }), 1)
        break = [math]::Round($(if ($todayByCategory.ContainsKey('Break')) { $todayByCategory['Break'] } else { 0 }), 1)
    }
    recentEntries = $recentEntries
    dailyBreakdown = $dailyBreakdown
    timeline = @{
        days = $timelineDays
    }
}

# Convert to JSON and save
$json = $output | ConvertTo-Json -Depth 10 -Compress
Set-Content -Path $OutputPath -Value $json -NoNewline

Write-Host "Parsed $($allEntries.Count) time entries from $($logFiles.Count) log files"
Write-Host "This week: Work $($output.week.totalWork)h | Sleep $($output.week.totalSleep)h | Personal $($output.week.totalPersonal)h"
Write-Host "Timeline: $($timelineDays.Count) days with $(($timelineDays.blocks | Measure-Object).Count) total blocks"
Write-Host "Saved to: $OutputPath"
