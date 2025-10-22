# Supabase Setup Guide for ContextKeeper

## Overview

This guide will help you set up your Supabase database for ContextKeeper. The application uses Supabase Auth for user authentication and PostgreSQL for data storage.

## Prerequisites

- A Supabase account and project
- Access to your Supabase project's SQL Editor

## Step 1: Disable Email Verification

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to the **Email Auth** section
4. **Toggle OFF** the "Enable email confirmations" option
5. Click **Save**

This allows users to sign up and log in immediately without email verification.

## Step 2: Run the Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** or press `Ctrl/Cmd + Enter`

This will create:
- ✅ `workspaces` table (with UUID user_id)
- ✅ `tabs` table
- ✅ `groups` table
- ✅ `group_workspaces` table
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp updates

## Step 3: Verify the Setup

Run this query in the SQL Editor to verify everything was created:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('workspaces', 'tabs', 'groups', 'group_workspaces');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workspaces', 'tabs', 'groups', 'group_workspaces');
```

You should see all 4 tables with `rowsecurity = true`.

## Step 4: Test User Creation

1. Go to your React app and try signing up with a test account
2. After signup, check the **Authentication** → **Users** section in Supabase
3. You should see your new user with a UUID

## Understanding the Schema

### User Authentication
- Users are managed by **Supabase Auth** (no separate users table)
- User IDs are **UUIDs** (e.g., `730d08bc-4f30-40cf-99e4-fa43f8deff7b`)
- Username is stored in Supabase user metadata

### Data Tables

**workspaces**
- Stores browser workspace snapshots
- `user_id` references `auth.users(id)` (UUID)
- Automatically deleted when user is deleted (CASCADE)

**tabs**
- Stores individual tabs within a workspace
- Links to `workspaces` via `workspace_id`

**groups**
- Organize workspaces into collections
- `user_id` references `auth.users(id)` (UUID)

**group_workspaces**
- Many-to-many relationship
- Links groups and workspaces

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only see their own data
- Users can only modify their own data
- Users cannot access other users' workspaces/tabs/groups

### Getting Current User ID in Queries

Use `auth.uid()` to get the logged-in user's UUID:

```sql
-- Example: Get all workspaces for current user
SELECT * FROM workspaces WHERE user_id = auth.uid();
```

## Troubleshooting

### "relation 'workspaces' already exists"
If you get this error, it means tables already exist. You can either:
- Drop existing tables first: `DROP TABLE IF EXISTS workspaces, tabs, groups, group_workspaces CASCADE;`
- Or modify the schema to use `CREATE TABLE IF NOT EXISTS` (already included)

### "permission denied for table workspaces"
Make sure RLS policies were created. Re-run the RLS section of the schema.

### "invalid input syntax for type integer"
This means your app is still trying to use INTEGER user_ids. Make sure:
1. You're using the updated `Dashboard.js` that uses `session.user.id` directly
2. You're using the updated `SignUp.js` that doesn't insert into a users table
3. The Supabase schema is using UUID for user_id

## Next Steps

After setting up the database:
1. ✅ Make sure your `.env.local` has the correct Supabase credentials
2. ✅ Test signup and login in your React app
3. ✅ Try creating a workspace from the Chrome extension
4. ✅ Verify it appears in the dashboard

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Verify RLS policies are working by testing queries in SQL Editor
