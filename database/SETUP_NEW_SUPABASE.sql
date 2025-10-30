-- ===================================================================
-- ContextKeeper - Complete Supabase Database Setup
-- ===================================================================
-- Run this script in your NEW Supabase project's SQL Editor
-- ===================================================================

-- ===================================================================
-- 1. Create Tables
-- ===================================================================

-- Workspaces table: stores captured browser workspace sessions
CREATE TABLE IF NOT EXISTS public.workspaces (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabs table: stores individual tabs within each workspace
CREATE TABLE IF NOT EXISTS public.tabs (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    favicon_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 2. Create Indexes for Performance
-- ===================================================================

-- Index on user_id for fast workspace lookup by user
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id
ON public.workspaces(user_id);

-- Index on created_at for sorting workspaces by date
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at
ON public.workspaces(created_at DESC);

-- Index on workspace_id for fast tab lookup
CREATE INDEX IF NOT EXISTS idx_tabs_workspace_id
ON public.tabs(workspace_id);

-- Index on position for ordering tabs within workspace
CREATE INDEX IF NOT EXISTS idx_tabs_position
ON public.tabs(workspace_id, position);

-- ===================================================================
-- 3. Enable Row Level Security (RLS)
-- ===================================================================

-- Enable RLS on both tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 4. Create RLS Policies for Workspaces
-- ===================================================================

-- Policy: Users can view only their own workspaces
CREATE POLICY "Users can view their own workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own workspaces
CREATE POLICY "Users can insert their own workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own workspaces
CREATE POLICY "Users can update their own workspaces"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own workspaces
CREATE POLICY "Users can delete their own workspaces"
ON public.workspaces
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===================================================================
-- 5. Create RLS Policies for Tabs
-- ===================================================================

-- Policy: Users can view tabs of their own workspaces
CREATE POLICY "Users can view tabs of their own workspaces"
ON public.tabs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE workspaces.id = tabs.workspace_id
        AND workspaces.user_id = auth.uid()
    )
);

-- Policy: Users can insert tabs into their own workspaces
CREATE POLICY "Users can insert tabs into their own workspaces"
ON public.tabs
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE workspaces.id = tabs.workspace_id
        AND workspaces.user_id = auth.uid()
    )
);

-- Policy: Users can update tabs in their own workspaces
CREATE POLICY "Users can update tabs in their own workspaces"
ON public.tabs
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE workspaces.id = tabs.workspace_id
        AND workspaces.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE workspaces.id = tabs.workspace_id
        AND workspaces.user_id = auth.uid()
    )
);

-- Policy: Users can delete tabs from their own workspaces
CREATE POLICY "Users can delete tabs from their own workspaces"
ON public.tabs
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE workspaces.id = tabs.workspace_id
        AND workspaces.user_id = auth.uid()
    )
);

-- ===================================================================
-- 6. Create Updated At Trigger Function
-- ===================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on workspaces
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ===================================================================
-- 7. Grant Permissions (if needed)
-- ===================================================================

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE public.workspaces_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.tabs_id_seq TO authenticated;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabs TO authenticated;

-- ===================================================================
-- 8. Service Role Policies (for backend API)
-- ===================================================================

-- Allow service role to bypass RLS for backend operations
-- This is already enabled by default in Supabase
-- But you can verify in the Supabase dashboard under Database → Policies

-- ===================================================================
-- 9. Create Sample Data (Optional - for testing)
-- ===================================================================

-- Uncomment below to insert test data
-- Note: Replace 'YOUR_USER_ID' with an actual user UUID from auth.users

/*
INSERT INTO public.workspaces (user_id, name, description) VALUES
('YOUR_USER_ID', 'Work Project', 'Development tabs for current sprint'),
('YOUR_USER_ID', 'Research', 'Articles and documentation');

-- Get the workspace IDs
-- INSERT INTO public.tabs (workspace_id, url, title, favicon_url, position) VALUES
-- (1, 'https://github.com', 'GitHub', 'https://github.com/favicon.ico', 0),
-- (1, 'https://stackoverflow.com', 'Stack Overflow', 'https://stackoverflow.com/favicon.ico', 1);
*/

-- ===================================================================
-- 10. Verify Setup
-- ===================================================================

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('workspaces', 'tabs');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workspaces', 'tabs');

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('workspaces', 'tabs')
ORDER BY tablename, policyname;

-- ===================================================================
-- SETUP COMPLETE!
-- ===================================================================
-- Next steps:
-- 1. Test by inserting a workspace via the SQL editor
-- 2. Update your .env file with new Supabase credentials
-- 3. Run the backend: cd backend && go run *.go
-- 4. Test the workspace sync feature
-- ===================================================================
