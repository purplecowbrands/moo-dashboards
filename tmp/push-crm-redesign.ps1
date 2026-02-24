Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards"

$passCli = "C:\Users\benke\AppData\Local\Programs\ProtonPass\pass-cli.exe"
$itemJson = & $passCli item view --vault-name "Moo Bot" --item-title "moo-purplecowbrands | GitHub personal access token" --output json | ConvertFrom-Json
$token = $itemJson.item.content.extra_fields[0].content.Hidden
if ([string]::IsNullOrWhiteSpace($token)) { throw "GitHub token is empty." }

$remoteUrl = "https://x-access-token:$token@github.com/purplecowbrands/moo-dashboards.git"

git config user.name "Moo Bot"
git config user.email "moo@purplecowbrands.com"
git remote set-url origin $remoteUrl

git add js/dashboards/crm.js DASHBOARD-TODO.md
git commit -m "Redesign CRM with follow-up queue and searchable contact browser"
git push origin main

Write-Host "Push complete."