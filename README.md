# ContextKeeper

A powerful browser extension and web app for managing and restoring your browser workspace sessions.

## Features

- 📸 **Snapshot Capture** - Save all open tabs with scroll positions and form data
- 🔄 **Quick Restore** - Restore your entire workspace with one click
- 📊 **Dashboard** - Manage all your saved workspaces in a beautiful web interface
- 🔐 **Secure** - Authentication via Supabase, data stored securely
- ⚡ **Fast** - Go backend for optimal performance
- 🌐 **Cross-Platform** - Works on Chrome, Edge, and other Chromium browsers

## Project Structure

```
ContextKeeper/
├── backend/                    # Go API server
│   ├── *.go                   # All Go source files (flattened structure)
│   ├── go.mod                 # Go dependencies
│   └── .env.example           # Configuration template
├── frontend/
│   ├── chrome_extension/      # Browser extension
│   │   ├── manifest.json
│   │   ├── service_worker.js
│   │   ├── popup.html/js
│   │   └── capture.js/restore.js
│   └── dashboard/             # React dashboard
│       └── context-keeper/
│           ├── src/
│           └── package.json
├── database/
│   ├── supabase_schema.sql    # PostgreSQL schema for Supabase
│   └── init.sql               # SQLite schema (local dev)
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml          # Full stack deployment
└── README.md                   # This file
```

## Quick Start

### Backend

```bash
cd backend

# Install dependencies
go mod download

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run server
go run *.go

# Or build and run
go build -o contextkeeper-backend *.go
./contextkeeper-backend
```

Server runs on `http://localhost:3001`

### Frontend Dashboard

```bash
cd frontend/dashboard/context-keeper

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm start
```

Dashboard runs on `http://localhost:3000`

### Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `frontend/chrome_extension` directory

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase and database credentials
nano .env

# Required environment variables:
# - DATABASE_URL or POSTGRES_CONNECTION (PostgreSQL connection string)
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET (for token signing)
# - PORT (default: 8080)

# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Docker Image Only

```bash
# Build the image
docker build -t contextkeeper .

# Run with environment variables
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:password@host:port/database" \
  -e SUPABASE_URL="your-supabase-url" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  contextkeeper
```

The Docker container includes both the Go backend and React frontend build.

## Configuration

### Backend Environment Variables

```env
PORT=3001
ENVIRONMENT=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://your-extension-id
```

### Frontend Environment Variables

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

1. Create a Supabase project
2. Run the schema from `database/supabase_schema.sql` in Supabase SQL Editor
3. Configure email authentication (disable email verification for easier testing)

See `database/SUPABASE_SETUP.md` for detailed instructions.

## API Endpoints

All API endpoints require authentication via `Authorization: Bearer <token>` header.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (no auth) |
| `/api/workspaces` | POST | Create workspace |
| `/api/workspaces` | GET | Get all workspaces |
| `/api/workspaces/:id` | GET | Get workspace by ID |
| `/api/workspaces/:id` | PUT | Update workspace |
| `/api/workspaces/:id` | DELETE | Delete workspace |
| `/api/groups` | POST | Create group |
| `/api/groups` | GET | Get all groups |
| `/api/groups/:id` | DELETE | Delete group |

## Development

### Backend

```bash
cd backend
go run *.go
```

### Frontend Dashboard

```bash
cd frontend/dashboard/context-keeper
npm start
```

### Chrome Extension

Make changes, then click "Reload" button in `chrome://extensions/`

## Building for Production

### Backend

```bash
cd backend
go build -o contextkeeper-backend -ldflags="-s -w" *.go
```

### Frontend

```bash
cd frontend/dashboard/context-keeper
npm run build
```

### Docker

```bash
docker build -t contextkeeper:latest .
```

## Features in Detail

### Browser Extension

- **Capture**: Saves all tabs in current window
- **Restore**: Reopens all tabs from a snapshot
- **Preserve Dashboard**: Dashboard tabs won't close during capture
- **Form State**: Saves and restores form inputs
- **Scroll Position**: Remembers where you were on each page

### Web Dashboard

- **View Workspaces**: See all your saved sessions
- **Search & Filter**: Find workspaces quickly
- **Groups**: Organize workspaces into collections
- **Delete**: Remove old workspaces

### Backend API

- **Fast**: Written in Go for optimal performance
- **Secure**: JWT authentication via Supabase
- **Scalable**: RESTful design, easy to deploy
- **CORS**: Configured for browser extension usage

## Technology Stack

- **Backend**: Go 1.21+, Gorilla Mux, Supabase Go Client
- **Frontend**: React 18, Supabase JS Client
- **Database**: PostgreSQL (via Supabase)
- **Extension**: Vanilla JavaScript, Chrome Extensions Manifest V3
- **Deployment**: Docker, Docker Compose

## License

MIT

## Support

For issues or questions:
- Check the documentation in each folder
- Open an issue on GitHub
- See Supabase docs: https://supabase.com/docs
