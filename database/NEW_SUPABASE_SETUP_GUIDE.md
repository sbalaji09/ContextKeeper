# Setting Up New Supabase Database for ContextKeeper

## Step-by-Step Guide

### Step 1: Create New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `ContextKeeper` (or any name you want)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

---

### Step 2: Run Database Schema

1. In your new Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"+ New query"**
3. Copy the entire contents of [`SETUP_NEW_SUPABASE.sql`](SETUP_NEW_SUPABASE.sql)
4. Paste into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. ✅ You should see: "Success. No rows returned"

**What this creates**:
- ✅ `workspaces` table
- ✅ `tabs` table
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic `updated_at` trigger
- ✅ Proper permissions

---

### Step 3: Verify Tables Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('workspaces', 'tabs');
```

**Expected result**:
```
workspaces
tabs
```

---

### Step 4: Get Your Credentials

#### 4.1 Get API URL and Keys

1. Go to **Settings → API** (left sidebar)
2. Copy these values:

   **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role secret key** (click "Reveal" button):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### 4.2 Get Database Password

This is the password you set in Step 1 when creating the project.

If you forgot it:
1. Go to **Settings → Database**
2. Scroll to "Database password"
3. Click **"Reset database password"**
4. Copy the new password

---

### Step 5: Update Your .env File

Create/update `.env` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your-database-password-here

# Server Configuration
PORT=8080
ENVIRONMENT=development
```

**Important**:
- Replace `xxxxxxxxxxxxx` with your actual project reference
- Use the full keys (they're very long!)
- Use the database password you created/reset

---

### Step 6: Configure Authentication

#### 6.1 Disable Email Confirmation (for easier testing)

1. Go to **Authentication → Providers** (left sidebar)
2. Click on **"Email"** provider
3. Scroll down to **"Confirm email"**
4. Toggle it **OFF** (disable)
5. Click **"Save"**

This allows you to test without checking email verification.

#### 6.2 Create Test User

1. Go to **Authentication → Users**
2. Click **"Add user"** → "Create new user"
3. Fill in:
   - **Email**: your-test@email.com
   - **Password**: testpassword123
   - **Email Confirm**: ON (since we disabled confirmation)
4. Click **"Create user"**
5. Copy the user's UUID (you'll need this for testing)

---

### Step 7: Test Database Connection

#### 7.1 Test via SQL Editor

