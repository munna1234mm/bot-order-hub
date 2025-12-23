-- Create coupon codes table
CREATE TABLE public.coupon_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 3,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create coupon redemptions table to track usage
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent same user redeeming same coupon twice
CREATE UNIQUE INDEX idx_coupon_redemption_unique ON public.coupon_redemptions(coupon_id, telegram_user_id);

-- Enable RLS
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupon_codes
CREATE POLICY "Allow authenticated users to manage coupons" 
ON public.coupon_codes 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read of active coupons" 
ON public.coupon_codes 
FOR SELECT 
USING (true);

-- RLS policies for coupon_redemptions
CREATE POLICY "Allow insert redemptions" 
ON public.coupon_redemptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read redemptions" 
ON public.coupon_redemptions 
FOR SELECT 
USING (true);

-- Enable realtime for coupon_codes
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_codes;