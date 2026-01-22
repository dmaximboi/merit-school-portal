-- Migration: Add columns for payments, subscriptions, and chat images
-- Run this in Supabase SQL Editor
-- NOTE: If any section fails, copy and run only the failed section after fixing dependencies.

-- ============================================
-- SECTION 1: PAYMENTS TABLE
-- ============================================
-- First, create the payments table without foreign key constraint
-- This ensures the table is created even if students table doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    tx_ref VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cbt', 'quiz', 'program')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    flw_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- Add foreign key constraint separately (will fail gracefully if students doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_student_id_fkey' AND table_name = 'payments'
    ) THEN
        BEGIN
            ALTER TABLE payments 
            ADD CONSTRAINT payments_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add student_id foreign key - students table may not exist yet';
        END;
    END IF;
END $$;

-- Create indexes on payments
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(tx_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- SECTION 2: STUDENTS TABLE - Add subscription columns
-- ============================================
-- These will fail gracefully if students table doesn't exist
DO $$
BEGIN
    ALTER TABLE students ADD COLUMN IF NOT EXISTS cbt_subscription_active BOOLEAN DEFAULT FALSE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS cbt_subscription_expires TIMESTAMPTZ;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS quiz_questions_today INTEGER DEFAULT 0;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS quiz_questions_week INTEGER DEFAULT 0;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS quiz_limit_reset TIMESTAMPTZ;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter students table - it may not exist yet';
END $$;

-- ============================================
-- SECTION 3: CHAT MESSAGES TABLE - Add image columns
-- ============================================
DO $$
BEGIN
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_thumbnail TEXT;
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter chat_messages table - it may not exist yet';
END $$;

-- ============================================
-- SECTION 4: QUIZZES TABLE - Make creator_id nullable and add description
-- ============================================
DO $$
BEGIN
    ALTER TABLE quizzes ALTER COLUMN creator_id DROP NOT NULL;
    ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter quizzes table - it may not exist yet';
END $$;

-- ============================================
-- SECTION 5: APP SETTINGS TABLE (for prices)
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default prices
INSERT INTO app_settings (key, value) VALUES 
    ('cbt_price', '2000'),
    ('quiz_price', '500')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SECTION 6: SECURITY - Row Level Security
-- ============================================
-- Enable RLS on payments (will fail if table doesn't exist)
DO $$
BEGIN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    
    -- Drop and recreate policies
    DROP POLICY IF EXISTS "Students can view own payments" ON payments;
    CREATE POLICY "Students can view own payments" 
        ON payments FOR SELECT 
        USING (student_id = auth.uid());

    DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
    CREATE POLICY "Admins can manage payments" 
        ON payments FOR ALL 
        USING (true);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set up RLS on payments table';
END $$;

-- ============================================
-- SECTION 7: INDEXES for performance
-- ============================================
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_students_subscription ON students(cbt_subscription_active, cbt_subscription_expires);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create students index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create chat_messages index';
END $$;

-- Confirm migration
SELECT 'Migration completed! Check NOTICES for any warnings.' as status;

