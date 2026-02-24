$itemId = "_x9kggcD30jcjE0-7Ymob2qtvUidsIU0u-c-4xtQMgLWa9h8c-jBcaygv1ow-EoCyWeppReoOpEkyo9scmS0sw=="
$output = & "C:\Users\benke\AppData\Local\Programs\ProtonPass\pass-cli.exe" item view $itemId --format json 2>&1 | Out-String
$json = $output | ConvertFrom-Json
Write-Host "Token: $($json.data.extra_fields[0].data.content)"
