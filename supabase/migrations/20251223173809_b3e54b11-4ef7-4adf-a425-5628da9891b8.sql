-- Create canva_pro_requests table
CREATE TABLE public.canva_pro_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  gmail TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.canva_pro_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read of canva pro requests"
ON public.canva_pro_requests
FOR SELECT
USING (true);

CREATE POLICY "Allow insert canva pro requests"
ON public.canva_pro_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage requests"
ON public.canva_pro_requests
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.canva_pro_requests;