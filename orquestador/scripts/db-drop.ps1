. "$PSScriptRoot/common.ps1"

Write-Host "Levantando servicios de desarrollo..."
Invoke-DevCompose @("up", "-d", "--build")
Wait-DevDatabase

Write-Host "Dropeando schema local..."
Invoke-DevCompose @("exec", "backend", "npm", "run", "db:drop")