Run this in SQL Editor (replace USER_ID with your test user's UUID):

```sql
-- Insert test workspace
INSERT INTO public.workspaces (user_id, name, description)
VALUES ('YOUR_USER_UUID_HERE', 'Test Workspace', 'Testing database');

-- Get the workspace ID from the result, then:
INSERT INTO public.tabs (workspace_id, url, title, position)
VALUES (1, 'https://github.com', 'GitHub', 0);

-- Verify data
SELECT w.*, t.*
FROM workspaces w
LEFT JOIN tabs t ON t.workspace_id = w.id
WHERE w.user_id = 'YOUR_USER_UUID_HERE';
```

✅ If this works, your database is set up correctly!

#### 7.2 Test Backend Connection

```bash
cd backend
go run *.go
```

**Expected output**:
```
2025/10/30 02:15:00 Connecting to Supabase project: xxxxxxxxxxxxx
2025/10/30 02:15:00 Attempting connection via pooler...
2025/10/30 02:15:01 ✅ Connected via pooler successfully!
2025/10/30 02:15:01 ✅ Database connection established!
Connected to the database successfully!
[GIN-debug] Listening and serving HTTP on 0.0.0.0:8080
```

---

### Step 8: Test API Endpoint

With backend running, test the API:

```bash
# Test health check
curl http://localhost:8080/ping
# Should return: {"message":"pong"}

# Test database check
curl http://localhost:8080/dbcheck
# Should return: {"time":"2025-10-30T02:15:00Z"}
```

---

### Step 9: Test with Dashboard

1. **Start dashboard**:
   ```bash
   cd frontend/dashboard/context-keeper
   npm start
   ```

2. **Login** at `http://localhost:3000/login`:
   - Use the test user email/password from Step 6.2

3. **Verify**:
   - Dashboard should load
   - Console should show: "✅ Token saved to chrome.storage for extension"
   - You should see any workspaces you created in Step 7.1

---

### Step 10: Test Full Workflow

1. **Login to dashboard** (to save JWT token)
2. **Load Chrome extension**
3. **Open some tabs** (e.g., GitHub, Google, etc.)
4. **Click "Capture"** in extension
5. **Check console**: Should see "✅ Synced to backend successfully"
6. **Refresh dashboard**: New workspace should appear!

---

## Troubleshooting

### "Connection failed: Tenant or user not found"

**Problem**: Wrong database password or project reference

**Solution**:
1. Verify `SUPABASE_URL` has correct project reference
2. Reset database password in Supabase dashboard
3. Update `.env` file
4. Restart backend

---

### "RLS policy violation"

**Problem**: Row Level Security blocking access

**Solution**:
1. Verify you're logged in as the correct user
2. Check policies in SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'workspaces';
   ```
3. If policies are missing, re-run `SETUP_NEW_SUPABASE.sql`

---

### "Error: relation 'workspaces' does not exist"

**Problem**: Schema not created

**Solution**:
1. Go to SQL Editor
2. Run `SETUP_NEW_SUPABASE.sql` again
3. Verify tables exist:
   ```sql
   \dt public.*
   ```

---

### Backend connects but dashboard shows no workspaces

**Problem**: User ID mismatch or RLS blocking

**Solution**:
1. Check which user you're logged in as:
   - Dashboard console: Look for user ID in logs
2. Verify workspaces exist for that user:
   ```sql
   SELECT * FROM workspaces WHERE user_id = 'USER_ID_HERE';
   ```
3. Check RLS policies allow SELECT

---

## Database Schema Reference

### Workspaces Table

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Primary key |
| user_id | uuid | Foreign key to auth.users |
| name | text | Workspace name |
| description | text | Optional description |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update (auto-updated) |

### Tabs Table

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Primary key |
| workspace_id | bigint | Foreign key to workspaces |
| url | text | Tab URL |
| title | text | Page title |
| favicon_url | text | Favicon URL |
| position | integer | Tab order in workspace |
| created_at | timestamptz | Creation timestamp |

---

## Security Notes

### Row Level Security (RLS)

RLS ensures users can only access their own data:

- ✅ **Workspaces**: User can only CRUD their own workspaces
- ✅ **Tabs**: User can only CRUD tabs in their own workspaces
- ✅ **Service Role**: Backend can access all data (for API operations)

### Authentication

- Uses Supabase Auth with JWT tokens
- Tokens are stored in `chrome.storage.local` for extension
- Backend validates JWT and extracts `user_id` from `sub` claim

---

## Next Steps After Setup

1. ✅ Database is ready
2. ✅ Backend can connect
3. ✅ Dashboard can login and fetch data
4. ✅ Extension can sync workspaces

**You're ready to use ContextKeeper!**

For testing the full workflow, see [TESTING_WORKSPACE_SYNC.md](../TESTING_WORKSPACE_SYNC.md)

---

## Helpful SQL Queries

### View all workspaces for a user
```sql
SELECT w.*, COUNT(t.id) as tab_count
FROM workspaces w
LEFT JOIN tabs t ON t.workspace_id = w.id
WHERE w.user_id = 'USER_UUID'
GROUP BY w.id
ORDER BY w.created_at DESC;
```

### View workspace with all tabs
```sql
SELECT
    w.name as workspace_name,
    t.title as tab_title,
    t.url,
    t.position
FROM workspaces w
JOIN tabs t ON t.workspace_id = w.id
WHERE w.id = 1
ORDER BY t.position;
```

### Delete old workspaces
```sql
DELETE FROM workspaces
WHERE created_at < NOW() - INTERVAL '30 days'
AND user_id = 'USER_UUID';
```

### Get user's total tab count
```sql
SELECT
    u.email,
    COUNT(DISTINCT w.id) as workspace_count,
    COUNT(t.id) as total_tabs
FROM auth.users u
LEFT JOIN workspaces w ON w.user_id = u.id
LEFT JOIN tabs t ON t.workspace_id = w.id
WHERE u.id = 'USER_UUID'
GROUP BY u.id, u.email;
```

---

## Support

If you run into issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Verify your `.env` file has correct values
3. Check Supabase logs: Settings → Logs → API
4. Test queries in SQL Editor to isolate the issue

The database is now properly configured for ContextKeeper! 🎉
