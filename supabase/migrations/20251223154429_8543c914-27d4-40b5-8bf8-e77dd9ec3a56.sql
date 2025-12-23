-- Add balance and daily bonus tracking to telegram_users
ALTER TABLE public.telegram_users 
ADD COLUMN IF NOT EXISTS balance integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_claim timestamp with time zone;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_balance ON public.telegram_users(balance);