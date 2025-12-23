import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'bkash' | 'nagad' | 'rocket' | 'binance';
  account_number: string;
  account_name: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PaymentMethod[];
    }
  });

  const addPaymentMethod = useMutation({
    mutationFn: async (method: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert(method)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('পেমেন্ট মেথড যোগ করা হয়েছে');
    },
    onError: (error) => {
      toast.error('পেমেন্ট মেথড যোগ করতে সমস্যা হয়েছে');
      console.error(error);
    }
  });

  const updatePaymentMethod = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('পেমেন্ট মেথড আপডেট করা হয়েছে');
    },
    onError: (error) => {
      toast.error('পেমেন্ট মেথড আপডেট করতে সমস্যা হয়েছে');
      console.error(error);
    }
  });

  const deletePaymentMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('পেমেন্ট মেথড মুছে ফেলা হয়েছে');
    },
    onError: (error) => {
      toast.error('পেমেন্ট মেথড মুছতে সমস্যা হয়েছে');
      console.error(error);
    }
  });

  const togglePaymentMethod = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('পেমেন্ট মেথড স্ট্যাটাস আপডেট হয়েছে');
    },
    onError: (error) => {
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
      console.error(error);
    }
  });

  return {
    paymentMethods,
    isLoading,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethod
  };
};
