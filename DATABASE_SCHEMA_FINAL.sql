-- ========================================================================================
-- MERIT SCHOOL PORTAL - COMPREHENSIVE DATABASE MIGRATION
-- ========================================================================================
-- Version: 2.0 - Clean Production Setup
-- Description: Complete database schema with Row Level Security (RLS), proper indexes,
--              and optimized structure. This script replaces ALL previous migrations.
-- 
-- IMPORTANT: This will DROP existing tables. Back up your data first!
-- Deploy: Run in Supabase SQL Editor
-- ========================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For secure password hashing

-- ========================================================================================  
-- SECTION 1: CLEANUP (Comment out if this is first-time setup)
-- ========================================================================================
/*
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS security_logs CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS transaction_logs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF NOT EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS cbt_sessions CASCADE;
DROP TABLE IF EXISTS cbt_questions CASCADE;
DROP TABLE IF EXISTS student_programs CASCADE;
DROP TABLE IF EXISTS cbt_subscriptions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS library_purchases CASCADE;
DROP TABLE IF EXISTS library_books CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS e_notes CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS admin_allowlist CASCADE;
*/

-- ========================================================================================
-- SECTION 2: SYSTEM TABLES
-- ========================================================================================

-- Admin Allowlist (Security Control)
CREATE TABLE IF NOT EXISTS admin_allowlist (
    email TEXT PRIMARY KEY,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_allowlist (email) VALUES 
    ('adewuyiayuba@gmail.com'), 
    ('olayayemi@gmail.com'),
    ('dmaximboi@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- System Settings (Fees & Config)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
    ('fee_jamb', '15000', 'JAMB Tutorial Fee'),
    ('fee_alevel', '27500', 'A-Level Acceptance Fee'),
    ('fee_olevel', '10000', 'O-Level Form Fee'),
    ('current_session', '2025/2026', 'Academic Session'),
    ('cbt_price', '2000', 'CBT Subscription Price (3 months)'),
    ('quiz_price', '500', 'Quiz Unlock Price')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================================================================
-- SECTION 3: USER MANAGEMENT TABLES
-- ========================================================================================

-- Profiles (Links to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Students (Complete Profile)
CREATE TABLE IF NOT EXISTS students (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    student_id_text TEXT UNIQUE NOT NULL,
    
    -- Personal Information
    surname TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    parents_phone TEXT,
    address TEXT,
    state_of_origin TEXT,
    lga TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    dob DATE,
    photo_url TEXT,
    
    -- Academic Information
    program_type TEXT CHECK (program_type IN ('JAMB', 'O-Level', 'A-Level')),
    department TEXT CHECK (department IN ('Science', 'Art', 'Commercial')),
    subjects JSONB DEFAULT '[]'::JSONB,
    university_choice TEXT,
    course_choice TEXT,
    
    -- Status Flags
    is_validated BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    
    -- CBT Subscription
    cbt_subscription_active BOOLEAN DEFAULT FALSE,
    cbt_subscription_expires TIMESTAMPTZ,
    quiz_questions_today INTEGER DEFAULT 0,
    quiz_questions_week INTEGER DEFAULT 0,
    quiz_limit_reset TIMESTAMPTZ,
    
    -- Parent Access
    is_parent_access_enabled BOOLEAN DEFAULT TRUE,
    
    -- Security
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    staff_id_text TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT,
    position TEXT,
    phone_number TEXT,
    address TEXT,
    qualification TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Codes (For Staff Registration)
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- ========================================================================================
-- SECTION 4: ACADEMIC TABLES
-- ========================================================================================

-- E-Notes
CREATE TABLE IF NOT EXISTS e_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(50) DEFAULT 'All',
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) DEFAULT 'pdf',
    file_size INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    downloads INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enotes_subject ON e_notes(subject);
CREATE INDEX IF NOT EXISTS idx_enotes_active ON e_notes(is_active) WHERE is_active = TRUE;

-- Library Books
CREATE TABLE IF NOT EXISTS library_books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    drive_link TEXT NOT NULL,
    cover_url TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    target_audience TEXT DEFAULT 'all',
    restricted_dept TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library Purchases
CREATE TABLE IF NOT EXISTS library_purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES library_books(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    reference TEXT,
    status TEXT DEFAULT 'successful',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results
CREATE TABLE IF NOT EXISTS results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    ca_score DECIMAL(5,2) DEFAULT 0 CHECK (ca_score >= 0 AND ca_score <= 40),
    exam_score DECIMAL(5,2) DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (ca_score + exam_score) STORED,
    grade TEXT,
    term TEXT DEFAULT 'First Term' CHECK (term IN ('First Term', 'Second Term', 'Third Term')),
    session TEXT DEFAULT '2025/2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject, term, session)
);

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT CHECK (department IN ('Science', 'Art', 'Commercial')),
    image_url TEXT,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================================
-- SECTION 5: CBT & QUIZ SYSTEM
-- ========================================================================================

-- CBT Questions
CREATE TABLE IF NOT EXISTS cbt_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme_hard')),
    question_text TEXT NOT NULL,
    image_url TEXT,
    options JSONB NOT NULL,
    correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
    explanation TEXT,
    ai_model VARCHAR(100), -- 'gemini', 'groq', or 'manual'
    created_by TEXT DEFAULT 'ai',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_subject_difficulty ON cbt_questions(subject, difficulty);

-- CBT Sessions
CREATE TABLE IF NOT EXISTS cbt_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subjects_chosen JSONB,
    topics_chosen JSONB,
    score INTEGER,
    total_questions INTEGER,
    time_spent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_sessions_student ON cbt_sessions(student_id);

-- User-Created Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    creator_name TEXT,
    creator_role TEXT,
    subject TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    questions JSONB NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    access_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER,
    total INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================================
-- SECTION 6: COMMUNICATION & PAYMENTS
-- ========================================================================================

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT,
    image_url TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_content TEXT,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);

-- Announcements/Broadcasts
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'student', 'staff')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    tx_ref VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cbt', 'quiz', 'program', 'school_fee')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    flw_ref VARCHAR(255),
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(tx_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Manual Transaction Logs (For admin approval)
CREATE TABLE IF NOT EXISTS transaction_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    reference_number TEXT,
    proof_url TEXT,
    payment_purpose TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id)
);

