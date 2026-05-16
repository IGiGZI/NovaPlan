<#
PowerShell setup script for project virtual environment and dependencies.
Run from PowerShell in the project folder:
  ./setup_env.ps1
This script:
  - creates a `.venv` virtual environment (if missing)
  - activates it for the current session
  - upgrades pip and installs `requirements.txt`

It is intended for teammates to run locally. The script is safe to re-run.
#>

Param(
  [switch]$Recreate
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Set-Location $root

Write-Host "Project path: $root"

$venvPath = Join-Path $root '.venv'

if ($Recreate -and (Test-Path $venvPath)) {
    Write-Host "Removing existing .venv (recreate requested)..."
    Remove-Item -Recurse -Force $venvPath
}

if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment at $venvPath"
    py -3 -m venv $venvPath
} else {
    Write-Host "Virtual environment already exists at $venvPath"
}

Write-Host "Activating virtual environment..."
try {
    . "$venvPath\Scripts\Activate.ps1"
} catch {
    Write-Host "Activation failed. If ExecutionPolicy prevents running scripts, run:`n  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`nThen run this script again." -ForegroundColor Yellow
    throw
}

Write-Host "Upgrading pip and installing requirements..."
py -m pip install --upgrade pip
if (Test-Path (Join-Path $root 'requirements.txt')) {
    py -m pip install -r (Join-Path $root 'requirements.txt')
} else {
    Write-Host "No requirements.txt found in $root" -ForegroundColor Yellow
}

Write-Host "Setup complete. To activate the venv in a new PowerShell session:" -ForegroundColor Green
Write-Host "  cd \"$root\"" -ForegroundColor Cyan
Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Cyan

Write-Host "To run the backend:" -ForegroundColor Green
Write-Host "  py -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor Cyan

Write-Host "If you want a cross-platform helper, use setup_env.sh (for macOS/Linux)." -ForegroundColor Green
