# Quick Setup - New Supabase Database

## 🚀 5-Minute Setup

### 1. Create Supabase Project
- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- Click "New Project"
- Set name and password → Create

### 2. Run SQL Schema
- Open **SQL Editor** in Supabase
- Copy & paste entire [`SETUP_NEW_SUPABASE.sql`](SETUP_NEW_SUPABASE.sql) file
- Click **Run**
- ✅ Done! Tables, indexes, and RLS policies created

### 3. Get Credentials
Go to **Settings → API**, copy:
- Project URL
- anon public key
- service_role key

Go to **Settings → Database**, copy:
- Database password

### 4. Update .env File
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_DB_PASSWORD=your-password
PORT=8080
```

### 5. Disable Email Verification (Optional)
- **Authentication → Providers → Email**
- Toggle OFF "Confirm email"
- Save

### 6. Create Test User
- **Authentication → Users → Add user**
- Email: test@example.com
- Password: testpass123
- Create

### 7. Test Backend
```bash
cd backend
go run *.go
```

Expected: `✅ Connected via pooler successfully!`

### 8. Test Dashboard
```bash
cd frontend/dashboard/context-keeper
npm start
```

Login with test user → Should work!

### 9. Test Extension
1. Login to dashboard (saves token)
2. Open tabs in Chrome
3. Click "Capture" in extension
4. Refresh dashboard → New workspace appears! ✅

---

## That's It! 🎉

**Files created**:
- ✅ `workspaces` table
- ✅ `tabs` table
- ✅ RLS policies
- ✅ Indexes

**Ready to use**:
- ✅ Backend connects
- ✅ Dashboard works
- ✅ Extension syncs

For detailed guide: [NEW_SUPABASE_SETUP_GUIDE.md](NEW_SUPABASE_SETUP_GUIDE.md)
