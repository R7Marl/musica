. "$PSScriptRoot/common.ps1"

Write-Host "Levantando stack productivo en contenedores..."
Write-Host "Backend:  http://localhost:3000"
Write-Host "Frontend: http://localhost:3001"

Invoke-ProdCompose @("up", "-d", "--build")
