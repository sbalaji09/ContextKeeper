# Makefile for ContextKeeper Backend

.PHONY: help run build clean test fmt deps install dev

# Default target
help:
	@echo "ContextKeeper Backend - Make Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make run        - Run the server in development mode"
	@echo "  make build      - Build production binary"
	@echo "  make clean      - Remove built binaries"
	@echo "  make test       - Run tests"
	@echo "  make fmt        - Format code"
	@echo "  make deps       - Download dependencies"
	@echo "  make install    - Install to /usr/local/bin"
	@echo "  make dev        - Run with hot reload (requires air)"
	@echo ""

# Run development server
run:
	@echo "Starting development server..."
	go run main.go

# Build production binary
build:
	@echo "Building production binary..."
	go build -o contextkeeper-backend -ldflags="-s -w" main.go
	@echo "Binary created: ./contextkeeper-backend"

# Build for multiple platforms
build-all:
	@echo "Building for multiple platforms..."
	GOOS=linux GOARCH=amd64 go build -o dist/contextkeeper-backend-linux-amd64 -ldflags="-s -w" main.go
	GOOS=darwin GOARCH=amd64 go build -o dist/contextkeeper-backend-darwin-amd64 -ldflags="-s -w" main.go
	GOOS=darwin GOARCH=arm64 go build -o dist/contextkeeper-backend-darwin-arm64 -ldflags="-s -w" main.go
	GOOS=windows GOARCH=amd64 go build -o dist/contextkeeper-backend-windows-amd64.exe -ldflags="-s -w" main.go
	@echo "Binaries created in dist/"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f contextkeeper-backend
	rm -rf dist/
	rm -rf tmp/

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# Install binary to system
install: build
	@echo "Installing to /usr/local/bin..."
	sudo cp contextkeeper-backend /usr/local/bin/
	@echo "Installed! Run with: contextkeeper-backend"

# Development with hot reload (requires air)
dev:
	@command -v air >/dev/null 2>&1 || { echo "air not found. Installing..."; go install github.com/cosmtrek/air@latest; }
	@echo "Starting development server with hot reload..."
	air

# Docker build (optional)
docker-build:
	@echo "Building Docker image..."
	docker build -t contextkeeper-backend .

# Docker run (optional)
docker-run:
	@echo "Running Docker container..."
	docker run --env-file .env -p 3001:3001 contextkeeper-backend
