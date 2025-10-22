# ContextKeeper Backend API (Go)

RESTful API server for ContextKeeper browser extension, built with Go, Gorilla Mux, and Supabase.

## Features

- ✅ RESTful API endpoints for workspaces and groups
- ✅ JWT authentication via Supabase Auth
- ✅ Environment-based configuration (no hardcoded values)
- ✅ CORS support for browser extension
- ✅ Request logging middleware
- ✅ Comprehensive error handling
- ✅ Fast and efficient (written in Go)

## Prerequisites

- Go 1.21 or higher
- Supabase project with the schema set up

## Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Download dependencies:**
   ```bash
   go mod download
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**

   Edit `.env` and add your Supabase credentials:
   ```env
   PORT=3001
   ENVIRONMENT=development

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://your-extension-id
   ```

   **Finding your Supabase keys:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Copy the `URL`, `anon/public` key, and `service_role` key

## Running the Server

**Development mode:**
```bash
go run main.go
```

**Build and run:**
```bash
go build -o contextkeeper-backend
./contextkeeper-backend
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "ContextKeeper API"
}
```

---

### Workspaces

All workspace endpoints require authentication via `Authorization: Bearer <token>` header.

#### Create Workspace

```http
POST /api/workspaces
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "My Work Session",
  "description": "Frontend development workspace",
  "tabs": [
    {
      "url": "https://github.com",
      "title": "GitHub",
      "favicon_url": "https://github.com/favicon.ico",
      "position": 0
    },
    {
      "url": "https://stackoverflow.com",
      "title": "Stack Overflow",
      "position": 1
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid",
    "name": "My Work Session",
    "description": "Frontend development workspace",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "tabs": [...]
  }
}
```

#### Get All Workspaces

```http
GET /api/workspaces
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "My Work Session",
      "tabs": [...],
      ...
    }
  ]
}
```

#### Get Workspace by ID

```http
GET /api/workspaces/:id
Authorization: Bearer <token>
```

#### Update Workspace

```http
PUT /api/workspaces/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "last_accessed_at": "2024-01-15T10:30:00Z"
}
```

#### Delete Workspace

```http
DELETE /api/workspaces/:id
Authorization: Bearer <token>
```

---

### Groups

#### Create Group

```http
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Work Projects",
  "color": "#3b82f6"
}
```

#### Get All Groups

```http
GET /api/groups
Authorization: Bearer <token>
```

#### Delete Group

```http
DELETE /api/groups/:id
Authorization: Bearer <token>
```

---

## Authentication

The API uses Supabase JWT tokens for authentication.

**Getting a token:**
1. User logs in via the frontend using Supabase Auth
2. Frontend receives a JWT token from Supabase
3. Include this token in the `Authorization` header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Example with JavaScript:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

const response = await fetch('http://localhost:3001/api/workspaces', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Example with curl:**
```bash
curl -X GET http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Project Structure

```
backend/
├── config/
│   └── config.go            # Configuration loader
├── database/
│   └── supabase.go          # Supabase client
├── middleware/
│   ├── auth.go              # JWT authentication
│   └── logging.go           # Request logging
├── models/
│   └── models.go            # Data models
├── handlers/
│   ├── workspaces.go        # Workspace endpoints
│   └── groups.go            # Group endpoints
├── .env.example             # Environment template
├── .gitignore               # Git exclusions
├── go.mod                   # Go modules
├── main.go                  # Main server
└── README.md                # This file
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Common HTTP status codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Building for Production

**Build binary:**
```bash
go build -o contextkeeper-backend -ldflags="-s -w" main.go
```

**Cross-compile for Linux:**
```bash
GOOS=linux GOARCH=amd64 go build -o contextkeeper-backend-linux main.go
```

**Cross-compile for Windows:**
```bash
GOOS=windows GOARCH=amd64 go build -o contextkeeper-backend.exe main.go
```

---

## Deployment

**Environment variables for production:**
- Set `ENVIRONMENT=production`
- Use a production Supabase project
- Configure proper CORS origins
- Use a reverse proxy (nginx) with HTTPS
- Consider rate limiting and additional security measures

**Popular hosting options:**
- Railway.app
- Render.com
- Fly.io
- DigitalOcean App Platform
- AWS EC2
- Google Cloud Run

---

## Development

**Run with hot reload (using air):**
```bash
# Install air
go install github.com/cosmtrek/air@latest

# Run with air
air
```

**Run tests:**
```bash
go test ./...
```

**Format code:**
```bash
go fmt ./...
```

---

## Performance

Go provides excellent performance characteristics:
- Fast startup time
- Low memory footprint
- Efficient concurrent request handling
- Native compilation to machine code

Typical response times:
- Health check: < 1ms
- Authenticated endpoint: < 10ms (including JWT verification)
- Database operations: 20-100ms (depends on Supabase)

---

## Security Notes

1. **Never commit `.env` to git** - It contains sensitive credentials
2. **Use HTTPS in production** - JWT tokens should be transmitted over secure connections
3. **Service Role Key** - Only use on the backend, never expose to frontend/extension
4. **Row Level Security** - Supabase RLS policies ensure users only access their own data
5. **JWT Verification** - All protected endpoints verify tokens with Supabase

---

## Troubleshooting

### "SUPABASE_URL environment variable is required"
- Make sure you created the `.env` file
- Double-check your Supabase URL and keys

### "Not allowed by CORS"
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Chrome extensions are automatically allowed

### "Invalid or expired token"
- Make sure you're logged in on the frontend
- Token expires after 1 hour, get a fresh one
- Verify the token is being sent in the `Authorization: Bearer <token>` header

### Port already in use
- Change the `PORT` in `.env` file
- Or kill the process using the port: `lsof -ti:3001 | xargs kill`

---

## Support

For issues or questions, check:
- Supabase documentation: https://supabase.com/docs
- Gorilla Mux documentation: https://github.com/gorilla/mux
- Go documentation: https://go.dev/doc/