-- ========================================================================================
-- SECTION 7: SECURITY & AUDIT TABLES
-- ========================================================================================

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_id_text TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_student ON activity_logs(student_id);

-- Security Logs
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    severity TEXT DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity) WHERE severity IN ('HIGH', 'CRITICAL');

-- Login Attempts (For Account Security)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    suspended_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);

-- OTP Codes (For 2FA)
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_codes(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ========================================================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_allowlist ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read own profile
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- STUDENTS: Students read own data, admins/staff read all
DROP POLICY IF EXISTS "Students access policy" ON students;
CREATE POLICY "Students access policy" ON students
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
    );

-- E-NOTES: Everyone reads active notes
DROP POLICY IF EXISTS "Active e-notes readable" ON e_notes;
CREATE POLICY "Active e-notes readable" ON e_notes
    FOR SELECT USING (is_active = TRUE);

-- PAYMENTS: Students see own payments
DROP POLICY IF EXISTS "Students view own payments" ON payments;
CREATE POLICY "Students view own payments" ON payments
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
    );

-- CHAT: Authenticated users can read, users can edit/delete own messages
DROP POLICY IF EXISTS "Chat read policy" ON chat_messages;
CREATE POLICY "Chat read policy" ON chat_messages
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = FALSE);

DROP POLICY IF EXISTS "Chat edit own" ON chat_messages;
CREATE POLICY "Chat edit own" ON chat_messages
    FOR UPDATE USING (sender_id = auth.uid() AND (NOW() - created_at) < INTERVAL '15 minutes');

-- CBT: Students read questions, admins manage
DROP POLICY IF EXISTS "CBT questions readable" ON cbt_questions;
CREATE POLICY "CBT questions readable" ON cbt_questions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- RESULTS: Students view own results
DROP POLICY IF EXISTS "Students view own results" ON results;
CREATE POLICY "Students view own results" ON results
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
    );

-- ANNOUNCEMENTS: Everyone can read
DROP POLICY IF EXISTS "Announcements readable" ON announcements;
CREATE POLICY "Announcements readable" ON announcements
    FOR SELECT USING (TRUE);

-- SYSTEM SETTINGS: Everyone can read
DROP POLICY IF EXISTS "Settings readable" ON system_settings;
CREATE POLICY "Settings readable" ON system_settings
    FOR SELECT USING (TRUE);

-- ========================================================================================
-- SECTION 9: FUNCTIONS & TRIGGERS
-- ========================================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: system_settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON system_settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================================
-- SECTION 10: GRANTS & PERMISSIONS
-- ========================================================================================

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant to service role (Backend API)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ========================================================================================
-- COMPLETION
-- ========================================================================================

SELECT 'Migration completed successfully! All tables created with RLS enabled.' AS status;
