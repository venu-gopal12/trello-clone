-- Admin System Migration Script
-- This script adds admin functionality to the existing Trello clone database
-- Run this after the initial schema.sql has been executed

-- 1. Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2. Add is_suspended column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- 3. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'suspend_user', 'activate_user', 'change_role', 'delete_user', 'delete_organization', etc.
    target_entity_type VARCHAR(50) NOT NULL, -- 'user', 'organization'
    target_entity_id INTEGER NOT NULL,
    details JSONB, -- Additional context about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create index on admin_audit_logs for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON admin_audit_logs(action_type);

-- 5. Update existing users to 'user' role (if not already set)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- 6. Optional: Make the first user a super_admin (uncomment if needed)
-- UPDATE users SET role = 'super_admin' WHERE id = (SELECT MIN(id) FROM users);

COMMENT ON TABLE admin_audit_logs IS 'Tracks all administrative actions performed by admin users';
COMMENT ON COLUMN users.role IS 'User role: user (default), admin, or super_admin';
COMMENT ON COLUMN users.is_suspended IS 'Whether the user account is suspended';
