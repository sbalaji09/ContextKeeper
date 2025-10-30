# Get Exact Connection String from Supabase

## Step 1: Get Connection String from Supabase

1. Go to: https://supabase.com/dashboard/project/ifflibgciubavpkderfq/settings/database

2. Scroll down to **"Connection string"** section

3. You'll see tabs:
   - URI
   - **Session pooler** ← Click this one
   - Transaction pooler
   - Direct connection

4. Click **"Session pooler"**

5. You'll see a connection string like:
   ```
   postgresql://postgres.ifflibgciubavpkderfq:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

6. **Copy the ENTIRE string** (it will have your password in it)

## Step 2: Add to .env

In your `.env` file, add this line with the EXACT string you copied:

```env
DATABASE_URL=postgresql://postgres.ifflibgciubavpkderfq:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Keep these too
SUPABASE_URL=https://ifflibgciubavpkderfq.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8080
```

## Step 3: Run Backend

```bash
cd backend
go run *.go
```

It should now connect using DATABASE_URL!

---

## If That STILL Doesn't Work

Run this command and send me the output:

```bash
cd backend
cat .env | grep -E "(SUPABASE_URL|DATABASE_URL)" | sed 's/:.*@/:***PASSWORD***@/g'
```

This will show me your connection format without exposing the password.
