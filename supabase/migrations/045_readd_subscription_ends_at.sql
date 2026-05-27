-- Migration: Re-add subscription_ends_at
-- This column was inadvertently dropped in migration 020.
-- We are adding it back as it is required by the access control logic.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;
