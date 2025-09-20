# SciBox Talent Management System - PowerShell Scripts
# Alternative to Makefile for Windows PowerShell users

param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "SciBox Talent Management System - PowerShell Scripts" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  .\scripts.ps1 setup     - Set up development environment" -ForegroundColor Green
    Write-Host "  .\scripts.ps1 dev-up    - Start development environment" -ForegroundColor Green
    Write-Host "  .\scripts.ps1 dev-down  - Stop development environment" -ForegroundColor Green
    Write-Host "  .\scripts.ps1 db-up     - Start database services only" -ForegroundColor Green
    Write-Host "  .\scripts.ps1 db-down   - Stop database services" -ForegroundColor Green
    Write-Host "  .\scripts.ps1 logs      - Show application logs" -ForegroundColor Green
    Write-Host "  .\scripts.ps1 clean     - Clean up containers and volumes" -ForegroundColor Green
    Write-Host ""
}

function Test-DockerCompose {
    try {
        $null = docker compose version 2>$null
        return "docker compose"
    }
    catch {
        try {
            $null = docker-compose version 2>$null
            return "docker-compose"
        }
        catch {
            Write-Error "Docker Compose is not available. Please install Docker Desktop."
            exit 1
        }
    }
}

function Invoke-Setup {
    Write-Host "Setting up development environment..." -ForegroundColor Cyan
    
    $dockerCompose = Test-DockerCompose
    Write-Host "Using Docker Compose: $dockerCompose" -ForegroundColor Green
    
    if (-not (Test-Path ".env.local")) {
        Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
        Copy-Item "env.example" ".env.local"
        Write-Host "⚠️ Please edit .env.local with your SciBox API key" -ForegroundColor Red
    } else {
        Write-Host "✅ .env.local already exists" -ForegroundColor Green
    }
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Starting database services..." -ForegroundColor Yellow
    & $dockerCompose up -d postgres redis
    
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep 10
    
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npx prisma migrate dev --name init
    npx prisma generate
    
    Write-Host "✅ Setup complete! Run '.\scripts.ps1 dev-up' to start development." -ForegroundColor Green
}

function Invoke-DevUp {
    $dockerCompose = Test-DockerCompose
    Write-Host "Starting development environment..." -ForegroundColor Cyan
    & $dockerCompose -f docker-compose.yml -f docker-compose.dev.yml up -d
    Write-Host "✅ Application available at http://localhost:3000" -ForegroundColor Green
}

function Invoke-DevDown {
    $dockerCompose = Test-DockerCompose
    Write-Host "Stopping development environment..." -ForegroundColor Cyan
    & $dockerCompose -f docker-compose.yml -f docker-compose.dev.yml down
}

function Invoke-DbUp {
    $dockerCompose = Test-DockerCompose
    Write-Host "Starting database services..." -ForegroundColor Cyan
    & $dockerCompose up -d postgres redis
}

function Invoke-DbDown {
    $dockerCompose = Test-DockerCompose
    Write-Host "Stopping database services..." -ForegroundColor Cyan
    & $dockerCompose stop postgres redis
}

function Invoke-Logs {
    $dockerCompose = Test-DockerCompose
    & $dockerCompose logs -f app
}

function Invoke-Clean {
    $dockerCompose = Test-DockerCompose
    Write-Host "Removing all containers and volumes..." -ForegroundColor Cyan
    & $dockerCompose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
    docker system prune -f
}

# Main command dispatcher
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "setup" { Invoke-Setup }
    "dev-up" { Invoke-DevUp }
    "dev-down" { Invoke-DevDown }
    "db-up" { Invoke-DbUp }
    "db-down" { Invoke-DbDown }
    "logs" { Invoke-Logs }
    "clean" { Invoke-Clean }
    default { 
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help 
    }
}
