-- ====================================
-- MERIT SCHOOL PORTAL DATABASE MIGRATIONS
-- Run these in Supabase SQL Editor
-- ====================================

-- =====================================
-- 1. FIX CHAT_MESSAGES TABLE (REQUIRED)
-- =====================================

-- Add missing columns to chat_messages if they don't exist
-- Note: Run each ALTER separately if you get errors

-- Basic columns the backend expects:
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Optional columns for edit/delete features:
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;


-- =====================================
-- 2. E-NOTES TABLE (NEW FEATURE)
-- =====================================

CREATE TABLE IF NOT EXISTS e_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(50) DEFAULT 'All',
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) DEFAULT 'pdf',
    file_size INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    downloads INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Indexes for e_notes
CREATE INDEX IF NOT EXISTS idx_enotes_subject ON e_notes(subject);
CREATE INDEX IF NOT EXISTS idx_enotes_active ON e_notes(is_active);


-- =====================================
-- 3. STUDENT SUBSCRIPTION COLUMNS
-- =====================================

-- These columns are needed for CBT subscription
ALTER TABLE students ADD COLUMN IF NOT EXISTS cbt_subscription_active BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS cbt_subscription_expires TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS quiz_questions_today INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS quiz_questions_week INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS quiz_limit_reset TIMESTAMPTZ;


-- =====================================
-- 4. PAYMENTS TABLE (if not exists)
-- =====================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    tx_ref VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cbt' or 'quiz'
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    flw_ref VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);


-- =====================================
-- 5. RLS POLICIES
-- =====================================

-- E-Notes RLS
ALTER TABLE e_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read active e_notes" ON e_notes
    FOR SELECT USING (is_active = true);

-- Note: Backend uses service_role key so it bypasses RLS for admin operations
