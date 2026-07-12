. "$PSScriptRoot/common.ps1"

Write-Host "Levantando servicios de desarrollo..."
Invoke-DevCompose @("up", "-d", "--build")
Wait-DevDatabase

Write-Host "Dropeando schema y reconstruyendo la base local con migraciones..."
Invoke-DevCompose @("exec", "backend", "npm", "run", "db:reset")
