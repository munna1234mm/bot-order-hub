-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create bot_settings table for storing global settings like referral bonus
CREATE TABLE public.bot_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read of bot settings" 
ON public.bot_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to manage settings" 
ON public.bot_settings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert default referral bonus setting
INSERT INTO public.bot_settings (key, value, description) 
VALUES ('referral_bonus', '3', 'Credits given to both referrer and referred user');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bot_settings_updated_at
BEFORE UPDATE ON public.bot_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();