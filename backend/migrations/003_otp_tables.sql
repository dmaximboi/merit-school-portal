-- Create table for storing One-Time Passwords (OTPs)
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster verification
CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_codes(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- RLS Policies (Security)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Only the server (service_role) should largely manage this, but users can verify their own if needed
-- For now, we'll keep it simple: Service Role has full access.
-- If you access this from client, you need policies. Assuming backend access mainly.
