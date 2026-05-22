param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Resolve-Command {
    param(
        [string[]]$Names,
        [string]$InstallHint
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    throw "$($Names -join ' or ') was not found. $InstallHint"
}

function Invoke-Tool {
    param(
        [string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = (Get-Location).Path
    )

    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE`: $FilePath $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-Python {
    param(
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    if ($script:PyLauncher) {
        Invoke-Tool -FilePath $script:PyLauncher -Arguments (@("-3") + $Arguments) -WorkingDirectory $WorkingDirectory
    }
    else {
        Invoke-Tool -FilePath $script:PythonExe -Arguments $Arguments -WorkingDirectory $WorkingDirectory
    }
}

function Set-LocalBackendEnvironment {
    $env:DEBUG = "True"
    $env:DATABASE_URL = ""
    $env:DATABASE_ENGINE = "sqlite"
    $env:SQLITE_NAME = "db.sqlite3"
    $env:FRONTEND_URL = "http://localhost:5173"
    $env:FRONTEND_URLS = "http://localhost:5173,http://127.0.0.1:5173"
    $env:SECURE_SSL_REDIRECT = "False"
    $env:SECURE_HSTS_SECONDS = "0"
    $env:SECURE_HSTS_INCLUDE_SUBDOMAINS = "False"
    $env:SECURE_HSTS_PRELOAD = "False"
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BackendVenv = Join-Path $BackendDir ".venv"
$BackendPython = Join-Path $BackendVenv "Scripts\python.exe"

Write-Host "SnapSpend local launcher" -ForegroundColor Green
Write-Host "Project: $ProjectRoot"

$script:PyLauncher = Get-Command "py" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $script:PyLauncher) {
    $script:PythonExe = Resolve-Command -Names @("python") -InstallHint "Install Python 3.11+ from https://www.python.org/downloads/windows/ and enable Add python.exe to PATH."
}

$NpmExe = Resolve-Command -Names @("npm.cmd", "npm") -InstallHint "Install Node.js 18+ from https://nodejs.org/."

if (-not (Test-Path $BackendPython)) {
    Write-Step "Creating backend Python virtual environment"
    Invoke-Python -Arguments @("-m", "venv", $BackendVenv) -WorkingDirectory $BackendDir
}

if (-not $SkipInstall) {
    Write-Step "Installing backend requirements.txt"
    Invoke-Tool -FilePath $BackendPython -Arguments @("-m", "pip", "install", "--upgrade", "pip") -WorkingDirectory $BackendDir
    Invoke-Tool -FilePath $BackendPython -Arguments @("-m", "pip", "install", "-r", "requirements.txt") -WorkingDirectory $BackendDir

    Write-Step "Installing frontend npm packages"
    Invoke-Tool -FilePath $NpmExe -Arguments @("install") -WorkingDirectory $FrontendDir
}

Write-Step "Preparing local SQLite database"
Set-LocalBackendEnvironment
Invoke-Tool -FilePath $BackendPython -Arguments @("manage.py", "migrate") -WorkingDirectory $BackendDir
Invoke-Tool -FilePath $BackendPython -Arguments @("manage.py", "seed_categories") -WorkingDirectory $BackendDir

Write-Step "Starting backend on http://127.0.0.1:8000"
$BackendCommand = @"
`$env:DEBUG='True'
`$env:DATABASE_URL=''
`$env:DATABASE_ENGINE='sqlite'
`$env:SQLITE_NAME='db.sqlite3'
`$env:FRONTEND_URL='http://localhost:5173'
`$env:FRONTEND_URLS='http://localhost:5173,http://127.0.0.1:5173'
`$env:SECURE_SSL_REDIRECT='False'
`$env:SECURE_HSTS_SECONDS='0'
`$env:SECURE_HSTS_INCLUDE_SUBDOMAINS='False'
`$env:SECURE_HSTS_PRELOAD='False'
& '$BackendPython' manage.py runserver 127.0.0.1:8000
"@
Start-Process powershell.exe -WorkingDirectory $BackendDir -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $BackendCommand)

Write-Step "Starting frontend on http://localhost:5173"
$FrontendCommand = @"
`$env:VITE_API_BASE_URL='http://127.0.0.1:8000'
`$env:VITE_FRONTEND_ONLY='false'
& '$NpmExe' run dev -- --host 127.0.0.1 --port 5173
"@
Start-Process powershell.exe -WorkingDirectory $FrontendDir -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $FrontendCommand)

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "SnapSpend is starting. Keep the backend and frontend PowerShell windows open." -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Database: $BackendDir\db.sqlite3"
