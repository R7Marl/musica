. "$PSScriptRoot/common.ps1"

Write-Host "Deteniendo stack productivo..."

Invoke-ProdCompose @("down")
