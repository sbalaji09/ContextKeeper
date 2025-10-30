# DO THIS EXACTLY - NO BUILDING, JUST COPY/PASTE

## Step 1: Get Connection String

1. Go to: https://supabase.com/dashboard/project/ifflibgciubavpkderfq/settings/database

2. Scroll to **"Connection string"** section

3. Click the **"URI"** tab (NOT Session pooler, just URI)

4. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.ifflibgciubavpkderfq.supabase.co:5432/postgres
   ```

5. Click the **eye icon** to reveal password

6. Click **COPY** button to copy entire string

## Step 2: Add to .env

Open your `.env` file and add this line with what you just copied:

```env
DATABASE_URL=<paste the entire string here>
```

For example:
```env
DATABASE_URL=postgresql://postgres:MyPassword123@db.ifflibgciubavpkderfq.supabase.co:5432/postgres
```

Also keep:
```env
SUPABASE_URL=https://ifflibgciubavpkderfq.supabase.co
SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
SUPABASE_DB_PASSWORD=<your password>
PORT=8080
```

## Step 3: Test

```bash
cd backend
go run test_connection.go
```

Should say: ✅ SUCCESS with DATABASE_URL!

## Step 4: Run Backend

```bash
go run *.go
```

Done!
