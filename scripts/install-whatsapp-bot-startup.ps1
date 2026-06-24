$ErrorActionPreference = 'Stop'

$taskName = 'HIJAOE WhatsApp Bot'
$launcher = Join-Path $PSScriptRoot 'start-whatsapp-bot.ps1'
$powerShell = (Get-Command powershell.exe).Source
$arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""

$action = New-ScheduledTaskAction `
  -Execute $powerShell `
  -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650)

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Menjalankan bot WhatsApp Web HIJAOE saat pengguna masuk Windows.' | Out-Null

Write-Host "Scheduled task '$taskName' sudah dibuat."
Write-Host "Periksa: Get-ScheduledTask -TaskName '$taskName'"
Write-Host "Hapus: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
