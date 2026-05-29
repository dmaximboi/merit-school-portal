-- Fix RLS Security Issues
-- Enable RLS on tables that have it disabled
-- Add RLS policies to tables that have RLS enabled but no policies
-- Fix security definer view
-- Protect sensitive columns

-- 1. Enable RLS on tables where it's disabled
ALTER TABLE public.subscription_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for tables that had RLS enabled but no policies

-- activity_logs - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage activity_logs" ON public.activity_logs;
CREATE POLICY "Service role can manage activity_logs" ON public.activity_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own activity_logs" ON public.activity_logs;
CREATE POLICY "Students can read own activity_logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- admin_allowlist - Allow service role full access, admins to read
DROP POLICY IF EXISTS "Service role can manage admin_allowlist" ON public.admin_allowlist;
CREATE POLICY "Service role can manage admin_allowlist" ON public.admin_allowlist
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read admin_allowlist" ON public.admin_allowlist;
CREATE POLICY "Admins can read admin_allowlist" ON public.admin_allowlist
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- cbt_sessions - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage cbt_sessions" ON public.cbt_sessions;
CREATE POLICY "Service role can manage cbt_sessions" ON public.cbt_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own cbt_sessions" ON public.cbt_sessions;
CREATE POLICY "Students can read own cbt_sessions" ON public.cbt_sessions
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- library_books - Allow service role full access, authenticated users to read
DROP POLICY IF EXISTS "Service role can manage library_books" ON public.library_books;
CREATE POLICY "Service role can manage library_books" ON public.library_books
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read library_books" ON public.library_books;
CREATE POLICY "Authenticated can read library_books" ON public.library_books
  FOR SELECT TO authenticated
  USING (true);

-- library_purchases - Allow service role full access, users to read their own
DROP POLICY IF EXISTS "Service role can manage library_purchases" ON public.library_purchases;
CREATE POLICY "Service role can manage library_purchases" ON public.library_purchases
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own library_purchases" ON public.library_purchases;
CREATE POLICY "Users can read own library_purchases" ON public.library_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- otp_codes - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage otp_codes" ON public.otp_codes;
CREATE POLICY "Service role can manage otp_codes" ON public.otp_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- quiz_attempts - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Service role can manage quiz_attempts" ON public.quiz_attempts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Students can read own quiz_attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- quizzes - Allow service role full access, authenticated users to read
DROP POLICY IF EXISTS "Service role can manage quizzes" ON public.quizzes;
CREATE POLICY "Service role can manage quizzes" ON public.quizzes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read quizzes" ON public.quizzes;
CREATE POLICY "Authenticated can read quizzes" ON public.quizzes
  FOR SELECT TO authenticated
  USING (true);

