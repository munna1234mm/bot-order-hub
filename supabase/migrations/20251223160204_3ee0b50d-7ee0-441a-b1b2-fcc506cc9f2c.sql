-- Add language column to telegram_users
ALTER TABLE public.telegram_users 
ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Create index for language column
CREATE INDEX idx_telegram_users_language ON public.telegram_users(language);