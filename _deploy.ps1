$ErrorActionPreference = "Stop"
$root = "d:\自己的网站"
$sourceDir = Join-Path ([System.IO.Path]::GetTempPath()) ("trae-deploy-" + [guid]::NewGuid().ToString("N"))
$publicDir = Join-Path $sourceDir "public"
New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
Copy-Item -Path (Join-Path $root "index.html"),(Join-Path $root "style.css"),(Join-Path $root "script.js"),(Join-Path $root "public\version.json") -Destination $publicDir
$cfg = Join-Path ([System.IO.Path]::GetTempPath()) ("exec-config-" + (Get-Random) + ".json")
Set-Content -Path $cfg -Value "{}" -Encoding UTF8
$exe = "C:\Users\阿文\.trae-cn\plugins\trae-remote-official\deployment\0.0.38\skills\deployment\bin\win32-x64\trae-deploy.exe"
$arg = "`"$exe`" deployments create --site-id 37jamnj6ip4n3i2dq5k --title ReleaseV11NoAPK --description ReleaseVersion2NoAPK --type static-web --source-dir `"$sourceDir`" --execution-config `"$cfg`" --app-tags 123"
$result = & cmd.exe /d /s /c $arg
$depId = ($result | ConvertFrom-Json).data.deployment_id
Write-Output "DEPLOY_ID=$depId"
$arg2 = "`"$exe`" deployments wait --deployment-id $depId"
& cmd.exe /d /s /c $arg2 | Select-String -Pattern '"status":9|wait_reason'
