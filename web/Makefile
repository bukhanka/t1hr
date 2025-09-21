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
	@echo "  setup         - Initial setup (first time)"
	@echo ""
	@echo "Development:"
	@echo "  dev-up        - Start development environment"
	@echo "  dev-down      - Stop development environment" 
	@echo "  db-up         - Start only database services"
	@echo "  db-down       - Stop database services"
	@echo ""
	@echo "Production:"
	@echo "  prod-build    - Build production Docker image"
	@echo "  prod-up       - Start production environment (default port 3000)"
	@echo "  prod-down     - Stop production environment"
	@echo "  build-local   - Build for local production"
	@echo "  start-local   - Start local production server"
	@echo ""
	@echo "Custom port examples:"
	@echo "  make prod-up PORT=3004  - Start on port 3004"
	@echo "  APP_PORT=3004 make prod-up  - Alternative syntax"
	@echo ""
	@echo "Utilities:"
	@echo "  logs          - Show application logs"
	@echo "  db-migrate    - Run database migrations + pgvector setup"
	@echo "  db-seed       - Seed database with pgvector setup"
	@echo "  db-reset      - Reset database + pgvector setup"
	@echo "  db-smart-reset - Smart reset: skip seed, setup pgvector, then seed"
	@echo "  db-full-reset - Full reset: containers + DB + pgvector + seed"
	@echo "  db-setup-pgvector - Setup pgvector extensions and indexes"
	@echo "  db-test-pgvector  - Test pgvector functionality"
	@echo "  db-init-embeddings - Initialize embeddings for profiles"
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
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env for production build..."; \
		cp env.example .env; \
		echo "⚠️  Make sure to set SCIBOX_API_KEY in .env"; \
	fi
	docker build -t scibox-talent:latest .

prod-up: check-docker
	@echo "Starting production environment..."
	@if [ -n "$(PORT)" ]; then \
		echo "🌐 Using port: $(PORT)"; \
		APP_PORT=$(PORT) $(DOCKER_COMPOSE) up -d; \
	else \
		echo "🌐 Using default port from env (3000)"; \
		$(DOCKER_COMPOSE) up -d; \
	fi

prod-down: check-docker
	@echo "Stopping production environment..."
	$(DOCKER_COMPOSE) down

# Local production build and start
build-local:
	@echo "Building application for local production..."
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env for build..."; \
		cp env.example .env; \
	fi
	@echo "🧹 Cleaning previous build..."
	sudo rm -rf .next 2>/dev/null || docker run --rm -v $(PWD):/app alpine sh -c "rm -rf /app/.next" || true
	@echo "🔨 Building production..."
	NODE_ENV=production npx next build --no-lint

start-local: build-local
	@echo "Starting local production server..."
	npm start

# Utility commands
logs: check-docker
	$(DOCKER_COMPOSE) logs -f app

logs-db: check-docker
	$(DOCKER_COMPOSE) logs -f postgres

db-migrate: check-docker
	@echo "Running database migrations..."
	$(DOCKER_COMPOSE) exec app npx prisma migrate deploy
	@echo "Setting up pgvector extensions..."
	make db-setup-pgvector

db-seed: check-docker
	@echo "Setting up pgvector before seeding..."
	make db-setup-pgvector
	@echo "Seeding database..."
	$(DOCKER_COMPOSE) exec app npx prisma db seed

db-reset: check-docker
	@echo "Resetting database..."
	@echo "⚠️  Use 'make db-smart-reset' for automatic pgvector setup"
	$(DOCKER_COMPOSE) exec app npx prisma migrate reset --force
	@echo "Setting up pgvector after reset..."
	make db-setup-pgvector

# Smart reset with pgvector auto-setup
db-smart-reset: check-docker
	@echo "🧠 Smart database reset with pgvector auto-setup..."
	@echo "🐳 Ensuring database is running..."
	make db-up
	@echo "⏳ Waiting for database..."
	sleep 5
	@echo "🔄 Resetting database without seed..."
	$(DOCKER_COMPOSE) exec postgres psql -U postgres -d scibox_talent_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "🔧 Running migrations..."
	npx prisma migrate deploy
	@echo "🔧 Setting up pgvector..."
	make db-setup-pgvector
	@echo "🌱 Running seed with pgvector ready..."
	npx prisma db seed
	@echo "✅ Smart reset completed!"

# pgvector specific commands
db-setup-pgvector: check-docker
	@echo "🔧 Setting up pgvector extensions and indexes..."
	$(DOCKER_COMPOSE) exec postgres psql -U postgres -d scibox_talent_db -c "CREATE EXTENSION IF NOT EXISTS vector; ALTER TABLE \"Profile\" ADD COLUMN IF NOT EXISTS embedding vector(1024); CREATE INDEX IF NOT EXISTS profile_embedding_cosine_idx ON \"Profile\" USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);"
	@echo "✅ pgvector setup completed!"

db-test-pgvector: check-docker
	@echo "🧪 Testing pgvector functionality..."
	$(DOCKER_COMPOSE) exec postgres psql -U postgres -d scibox_talent_db -c "SELECT COUNT(*) as total_profiles, COUNT(embedding) as profiles_with_embeddings FROM \"Profile\" p JOIN \"User\" u ON p.\"userId\" = u.id WHERE u.role = 'EMPLOYEE';"
	@echo "✅ pgvector test completed!"

db-init-embeddings: check-docker
	@echo "🚀 Initializing embeddings for existing profiles..."
	$(DOCKER_COMPOSE) exec app node -e "
	const { VectorizationService } = require('./dist/src/lib/vectorization.js');
	VectorizationService.rebuildAllEmbeddings().then(() => {
		console.log('✅ Embeddings initialization completed!');
		process.exit(0);
	}).catch(err => {
		console.error('❌ Error:', err);
		process.exit(1);
	});
	"

# Full reset with everything
db-full-reset: check-docker
	@echo "🧹 Full reset: stopping containers, cleaning volumes..."
	make clean
	@echo "🚀 Starting fresh setup..."
	make setup
	@echo "🌱 Seeding database with pgvector..."
	make db-seed
	@echo "✅ Full reset completed! Everything is ready."

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
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env for Prisma..."; \
		cp env.example .env; \
		echo "✅ .env created for Prisma CLI"; \
	else \
		echo "✅ .env already exists"; \
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
	@echo "🔧 Setting up pgvector..."
	make db-setup-pgvector
	@echo "✅ Setup complete! Run 'make dev-up' to start development."
