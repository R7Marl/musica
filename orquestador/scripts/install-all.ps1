. "$PSScriptRoot/common.ps1"

Write-Host "Instalando dependencias del backend..."
Push-Location $BackendPath
try {
  npm.cmd install
} finally {
  Pop-Location
}

Write-Host "Instalando dependencias del frontend..."
Push-Location $FrontendPath
try {
  npm.cmd install
} finally {
  Pop-Location
}
