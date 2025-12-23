
-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bkash', 'nagad', 'rocket', 'binance')),
  account_number TEXT NOT NULL,
  account_name TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposits table
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id),
  transaction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Allow authenticated users to manage payment methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read of active payment methods"
ON public.payment_methods FOR SELECT
USING (is_active = true);

-- Deposits policies
CREATE POLICY "Allow authenticated users to manage deposits"
ON public.deposits FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow insert deposits"
ON public.deposits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow read deposits"
ON public.deposits FOR SELECT
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;

-- Create indexes
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_deposits_telegram_user_id ON public.deposits(telegram_user_id);
