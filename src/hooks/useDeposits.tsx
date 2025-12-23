import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Deposit {
  id: string;
  telegram_user_id: number;
  amount: number;
  payment_method_id: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  payment_methods?: {
    name: string;
    type: string;
  };
  telegram_users?: {
    username: string | null;
    first_name: string | null;
  };
}

export const useDeposits = () => {
  const queryClient = useQueryClient();

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          payment_methods (name, type)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Deposit[];
    }
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('deposits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deposits' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['deposits'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const approveDeposit = useMutation({
    mutationFn: async ({ id, telegram_user_id, amount }: { id: string; telegram_user_id: number; amount: number }) => {
      // First get current user balance
      const { data: currentUser, error: userError } = await supabase
        .from('telegram_users')
        .select('balance')
        .eq('telegram_id', telegram_user_id)
        .single();
      
      if (userError) throw userError;

      // Update balance
      const newBalance = (currentUser?.balance || 0) + Math.floor(amount);
      const { error: balanceError } = await supabase
        .from('telegram_users')
        .update({ balance: newBalance })
        .eq('telegram_id', telegram_user_id);
      
      if (balanceError) throw balanceError;

      // Update the deposit status
      const { error: depositError } = await supabase
        .from('deposits')
        .update({ 
          status: 'approved', 
          processed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (depositError) throw depositError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-users'] });
      toast.success('ডিপোজিট অনুমোদিত হয়েছে এবং ব্যালেন্স যোগ হয়েছে');
    },
    onError: (error) => {
      toast.error('ডিপোজিট অনুমোদন করতে সমস্যা হয়েছে');
      console.error(error);
    }
  });

  const rejectDeposit = useMutation({
    mutationFn: async ({ id, admin_note }: { id: string; admin_note?: string }) => {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          status: 'rejected', 
          processed_at: new Date().toISOString(),
          admin_note
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success('ডিপোজিট বাতিল করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ডিপোজিট বাতিল করতে সমস্যা হয়েছে');
      console.error(error);
    }
  });

  return {
    deposits,
    isLoading,
    approveDeposit,
    rejectDeposit
  };
};
