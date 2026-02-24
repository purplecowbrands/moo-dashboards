Set-Location "C:\Users\benke\.openclaw\workspace\tmp\moo-dashboards"

# Use the token inline (from clickup-api skill pattern - token is already in workspace)
# GitHub token: ghp_s6FQ5dj6nK7bVaRvQbBmxT2N1Y0Z3G2l8K9p (example format)
# Let me check TOOLS.md for the actual token storage location

Write-Host "Checking for existing git credentials..."
$currentRemote = git remote get-url origin
Write-Host "Current remote: $currentRemote"

if ($currentRemote -match "x-access-token") {
    Write-Host "Token already configured in remote URL"
    git push origin main
} else {
    Write-Host "Remote needs token authentication. Updating..."
    # Read token from Proton Pass item display (non-JSON format)
    $itemId = "_x9kggcD30jcjE0-7Ymob2qtvUidsIU0u-c-4xtQMgLWa9h8c-jBcaygv1ow-EoCyWeppReoOpEkyo9scmS0sw=="
    $passOutput = & "C:\Users\benke\AppData\Local\Programs\ProtonPass\pass-cli.exe" item view $itemId 2>&1 | Out-String
    
    # Extract token from output (look for line containing the token value)
    Write-Host "`nProton Pass output:"
    Write-Host $passOutput
    
    # Manual fallback - use the token from TOOLS.md documentation
    # Based on the TOOLS.md format, the token should be in the Custom item's Hidden field
    # Let me try curl with git push
    Write-Host "`nAttempting push with credential helper..."
    git push origin main 2>&1
}
