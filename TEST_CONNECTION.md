# Quick Connection Test

## Your Current Setup

Project ID: `ifflibgciubavpkderfq`

## Errors You're Getting

1. **Pooler**: "Tenant or user not found"
2. **Direct**: IPv6 routing issue

## Most Likely Issue: Wrong Database Password

The "Tenant or user not found" error usually means your database password in `.env` is incorrect.

### How to Fix

#### Step 1: Get Correct Database Password

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ifflibgciubavpkderfq
2. Click **Settings → Database** (left sidebar)
3. Scroll to "Connection string" section
4. Click **"Reset database password"**
5. Copy the NEW password shown
6. Save it somewhere secure

#### Step 2: Update .env File

Your `.env` should look like this:

```env
SUPABASE_URL=https://ifflibgciubavpkderfq.supabase.co
SUPABASE_DB_PASSWORD=the-password-you-just-reset
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8080
ENVIRONMENT=development
```

**IMPORTANT**: Use the password you JUST reset, not an old one!

#### Step 3: Test Connection

```bash
cd backend
go run *.go
```

Expected result:
```
✅ Connected via session pooler successfully!
```

---

## Alternative: Use Connection String from Supabase

Supabase provides a ready-made connection string. Let's use that:

### Step 1: Get Connection String

1. Go to **Settings → Database**
2. Scroll to **"Connection string"** section
3. Select **"Transaction pooler"** tab
4. Mode: **"Transaction"**
5. You'll see something like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Step 2: Use It Directly

Instead of building the connection string, let's use Supabase's exact format.

Update your `.env`:

```env
# Add this line with the EXACT connection string from Supabase
DATABASE_URL=postgresql://postgres.ifflibgciubavpkderfq:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Keep these too
SUPABASE_URL=https://ifflibgciubavpkderfq.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8080
```

Then I'll update the backend to use `DATABASE_URL` if it exists.

---

## Quick Fix: Let Me Update the Code

I can update `main.go` to:
1. Try `DATABASE_URL` environment variable first (if you set it)
2. Fall back to building the connection string
3. Try multiple pooler ports and formats

Would you like me to:
- **A**: Update code to try DATABASE_URL first
- **B**: Add more connection attempts with different formats
- **C**: Switch to using Supabase REST API (no connection issues ever)

Option C is the most reliable long-term solution.

---

## Debug: Check Your Password Format

Run this to see if your password has special characters:

```bash
cd backend
echo $SUPABASE_DB_PASSWORD
```

If your password has special characters like `@`, `#`, `&`, etc., you need to URL-encode them:

| Character | Encoded |
|-----------|---------|
| @ | %40 |
| # | %23 |
| & | %26 |
| = | %3D |
| : | %3A |
| / | %2F |

Example:
- Password: `Pass@123#`
- Encoded: `Pass%40123%23`

---

## Recommended: Reset Password and Try Again

The simplest solution:

1. **Reset password** in Supabase dashboard
2. Choose a **simple password** (no special characters): like `MySecurePass123`
3. Update `.env` with new password
4. Run `go run *.go`
5. Should work!

Once it's working, you can change to a more complex password and URL-encode it.

---

Let me know which approach you want to try!
