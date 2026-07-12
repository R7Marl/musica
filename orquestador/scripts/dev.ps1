. "$PSScriptRoot/common.ps1"

Write-Host "Levantando QFit en desarrollo con Docker Compose Watch..."
Write-Host "Backend:  http://localhost:3000"
Write-Host "Frontend: http://localhost:3001"

Invoke-DevCompose @("up", "--build", "--watch")
