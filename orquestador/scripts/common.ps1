$ErrorActionPreference = "Stop"

$OrchestratorPath = Split-Path -Parent $PSScriptRoot
$ProjectRoot = Split-Path -Parent $OrchestratorPath
$DevComposeFile = Join-Path $OrchestratorPath "docker-compose.dev.yml"
$ProdComposeFile = Join-Path $OrchestratorPath "docker-compose.yml"
$ProdEnvFile = Join-Path $OrchestratorPath ".env"

function Invoke-OrchestratorCompose {
  param(
    [Parameter(Mandatory = $true)][string] $ComposeFile,
    [Parameter(Mandatory = $true)][string[]] $ComposeArgs,
    [string] $EnvFile
  )

  $arguments = @("compose")

  if ($EnvFile -and (Test-Path $EnvFile)) {
    $arguments += @("--env-file", $EnvFile)
  }

  $arguments += @("-f", $ComposeFile)
  $arguments += $ComposeArgs

  Push-Location $OrchestratorPath
  try {
    & docker @arguments
  } finally {
    Pop-Location
  }
}

function Invoke-DevCompose {
  param([Parameter(Mandatory = $true)][string[]] $ComposeArgs)

  Invoke-OrchestratorCompose -ComposeFile $DevComposeFile -ComposeArgs $ComposeArgs
}

function Invoke-ProdCompose {
  param([Parameter(Mandatory = $true)][string[]] $ComposeArgs)

  Invoke-OrchestratorCompose `
    -ComposeFile $ProdComposeFile `
    -ComposeArgs $ComposeArgs `
    -EnvFile $ProdEnvFile
}

function Wait-DevDatabase {
  Write-Host "Esperando a que Postgres este listo..."

  for ($i = 0; $i -lt 60; $i++) {
    $status = docker inspect -f "{{.State.Health.Status}}" cola-gym-postgres-dev 2>$null

    if ($status -eq "healthy") {
      Write-Host "Postgres listo."
      return
    }

    Start-Sleep -Seconds 1
  }

  throw "Postgres no quedo listo a tiempo. Revisa Docker Desktop."
}
