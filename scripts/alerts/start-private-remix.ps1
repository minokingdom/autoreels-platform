$ErrorActionPreference = 'Stop'
$labDir = Split-Path -Parent $PSScriptRoot
$credential = Import-Clixml -LiteralPath (Join-Path $labDir 'remix-worker-credential.xml')
$env:AR_PRIVATE_REMIX_TOKEN = [Net.NetworkCredential]::new('', $credential).Password
$env:PYTHONUTF8 = '1'
$env:AR_PRIVATE_REMIX_SUPERVISOR = [string]$PID
$env:PATH = 'C:\Users\ektjt\Apps\design-tools\runtime\ffmpeg;C:\Users\ektjt\Apps\design-tools\runtime\node-v24.22.1-win-x64;' + $env:PATH
& (Join-Path $labDir '.venv\Scripts\python.exe') -u (Join-Path $PSScriptRoot 'private_remix_worker.py')
exit $LASTEXITCODE
