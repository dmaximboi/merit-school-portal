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

-- NEW: Edit/Delete columns
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_content TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;


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
-- 5. CBT AI MODEL TRACKING
-- =====================================

-- Add ai_model column to track which AI generated questions
ALTER TABLE cbt_questions ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100);


-- =====================================
-- 6. RLS POLICIES (SECURITY)
-- =====================================

-- E-Notes RLS
ALTER TABLE e_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create
DROP POLICY IF EXISTS "Anyone can read active e_notes" ON e_notes;
CREATE POLICY "Anyone can read active e_notes" ON e_notes
    FOR SELECT USING (is_active = true);

-- Students Table RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own data" ON students;
CREATE POLICY "Students can view own data" ON students
    FOR SELECT USING (id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Payments Table RLS  
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own payments" ON payments;
CREATE POLICY "Students can view own payments" ON payments
    FOR SELECT USING (student_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Only backend can insert payments" ON payments;
CREATE POLICY "Only backend can insert payments" ON payments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Chat Messages RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read chat" ON chat_messages;
CREATE POLICY "Authenticated users can read chat" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can edit own messages" ON chat_messages;
CREATE POLICY "Users can edit own messages" ON chat_messages
    FOR UPDATE USING (sender_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can delete own messages" ON chat_messages
    FOR DELETE USING (sender_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- CBT Questions RLS (Read-only for students)
ALTER TABLE cbt_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read questions" ON cbt_questions;
CREATE POLICY "Everyone can read questions" ON cbt_questions
    FOR SELECT USING (true);

DROP POLICY IF NOT EXISTS "Only admin can modify questions" ON cbt_questions;
CREATE POLICY "Only admin can modify questions" ON cbt_questions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Note: Backend uses service_role key so it bypasses RLS for admin operations
