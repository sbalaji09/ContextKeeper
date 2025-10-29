# ===================================================================
# ContextKeeper - Multi-Stage Dockerfile
# Builds both the React frontend and Go backend in a single container
# ===================================================================

# ===================================================================
# Stage 1: Build Go Backend
# ===================================================================
FROM golang:1.23-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend files
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/*.go ./

# Build backend binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o contextkeeper-backend *.go

# ===================================================================
# Stage 2: Build React Frontend
# ===================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/dashboard/context-keeper/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/dashboard/context-keeper/ ./

# Build frontend
RUN npm run build

# ===================================================================
# Stage 3: Runtime - Backend + Frontend
# ===================================================================
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /home/appuser

# Copy backend binary
COPY --from=backend-builder /app/backend/contextkeeper-backend ./

# Copy frontend build (if serving from Go backend in future)
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Change ownership
RUN chown -R appuser:appuser /home/appuser

# Switch to non-root user
USER appuser

# Expose ports
# 3001 for backend API
# 3000 for frontend (if served separately)
EXPOSE 3001
EXPOSE 3000

# Default command runs the backend
CMD ["./contextkeeper-backend"]
