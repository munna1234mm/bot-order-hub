-- Add referral columns to telegram_users
ALTER TABLE public.telegram_users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by BIGINT,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_telegram_users_referral_code ON public.telegram_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_telegram_users_referred_by ON public.telegram_users(referred_by);