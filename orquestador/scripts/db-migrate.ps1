. "$PSScriptRoot/common.ps1"

Write-Host "Levantando servicios de desarrollo..."
Invoke-DevCompose @("up", "-d", "--build")
Wait-DevDatabase

Write-Host "Aplicando migraciones pendientes dentro del contenedor backend..."
Invoke-DevCompose @("exec", "backend", "npm", "run", "db:migrate")
