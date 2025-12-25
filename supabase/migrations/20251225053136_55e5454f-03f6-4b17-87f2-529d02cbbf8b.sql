-- Create chatgpt_orders table
CREATE TABLE public.chatgpt_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  gmail TEXT,
  password TEXT,
  admin_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.chatgpt_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read of chatgpt orders" 
ON public.chatgpt_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert chatgpt orders" 
ON public.chatgpt_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage orders" 
ON public.chatgpt_orders 
FOR ALL 
USING (true)
WITH CHECK (true);