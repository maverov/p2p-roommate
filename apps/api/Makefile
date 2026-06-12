# Include environment variables from .env file if it exists
ifneq ("$(wildcard .env)","")
    include .env
    export $(shell sed 's/=.*//' .env)
endif

.PHONY: help up down restart build logs test clean migrate-status

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start local PostgreSQL and Redis containers in the background
	docker compose up -d postgres redis

down: ## Stop all local containers and preserve data volumes
	docker compose down

destroy: ## Stop all containers and wipe local database/cache volumes (fresh start)
	docker compose down -v

restart: down up ## Restart local infrastructure services

build-backend: ## Compile and build the backend application fat-jar locally
	./mvnw clean package -DskipTests

docker-build: ## Build the multi-stage backend Docker image
	docker compose build backend

run-all: ## Build and run everything (Infra + App) inside Docker
	docker compose up --build

logs: ## Tail backend container logs
	docker compose logs -f backend

test: ## Run the full unit and integration test suite (requires Docker running for Testcontainers)
	./mvnw test

clean: ## Clean Maven target build directories
	./mvnw clean