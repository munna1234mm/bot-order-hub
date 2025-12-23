import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BotSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useBotSettings() {
  const [settings, setSettings] = useState<BotSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('Error fetching bot settings:', error);
      } else {
        setSettings(data || []);
      }
      setLoading(false);
    };

    fetchSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('bot-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_settings',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSettings((prev) => [...prev, payload.new as BotSetting]);
          } else if (payload.eventType === 'UPDATE') {
            setSettings((prev) =>
              prev.map((setting) =>
                setting.id === (payload.new as BotSetting).id
                  ? (payload.new as BotSetting)
                  : setting
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSettings((prev) =>
              prev.filter((setting) => setting.id !== (payload.old as BotSetting).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSetting = (key: string): string | null => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : null;
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('bot_settings')
      .update({ value })
      .eq('key', key);

    if (error) {
      throw error;
    }
  };

  return { settings, loading, getSetting, updateSetting };
}
