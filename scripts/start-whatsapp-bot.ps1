$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $repo 'logs\whatsapp-bot'
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$stdout = Join-Path $logs 'stdout.log'
$stderr = Join-Path $logs 'stderr.log'

Start-Process -FilePath 'node.exe' `
  -ArgumentList 'assistant/bot/main.js' `
  -WorkingDirectory $repo `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -WindowStyle Hidden `
  -Wait
