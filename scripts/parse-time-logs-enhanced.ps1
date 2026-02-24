# Parse Time Log Markdown Files (Enhanced with Timeline)
# Reads memory/timelog/*.md files and generates aggregated time tracking data + timeline view

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

function Convert-To24Hour {
    param([string]$Time)
    
    # Handle formats: "12:00", "8:30 AM", "2:30 PM", "9:00 AM"
    $Time = $Time.Trim()
    
    # Check if time has AM/PM
    if ($Time -match '(\d{1,2}):?(\d{2})?\s*(AM|PM)') {
        $hour = [int]$matches[1]
        $minute = if ($matches[2]) { [int]$matches[2] } else { 0 }
        $period = $matches[3]
        
        # Convert to 24-hour
        if ($period -eq 'PM' -and $hour -ne 12) {
            $hour += 12
        } elseif ($period -eq 'AM' -and $hour -eq 12) {
            $hour = 0
        }
        
        return "{0:D2}:{1:D2}" -f $hour, $minute
    }
    
    # Already in 24-hour format or just hour
    if ($Time -match '(\d{1,2}):?(\d{2})?') {
        $hour = [int]$matches[1]
        $minute = if ($matches[2]) { [int]$matches[2] } else { 0 }
        return "{0:D2}:{1:D2}" -f $hour, $minute
    }
    
    return "00:00"
}

function Parse-TimeRange {
    param([string]$TimeRange)
    
    # Handle formats:
    # "12:00-8:30 AM"
    # "9:00 AM-2:30 PM"
    # "3:00-5:00 PM"
    # "11:00 PM-12:00 AM"
    
    if ($TimeRange -match '([\d:]+)\s*-\s*([\d:]+)\s*(AM|PM)?') {
        $startStr = $matches[1].Trim()
        $endStr = $matches[2].Trim()
        $period = if ($matches[3]) { $matches[3] } else { $null }
        
        # If end time has AM/PM, apply to both if start doesn't have it
        if ($period) {
            # Check if start already has AM/PM
            if ($startStr -notmatch 'AM|PM') {
                $startStr = "$startStr $period"
            }
            if ($endStr -notmatch 'AM|PM') {
                $endStr = "$endStr $period"
            }
        }
        
        # Handle cross-period ranges like "11:00 PM-12:00 AM" or "9:00 AM-2:30 PM"
        if ($TimeRange -match '(\d{1,2}:?\d{0,2})\s*(AM|PM)?\s*-\s*(\d{1,2}:?\d{0,2})\s*(AM|PM)') {
            $startPeriod = if ($matches[2]) { $matches[2].Trim() } else { "" }
            $endPeriod = if ($matches[4]) { $matches[4].Trim() } else { "" }
            if ($startPeriod) {
                $startStr = $matches[1].Trim() + " " + $startPeriod
            } else {
                $startStr = $matches[1].Trim()
            }
            if ($endPeriod) {
                $endStr = $matches[3].Trim() + " " + $endPeriod
            } else {
                $endStr = $matches[3].Trim()
            }
        }
        
        $start24 = Convert-To24Hour $startStr
        $end24 = Convert-To24Hour $endStr
        
        # Calculate duration in minutes
        $startParts = $start24 -split ':'
        $endParts = $end24 -split ':'
        
        $startMinutes = ([int]$startParts[0] * 60) + [int]$startParts[1]
        $endMinutes = ([int]$endParts[0] * 60) + [int]$endParts[1]
        
        # Handle overnight spans (e.g., 11:00 PM to 8:30 AM next day)
        $durationMinutes = if ($endMinutes -lt $startMinutes) {
            (1440 - $startMinutes) + $endMinutes  # 1440 = 24 hours in minutes
        } else {
            $endMinutes - $startMinutes
        }
        
        return @{
            StartTime = $start24
            EndTime = $end24
            DurationMinutes = $durationMinutes
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
    
    # Default - capitalize first letter
    return (Get-Culture).TextInfo.ToTitleCase($cat)
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

# Build daily breakdown for this week (Mon-Sun)
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
        sleep = [math]::Round($(if ($dayCategories.ContainsKey('Sleep')) { $dayCategories['Sleep'] } else { 0 }), 1)
        work = [math]::Round($(if ($dayCategories.ContainsKey('Work')) { $dayCategories['Work'] } else { 0 }), 1)
        personal = [math]::Round($(if ($dayCategories.ContainsKey('Personal')) { $dayCategories['Personal'] } else { 0 }), 1)
        break = [math]::Round($(if ($dayCategories.ContainsKey('Break')) { $dayCategories['Break'] } else { 0 }), 1)
    }
    
    $dailyBreakdown += $dayData
}

# NEW: Build timeline structure with time blocks
$weekEndDate = $weekStartDate.AddDays(6)
$weekLabel = "{0} - {1}, {2}" -f $weekStartDate.ToString("MMM dd"), $weekEndDate.ToString("MMM dd"), $weekStartDate.Year

$timelineDays = @()
for ($i = 0; $i -lt 7; $i++) {
    $date = $weekStartDate.AddDays($i).ToString("yyyy-MM-dd")
    $dayName = $dayNames[$i]
    $dateFormatted = $weekStartDate.AddDays($i).ToString("MMM dd")
    
    # Get entries for this day
    $dayEntries = $allEntries | Where-Object { $_.Date -eq $date }
    
    # Parse time blocks
    $blocks = @()
    foreach ($entry in $dayEntries) {
        $timeRange = Parse-TimeRange $entry.TimeRange
        if ($timeRange) {
            $blocks += @{
                startTime = $timeRange.StartTime
                endTime = $timeRange.EndTime
                category = Get-TopLevelCategory $entry.Category
                description = $entry.Activity
                durationMinutes = $timeRange.DurationMinutes
            }
        }
    }
    
    # Sort blocks by start time
    $blocks = $blocks | Sort-Object { [datetime]::ParseExact($_.startTime, "HH:mm", $null) }
    
    $timelineDays += @{
        dayName = $dayName
        date = $dateFormatted
        blocks = $blocks
    }
}

$timeline = @{
    weekLabel = $weekLabel
    days = $timelineDays
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
    timeline = $timeline
}

# Convert to JSON and save
$json = $output | ConvertTo-Json -Depth 10 -Compress
Set-Content -Path $OutputPath -Value $json -NoNewline

Write-Host "Parsed $($allEntries.Count) time entries from $($logFiles.Count) log files"
Write-Host "This week: Work $($output.week.totalWork)h | Sleep $($output.week.totalSleep)h | Personal $($output.week.totalPersonal)h"
Write-Host "Daily breakdown: $($dailyBreakdown.Count) days"
Write-Host "Timeline: $($timeline.weekLabel) with $($timeline.days.Count) days"
$totalBlocks = ($timeline.days | ForEach-Object { $_.blocks.Count } | Measure-Object -Sum).Sum
Write-Host "Timeline blocks: $totalBlocks total time blocks parsed"
Write-Host "Saved to: $OutputPath"
