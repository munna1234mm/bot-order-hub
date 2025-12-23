import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramUser {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  last_active_at: string;
  created_at: string;
  balance: number;
  last_daily_claim: string | null;
  is_banned: boolean;
  banned_at: string | null;
}

export function useTelegramUsers() {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial users
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .order('last_active_at', { ascending: false });

      if (error) {
        console.error('Error fetching telegram users:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('telegram-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'telegram_users',
        },
        (payload) => {
          console.log('Telegram users change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setUsers((prev) => [payload.new as TelegramUser, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers((prev) =>
              prev.map((user) =>
                user.id === (payload.new as TelegramUser).id
                  ? (payload.new as TelegramUser)
                  : user
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setUsers((prev) =>
              prev.filter((user) => user.id !== (payload.old as TelegramUser).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get users active in last 5 minutes
  const activeUsers = users.filter((user) => {
    const lastActive = new Date(user.last_active_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActive > fiveMinutesAgo;
  });

  return { users, activeUsers, loading, totalCount: users.length };
}
