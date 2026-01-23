-- E-Notes Table
-- Run this in Supabase SQL Editor

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

-- Add extra columns to chat_messages for edit/delete features
-- Only run if columns don't exist

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_enotes_subject ON e_notes(subject);
CREATE INDEX IF NOT EXISTS idx_enotes_active ON e_notes(is_active);

-- RLS Policies for e_notes
ALTER TABLE e_notes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active notes
CREATE POLICY "Anyone can read active e_notes" ON e_notes
    FOR SELECT USING (is_active = true);

-- Only authenticated users with service role can modify
CREATE POLICY "Service role can manage e_notes" ON e_notes
    USING (auth.role() = 'service_role');
