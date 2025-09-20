# SciBox Talent Management System - Docker Management

.PHONY: help dev-up dev-down prod-up prod-down db-up db-down logs clean build

# Default target
help:
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

# Development commands
dev-up:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "Application available at http://localhost:3000"

dev-down:
	@echo "Stopping development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Database only commands
db-up:
	@echo "Starting database services..."
	docker-compose up -d postgres redis

db-down:
	@echo "Stopping database services..."
	docker-compose down postgres redis

# Production commands
prod-build:
	@echo "Building production Docker image..."
	docker build -t scibox-talent:latest .

prod-up:
	@echo "Starting production environment..."
	docker-compose up -d

prod-down:
	@echo "Stopping production environment..."
	docker-compose down

# Utility commands
logs:
	docker-compose logs -f app

logs-db:
	docker-compose logs -f postgres

db-migrate:
	@echo "Running database migrations..."
	docker-compose exec app npx prisma migrate deploy

db-seed:
	@echo "Seeding database..."
	docker-compose exec app npx prisma db seed

db-reset:
	@echo "Resetting database..."
	docker-compose exec app npx prisma migrate reset --force

# Cleanup commands
clean:
	@echo "Removing all containers and volumes..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

# Quick setup for new developers
setup:
	@echo "Setting up development environment..."
	@if [ ! -f .env.local ]; then \
		echo "Creating .env.local from template..."; \
		cp env.example .env.local; \
		echo "Please edit .env.local with your SciBox API key"; \
	fi
	npm install
	make db-up
	@echo "Waiting for database to be ready..."
	sleep 10
	npx prisma migrate dev --name init
	npx prisma generate
