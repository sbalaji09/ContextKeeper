# Backend Quick Start Guide (Go)

Get your ContextKeeper Go backend up and running in 5 minutes!

## Step 1: Install Go

Make sure you have Go 1.21 or higher installed:

```bash
go version
```

If not installed, download from: https://go.dev/dl/

## Step 2: Download Dependencies

```bash
cd backend
go mod download
```

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PORT=3001
ENVIRONMENT=development

# Get these from Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Add your frontend/extension URLs
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://your-extension-id
```

## Step 4: Run the Server

```bash
go run main.go
```

You should see:
```
============================================================
🚀 ContextKeeper Backend Server (Go)
============================================================
📡 Server running on: http://localhost:3001
🌍 Environment: development
✅ Health check: http://localhost:3001/health
============================================================
Available endpoints:
  POST   /api/workspaces     - Create workspace
  GET    /api/workspaces     - Get all workspaces
  GET    /api/workspaces/:id - Get workspace by ID
  PUT    /api/workspaces/:id - Update workspace
  DELETE /api/workspaces/:id - Delete workspace
  POST   /api/groups         - Create group
  GET    /api/groups         - Get all groups
  DELETE /api/groups/:id     - Delete group
============================================================
```

## Step 5: Test It

Open your browser or use curl:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "ContextKeeper API"
}
```

## Step 6: Test Creating a Workspace

First, get your auth token from the frontend:

```javascript
// In browser console on your React app
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);
```

Then test the API:

```bash
curl -X POST http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workspace",
    "description": "My first API workspace",
    "tabs": [
      {
        "url": "https://github.com",
        "title": "GitHub",
        "position": 0
      }
    ]
  }'
```

## Building for Production

**Create optimized binary:**
```bash
go build -o contextkeeper-backend -ldflags="-s -w" main.go
```

**Run the binary:**
```bash
./contextkeeper-backend
```

## Common Issues

### "SUPABASE_URL environment variable is required"
- Make sure you created the `.env` file
- Double-check your Supabase URL and keys

### "Not allowed by CORS"
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- For Chrome extension, it auto-allows `chrome-extension://` origins

### "Invalid or expired token"
- Make sure you're logged in on the frontend
- Token expires after 1 hour, get a fresh one

### Port already in use
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:3001 | xargs kill`

## Hot Reload for Development

Install `air` for automatic reloading:

```bash
go install github.com/cosmtrek/air@latest

# Create .air.toml config
cat > .air.toml << 'EOF'
root = "."
tmp_dir = "tmp"

[build]
cmd = "go build -o ./tmp/main ."
bin = "tmp/main"
include_ext = ["go"]
exclude_dir = ["tmp", "vendor"]
delay = 1000
stop_on_error = true

[log]
time = true
EOF

# Run with hot reload
air
```

## Next Steps

- See [README.md](README.md) for full API documentation
- Set up Supabase schema: [../database/SUPABASE_SETUP.md](../database/SUPABASE_SETUP.md)
- Integrate with your Chrome extension

## Why Go?

- 🚀 **Fast**: Native compilation, no runtime overhead
- 📦 **Single Binary**: Easy deployment, no dependencies
- 🔧 **Concurrent**: Built-in goroutines for handling multiple requests
- 💪 **Type-Safe**: Compile-time type checking
- 🌍 **Cross-Platform**: Build for Windows, Linux, macOS from anywhere

## Performance Comparison

| Backend | Startup Time | Memory Usage | Request/sec |
|---------|-------------|--------------|-------------|
| Go      | ~10ms       | ~15MB        | ~50,000     |
| Node.js | ~100ms      | ~50MB        | ~10,000     |

Go is typically 5-10x faster and uses 3-4x less memory!
