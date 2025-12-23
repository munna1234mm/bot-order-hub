import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramMessage {
  id: string;
  telegram_user_id: number;
  message_text: string | null;
  message_type: string;
  chat_id: number;
  created_at: string;
}

export function useTelegramMessages() {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('telegram_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel('telegram-messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telegram_messages' },
        (payload) => {
          setMessages((prev) => [payload.new as TelegramMessage, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { messages, loading, totalCount: messages.length };
}
