import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BotCommand {
  id: string;
  command: string;
  response: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBotCommands() {
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommands = async () => {
    const { data, error } = await supabase
      .from('bot_commands')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commands:', error);
      toast({ title: 'Error', description: 'Failed to load commands', variant: 'destructive' });
    } else {
      setCommands(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommands();

    const channel = supabase
      .channel('bot-commands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_commands' }, () => {
        fetchCommands();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addCommand = async (command: string, response: string) => {
    const { error } = await supabase
      .from('bot_commands')
      .insert({ command: command.toLowerCase().replace('/', ''), response });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Success', description: 'Command added successfully' });
    return true;
  };

  const updateCommand = async (id: string, updates: Partial<BotCommand>) => {
    const { error } = await supabase
      .from('bot_commands')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Success', description: 'Command updated' });
    return true;
  };

  const deleteCommand = async (id: string) => {
    const { error } = await supabase
      .from('bot_commands')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Success', description: 'Command deleted' });
    return true;
  };

  return { commands, loading, addCommand, updateCommand, deleteCommand };
}
