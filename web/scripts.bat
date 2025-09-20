@echo off
REM SciBox Talent Management System - Windows Scripts
REM Alternative to Makefile for Windows users

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="setup" goto setup
if "%1"=="dev-up" goto dev-up
if "%1"=="dev-down" goto dev-down
if "%1"=="db-up" goto db-up
if "%1"=="db-down" goto db-down
if "%1"=="logs" goto logs
if "%1"=="clean" goto clean
goto help

:help
echo SciBox Talent Management System - Windows Scripts
echo.
echo Available commands:
echo   scripts.bat setup     - Set up development environment
echo   scripts.bat dev-up    - Start development environment
echo   scripts.bat dev-down  - Stop development environment
echo   scripts.bat db-up     - Start database services only
echo   scripts.bat db-down   - Stop database services
echo   scripts.bat logs      - Show application logs
echo   scripts.bat clean     - Clean up containers and volumes
echo.
echo For PowerShell users, you can also use: .\scripts.bat setup
goto end

:setup
echo Setting up development environment...
if not exist .env.local (
    echo Creating .env.local from template...
    copy env.example .env.local
    echo Please edit .env.local with your SciBox API key
) else (
    echo .env.local already exists
)
echo Installing dependencies...
npm install
echo Starting database services...
docker compose up -d postgres redis
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul
echo Running database migrations...
npx prisma migrate dev --name init
npx prisma generate
echo Setup complete! Run 'scripts.bat dev-up' to start development.
goto end

:dev-up
echo Starting development environment...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
echo Application available at http://localhost:3000
goto end

:dev-down
echo Stopping development environment...
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
goto end

:db-up
echo Starting database services...
docker compose up -d postgres redis
goto end

:db-down
echo Stopping database services...
docker compose stop postgres redis
goto end

:logs
docker compose logs -f app
goto end

:clean
echo Removing all containers and volumes...
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
docker system prune -f
goto end

:end
