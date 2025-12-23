-- Create table for bot commands and auto-replies
CREATE TABLE public.bot_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking messages
CREATE TABLE public.telegram_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  message_text TEXT,
  message_type TEXT DEFAULT 'text',
  chat_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read for bot commands (needed by edge function)
CREATE POLICY "Allow public read of bot commands"
ON public.bot_commands FOR SELECT USING (true);

-- Allow authenticated users to manage commands
CREATE POLICY "Allow authenticated users to manage commands"
ON public.bot_commands FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public read of messages for dashboard
CREATE POLICY "Allow public read of messages"
ON public.telegram_messages FOR SELECT USING (true);

-- Allow insert from edge function
CREATE POLICY "Allow insert messages"
ON public.telegram_messages FOR INSERT
WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_commands;