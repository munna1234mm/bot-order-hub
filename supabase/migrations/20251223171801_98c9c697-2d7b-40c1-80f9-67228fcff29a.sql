-- Add is_banned column to telegram_users table
ALTER TABLE public.telegram_users 
ADD COLUMN is_banned boolean NOT NULL DEFAULT false;

-- Add banned_at timestamp
ALTER TABLE public.telegram_users 
ADD COLUMN banned_at timestamp with time zone;