-- staff - Allow service role full access, staff to read their own
DROP POLICY IF EXISTS "Service role can manage staff" ON public.staff;
CREATE POLICY "Service role can manage staff" ON public.staff
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can read own staff" ON public.staff;
CREATE POLICY "Staff can read own staff" ON public.staff
  FOR SELECT TO authenticated
  USING (
    email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- timetables - Allow service role full access, authenticated users to read
DROP POLICY IF EXISTS "Service role can manage timetables" ON public.timetables;
CREATE POLICY "Service role can manage timetables" ON public.timetables
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read timetables" ON public.timetables;
CREATE POLICY "Authenticated can read timetables" ON public.timetables
  FOR SELECT TO authenticated
  USING (true);

-- transaction_logs - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage transaction_logs" ON public.transaction_logs;
CREATE POLICY "Service role can manage transaction_logs" ON public.transaction_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- verification_codes - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage verification_codes" ON public.verification_codes;
CREATE POLICY "Service role can manage verification_codes" ON public.verification_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Add RLS policies for tables that had RLS disabled

-- subscription_fees - Allow service role full access, authenticated users to read
DROP POLICY IF EXISTS "Service role can manage subscription_fees" ON public.subscription_fees;
CREATE POLICY "Service role can manage subscription_fees" ON public.subscription_fees
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read subscription_fees" ON public.subscription_fees;
CREATE POLICY "Authenticated can read subscription_fees" ON public.subscription_fees
  FOR SELECT TO authenticated
  USING (true);

-- cbt_subscriptions - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage cbt_subscriptions" ON public.cbt_subscriptions;
CREATE POLICY "Service role can manage cbt_subscriptions" ON public.cbt_subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own cbt_subscriptions" ON public.cbt_subscriptions;
CREATE POLICY "Students can read own cbt_subscriptions" ON public.cbt_subscriptions
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- student_programs - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage student_programs" ON public.student_programs;
CREATE POLICY "Service role can manage student_programs" ON public.student_programs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own student_programs" ON public.student_programs;
CREATE POLICY "Students can read own student_programs" ON public.student_programs
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- subscription_transactions - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage subscription_transactions" ON public.subscription_transactions;
CREATE POLICY "Service role can manage subscription_transactions" ON public.subscription_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own subscription_transactions" ON public.subscription_transactions;
CREATE POLICY "Students can read own subscription_transactions" ON public.subscription_transactions
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- security_logs - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage security_logs" ON public.security_logs;
CREATE POLICY "Service role can manage security_logs" ON public.security_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- login_attempts - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage login_attempts" ON public.login_attempts;
CREATE POLICY "Service role can manage login_attempts" ON public.login_attempts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- staff_tokens - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage staff_tokens" ON public.staff_tokens;
CREATE POLICY "Service role can manage staff_tokens" ON public.staff_tokens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Fix security definer view - recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.view_active_subs;

CREATE OR REPLACE VIEW public.view_active_subs AS
SELECT 
  cs.id,
  cs.student_id,
  cs.plan_type,
  cs.amount_paid,
  cs.start_date,
  cs.expiry_date,
  s.student_id_text,
  s.surname,
  s.first_name,
  s.email
FROM public.cbt_subscriptions cs
JOIN public.students s ON cs.student_id = s.id
WHERE cs.expiry_date > NOW();

-- 5. Protect sensitive column in staff_tokens by creating a secure view
CREATE OR REPLACE VIEW public.staff_tokens_secure AS
SELECT
  id,
  used_at,
  is_active,
  created_at
FROM public.staff_tokens;

-- Grant access to the secure view
GRANT SELECT ON public.staff_tokens_secure TO authenticated;
GRANT SELECT ON public.staff_tokens_secure TO anon;

-- 6. Add RLS policies for remaining tables

-- e_notes - Allow service role full access, authenticated users to read active notes
DROP POLICY IF EXISTS "Service role can manage e_notes" ON public.e_notes;
CREATE POLICY "Service role can manage e_notes" ON public.e_notes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read active e_notes" ON public.e_notes;
CREATE POLICY "Authenticated can read active e_notes" ON public.e_notes
  FOR SELECT TO authenticated
  USING (is_active = true);

-- chat_messages - Allow service role full access, users to read their own messages
DROP POLICY IF EXISTS "Service role can manage chat_messages" ON public.chat_messages;
CREATE POLICY "Service role can manage chat_messages" ON public.chat_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own chat_messages" ON public.chat_messages;
CREATE POLICY "Users can read own chat_messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    sender_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    OR sender_id IN (
      SELECT id FROM public.staff
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- payments - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
CREATE POLICY "Service role can manage payments" ON public.payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own payments" ON public.payments;
CREATE POLICY "Students can read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- results - Allow service role full access, students to read their own
DROP POLICY IF EXISTS "Service role can manage results" ON public.results;
CREATE POLICY "Service role can manage results" ON public.results
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can read own results" ON public.results;
CREATE POLICY "Students can read own results" ON public.results
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- announcements - Allow service role full access, authenticated users to read
DROP POLICY IF EXISTS "Service role can manage announcements" ON public.announcements;
CREATE POLICY "Service role can manage announcements" ON public.announcements
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read announcements" ON public.announcements;
CREATE POLICY "Authenticated can read announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (true);

-- system_settings - Allow service role full access only
DROP POLICY IF EXISTS "Service role can manage system_settings" ON public.system_settings;
CREATE POLICY "Service role can manage system_settings" ON public.system_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Restrict GraphQL API access to sensitive tables
-- Revoke SELECT from anon and authenticated for sensitive tables
REVOKE SELECT ON public.activity_logs FROM anon;
REVOKE SELECT ON public.activity_logs FROM authenticated;
REVOKE SELECT ON public.admin_allowlist FROM anon;
REVOKE SELECT ON public.admin_allowlist FROM authenticated;
REVOKE SELECT ON public.chat_messages FROM anon;
REVOKE SELECT ON public.chat_messages FROM authenticated;
REVOKE SELECT ON public.login_attempts FROM anon;
REVOKE SELECT ON public.login_attempts FROM authenticated;
REVOKE SELECT ON public.otp_codes FROM anon;
REVOKE SELECT ON public.otp_codes FROM authenticated;
REVOKE SELECT ON public.payments FROM anon;
REVOKE SELECT ON public.payments FROM authenticated;
REVOKE SELECT ON public.security_logs FROM anon;
REVOKE SELECT ON public.security_logs FROM authenticated;
REVOKE SELECT ON public.staff_tokens FROM anon;
REVOKE SELECT ON public.staff_tokens FROM authenticated;
REVOKE SELECT ON public.subscription_transactions FROM anon;
REVOKE SELECT ON public.subscription_transactions FROM authenticated;
REVOKE SELECT ON public.transaction_logs FROM anon;
REVOKE SELECT ON public.transaction_logs FROM authenticated;
REVOKE SELECT ON public.verification_codes FROM anon;
REVOKE SELECT ON public.verification_codes FROM authenticated;

-- 8. Fix function search path mutable warning
ALTER FUNCTION public.update_updated_at_column SET search_path = public;

-- 9. Note: Leaked password protection must be enabled in Supabase Auth dashboard
-- This cannot be done via SQL migration - requires dashboard configuration
