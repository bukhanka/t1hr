# SciBox Talent Management System - Docker Management

.PHONY: help dev-up dev-down prod-up prod-down db-up db-down logs clean build check-docker

# Detect Docker Compose command (docker-compose vs docker compose)
DOCKER_COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# Check if running on Windows (Git Bash/WSL detection)
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
    DETECTED_OS := $(shell uname -s)
endif

# Default target
help:
	@echo "SciBox Talent Management System"
	@echo "Detected OS: $(DETECTED_OS)"
	@echo "Docker Compose: $(DOCKER_COMPOSE)"
	@echo ""
	@echo "Available commands:"
	@echo "  dev-up        - Start development environment"
	@echo "  dev-down      - Stop development environment"
	@echo "  db-up         - Start only database services"
	@echo "  db-down       - Stop database services"
	@echo "  prod-build    - Build production Docker image"
	@echo "  prod-up       - Start production environment"
	@echo "  prod-down     - Stop production environment"
	@echo "  logs          - Show application logs"
	@echo "  db-migrate    - Run database migrations"
	@echo "  db-seed       - Seed database with sample data"
	@echo "  clean         - Remove all containers and volumes"

# Check Docker availability
check-docker:
	@docker --version > /dev/null 2>&1 || { echo "❌ Docker is not installed or not running"; exit 1; }
	@$(DOCKER_COMPOSE) version > /dev/null 2>&1 || { echo "❌ Docker Compose is not available"; exit 1; }
	@echo "✅ Docker and Docker Compose are available"

# Development commands
dev-up: check-docker
	@echo "Starting development environment..."
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Application available at http://localhost:3000"

dev-down: check-docker
	@echo "Stopping development environment..."
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml down

# Database only commands
db-up: check-docker
	@echo "Starting database services..."
	$(DOCKER_COMPOSE) up -d postgres redis

db-down: check-docker
	@echo "Stopping database services..."
	$(DOCKER_COMPOSE) stop postgres redis

# Production commands
prod-build: check-docker
	@echo "Building production Docker image..."
	docker build -t scibox-talent:latest .

prod-up: check-docker
	@echo "Starting production environment..."
	$(DOCKER_COMPOSE) up -d

prod-down: check-docker
	@echo "Stopping production environment..."
	$(DOCKER_COMPOSE) down

# Utility commands
logs: check-docker
	$(DOCKER_COMPOSE) logs -f app

logs-db: check-docker
	$(DOCKER_COMPOSE) logs -f postgres

db-migrate: check-docker
	@echo "Running database migrations..."
	$(DOCKER_COMPOSE) exec app npx prisma migrate deploy

db-seed: check-docker
	@echo "Seeding database..."
	$(DOCKER_COMPOSE) exec app npx prisma db seed

db-reset: check-docker
	@echo "Resetting database..."
	$(DOCKER_COMPOSE) exec app npx prisma migrate reset --force

# Cleanup commands
clean: check-docker
	@echo "Removing all containers and volumes..."
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

# Quick setup for new developers
setup: check-docker
	@echo "Setting up development environment..."
	@echo "Detected OS: $(DETECTED_OS)"
	@echo "Using Docker Compose: $(DOCKER_COMPOSE)"
	@echo ""
	@if [ ! -f .env.local ]; then \
		echo "📝 Creating .env.local from template..."; \
		cp env.example .env.local; \
		echo "⚠️  Please edit .env.local with your SciBox API key"; \
	else \
		echo "✅ .env.local already exists"; \
	fi
	@echo "📦 Installing dependencies..."
	npm install
	@echo "🐳 Starting database services..."
	make db-up
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	@echo "🔧 Running database migrations..."
	npx prisma migrate dev --name init
	npx prisma generate
	@echo "✅ Setup complete! Run 'make dev-up' to start development."
