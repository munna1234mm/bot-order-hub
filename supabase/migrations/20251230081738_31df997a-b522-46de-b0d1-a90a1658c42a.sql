-- Add order_type column to chatgpt_orders to distinguish between different ChatGPT services
ALTER TABLE public.chatgpt_orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'chatgpt_plus';

-- Add credits_cost column to track how many credits were deducted
ALTER TABLE public.chatgpt_orders ADD COLUMN IF NOT EXISTS credits_cost integer NOT NULL DEFAULT 6;