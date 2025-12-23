import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminTelegramId {
  id: string;
  telegram_chat_id: number;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export function useAdminTelegramIds() {
  const [admins, setAdmins] = useState<AdminTelegramId[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data, error } = await supabase
        .from('admin_telegram_ids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin telegram IDs:', error);
      } else {
        setAdmins(data || []);
      }
      setLoading(false);
    };

    fetchAdmins();

    const channel = supabase
      .channel('admin-telegram-ids-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_telegram_ids',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAdmins((prev) => [payload.new as AdminTelegramId, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAdmins((prev) =>
              prev.map((admin) =>
                admin.id === (payload.new as AdminTelegramId).id
                  ? (payload.new as AdminTelegramId)
                  : admin
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAdmins((prev) =>
              prev.filter((admin) => admin.id !== (payload.old as AdminTelegramId).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addAdmin = async (telegramChatId: number, name: string) => {
    const { error } = await supabase.from('admin_telegram_ids').insert({
      telegram_chat_id: telegramChatId,
      name: name || null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Admin added successfully',
    });
    return true;
  };

  const deleteAdmin = async (id: string) => {
    const { error } = await supabase.from('admin_telegram_ids').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Admin removed successfully',
    });
    return true;
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('admin_telegram_ids')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  return { admins, loading, addAdmin, deleteAdmin, toggleActive };
}
