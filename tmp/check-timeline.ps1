$content = Get-Content "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards\css\styles.css" -Raw
if ($content -match 'timeline') {
    Write-Host "Timeline styles found in CSS"
} else {
    Write-Host "No timeline styles found in CSS"
}
