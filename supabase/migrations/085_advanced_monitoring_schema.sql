-- Migration 085: Advanced Monitoring Adjustments

-- 1. Allow anonymous/system events in audit_logs (actor_id nullable)
ALTER TABLE public.audit_logs ALTER COLUMN actor_id DROP NOT NULL;

-- 2. Modify check_rate_limit to automatically log abuses via trigger or RPC? 
-- Alternatively, we do it at the application level. Let's do it at application level, it's easier to format.
