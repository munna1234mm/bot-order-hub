-- Create admin_settings table to store admin telegram chat IDs
CREATE TABLE public.admin_telegram_ids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_chat_id bigint NOT NULL UNIQUE,
  name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_telegram_ids ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage admin IDs
CREATE POLICY "Allow authenticated users to manage admin IDs"
  ON public.admin_telegram_ids
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read for edge function
CREATE POLICY "Allow public read of admin IDs"
  ON public.admin_telegram_ids
  FOR SELECT
  USING (true);