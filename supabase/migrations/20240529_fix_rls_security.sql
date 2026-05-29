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

-- activity_logs - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage activity_logs" ON public.activity_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read activity_logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (true);

-- admin_allowlist - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage admin_allowlist" ON public.admin_allowlist
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read admin_allowlist" ON public.admin_allowlist
  FOR SELECT TO authenticated
  USING (true);

-- cbt_sessions - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage cbt_sessions" ON public.cbt_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read cbt_sessions" ON public.cbt_sessions
  FOR SELECT TO authenticated
  USING (true);

-- library_books - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage library_books" ON public.library_books
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read library_books" ON public.library_books
  FOR SELECT TO authenticated
  USING (true);

-- library_purchases - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage library_purchases" ON public.library_purchases
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read library_purchases" ON public.library_purchases
  FOR SELECT TO authenticated
  USING (true);

-- otp_codes - Allow service role full access only
CREATE POLICY "Service role can manage otp_codes" ON public.otp_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- quiz_attempts - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage quiz_attempts" ON public.quiz_attempts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read quiz_attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (true);

-- quizzes - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage quizzes" ON public.quizzes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read quizzes" ON public.quizzes
  FOR SELECT TO authenticated
  USING (true);

-- staff - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage staff" ON public.staff
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read staff" ON public.staff
  FOR SELECT TO authenticated
  USING (true);

-- timetables - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage timetables" ON public.timetables
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read timetables" ON public.timetables
  FOR SELECT TO authenticated
  USING (true);

-- transaction_logs - Allow service role full access only
CREATE POLICY "Service role can manage transaction_logs" ON public.transaction_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- verification_codes - Allow service role full access only
CREATE POLICY "Service role can manage verification_codes" ON public.verification_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Add RLS policies for tables that had RLS disabled

-- subscription_fees - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage subscription_fees" ON public.subscription_fees
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read subscription_fees" ON public.subscription_fees
  FOR SELECT TO authenticated
  USING (true);

-- cbt_subscriptions - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage cbt_subscriptions" ON public.cbt_subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read cbt_subscriptions" ON public.cbt_subscriptions
  FOR SELECT TO authenticated
  USING (true);

-- student_programs - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage student_programs" ON public.student_programs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read student_programs" ON public.student_programs
  FOR SELECT TO authenticated
  USING (true);

-- subscription_transactions - Allow service role full access, authenticated users to read
CREATE POLICY "Service role can manage subscription_transactions" ON public.subscription_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read subscription_transactions" ON public.subscription_transactions
  FOR SELECT TO authenticated
  USING (true);

-- security_logs - Allow service role full access only
CREATE POLICY "Service role can manage security_logs" ON public.security_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- login_attempts - Allow service role full access only
CREATE POLICY "Service role can manage login_attempts" ON public.login_attempts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- staff_tokens - Allow service role full access only
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
  staff_id,
  created_at,
  expires_at,
  is_active
FROM public.staff_tokens;

-- Grant access to the secure view
GRANT SELECT ON public.staff_tokens_secure TO authenticated;
GRANT SELECT ON public.staff_tokens_secure TO anon;
