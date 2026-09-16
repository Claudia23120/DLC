# Colla de Diables de Les Corts — project commands.
# Everything runs through Docker so nothing needs to be installed locally
# except Docker itself.

# Prefer `docker compose` (v2); fall back to `docker-compose` (v1).
COMPOSE_BASE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# Use .env.local for BOTH build-arg interpolation (${NEXT_PUBLIC_*} in the
# compose file) and the container runtime, when it exists. Next.js uses
# .env.local by convention; Docker Compose would otherwise only read `.env`.
ENV_FILE := $(wildcard .env.local)
COMPOSE := $(COMPOSE_BASE) $(if $(ENV_FILE),--env-file $(ENV_FILE),)

.DEFAULT_GOAL := help

.PHONY: help build start stop restart logs shell clean dev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

build: ## Build the Docker images
	$(COMPOSE) build

start: ## Start the project (docker compose up, detached)
	$(COMPOSE) up -d
	@echo "App running at http://localhost:3005"

stop: ## Stop the project (docker compose down)
	$(COMPOSE) down

restart: stop start ## Restart the project

logs: ## Follow the app logs
	$(COMPOSE) logs -f web

shell: ## Open a shell inside the running app container
	$(COMPOSE) exec web sh

dev: ## Stop prod and run dev server with live reload (port 3005)
	$(COMPOSE) down
	docker run --rm \
		--volume $(CURDIR):/app \
		--volume colla-diables-node-modules:/app/node_modules \
		-w /app \
		--env-file .env.local \
		-p 3005:3000 \
		node:20-alpine \
		sh -c "npm install && npm run dev"

clean: ## Stop and remove containers, images and volumes for this project
	$(COMPOSE) down --rmi local --volumes --remove-orphans
