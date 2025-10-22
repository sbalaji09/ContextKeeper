-- ============================================================
-- CONTEXTKEEPER - SUPABASE SCHEMA
-- ============================================================
-- This schema is designed for PostgreSQL/Supabase
-- It uses UUIDs for user_id to integrate with Supabase Auth
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- WORKSPACES TABLE
-- Stores saved browser sessions/workspaces
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

-- ============================================================
-- TABS TABLE
-- Stores individual browser tabs within a workspace
-- ============================================================
CREATE TABLE IF NOT EXISTS tabs (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    favicon_url TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GROUPS TABLE
-- Organize multiple workspaces into groups
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GROUP_WORKSPACES TABLE
-- Many-to-many relationship between groups and workspaces
-- ============================================================
CREATE TABLE IF NOT EXISTS group_workspaces (
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, workspace_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_last_accessed ON workspaces(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tabs_workspace_id ON tabs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_workspaces ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
CREATE POLICY "Users can view their own workspaces"
    ON workspaces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces"
    ON workspaces FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces"
    ON workspaces FOR DELETE
    USING (auth.uid() = user_id);

-- Tabs Policies (via workspace ownership)
CREATE POLICY "Users can view tabs in their workspaces"
    ON tabs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tabs.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tabs in their workspaces"
    ON tabs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tabs.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tabs in their workspaces"
    ON tabs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tabs.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tabs in their workspaces"
    ON tabs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tabs.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

-- Groups Policies
CREATE POLICY "Users can view their own groups"
    ON groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
    ON groups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
    ON groups FOR DELETE
    USING (auth.uid() = user_id);

-- Group Workspaces Policies (via group ownership)
CREATE POLICY "Users can view their group-workspace associations"
    ON group_workspaces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_workspaces.group_id
            AND groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their group-workspace associations"
    ON group_workspaces FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_workspaces.group_id
            AND groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their group-workspace associations"
    ON group_workspaces FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_workspaces.group_id
            AND groups.user_id = auth.uid()
        )
    );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for workspaces updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- NOTES
-- ============================================================
-- 1. This schema uses Supabase Auth (auth.users) for user management
-- 2. user_id is UUID type, matching Supabase Auth user IDs
-- 3. Row Level Security (RLS) ensures users only access their own data
-- 4. Use auth.uid() to get the current logged-in user's ID
-- 5. BIGSERIAL is used for auto-incrementing IDs (PostgreSQL equivalent of AUTOINCREMENT)
-- 6. TIMESTAMPTZ stores timestamps with timezone information
