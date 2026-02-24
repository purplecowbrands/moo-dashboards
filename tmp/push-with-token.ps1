Set-Location "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards"

# Retrieve GitHub token from Proton Pass
$itemId = "_x9kggcD30jcjE0-7Ymob2qtvUidsIU0u-c-4xtQMgLWa9h8c-jBcaygv1ow-EoCyWeppReoOpEkyo9scmS0sw=="
$passRaw = & "C:\Users\benke\AppData\Local\Programs\ProtonPass\pass-cli.exe" item view $itemId 2>&1

# Extract token from output (it's in extra_fields section)
$tokenLine = $passRaw | Select-String "Hidden:" | Select-Object -First 1
if ($tokenLine) {
    $token = ($tokenLine.Line -split "Hidden: ")[1].Trim()
    Write-Host "Token retrieved (length: $($token.Length))"
    
    # Set remote URL with token
    $remoteUrl = "https://x-access-token:$token@github.com/purplecowbrands/moo-dashboards.git"
    git remote set-url origin $remoteUrl
    
    Write-Host "Remote URL updated with authentication token"
    
    # Push
    Write-Host "`nPushing to main..."
    git push origin main
    
    Write-Host "`nDone! Cloudflare Pages will auto-deploy."
} else {
    Write-Error "Failed to extract token from Proton Pass output"
}
