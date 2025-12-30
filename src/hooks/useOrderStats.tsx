import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  chatgptOrders: number;
  canvaOrders: number;
  deposits: number;
}

export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    chatgptOrders: 0,
    canvaOrders: 0,
    deposits: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch ChatGPT orders
      const { data: chatgptData, count: chatgptCount } = await supabase
        .from('chatgpt_orders')
        .select('status', { count: 'exact' });

      // Fetch Canva Pro requests
      const { data: canvaData, count: canvaCount } = await supabase
        .from('canva_pro_requests')
        .select('status', { count: 'exact' });

      // Fetch Deposits
      const { data: depositsData, count: depositsCount } = await supabase
        .from('deposits')
        .select('status', { count: 'exact' });

      const chatgptPending = chatgptData?.filter(o => o.status === 'pending').length || 0;
      const canvaPending = canvaData?.filter(o => o.status === 'pending').length || 0;
      const depositsPending = depositsData?.filter(o => o.status === 'pending').length || 0;

      const chatgptCompleted = chatgptData?.filter(o => o.status === 'completed').length || 0;
      const canvaCompleted = canvaData?.filter(o => o.status === 'approved').length || 0;
      const depositsCompleted = depositsData?.filter(o => o.status === 'approved').length || 0;

      setStats({
        totalOrders: (chatgptCount || 0) + (canvaCount || 0) + (depositsCount || 0),
        pendingOrders: chatgptPending + canvaPending + depositsPending,
        completedOrders: chatgptCompleted + canvaCompleted + depositsCompleted,
        chatgptOrders: chatgptCount || 0,
        canvaOrders: canvaCount || 0,
        deposits: depositsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime updates
    const chatgptChannel = supabase
      .channel('chatgpt-orders-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatgpt_orders' }, fetchStats)
      .subscribe();

    const canvaChannel = supabase
      .channel('canva-requests-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canva_pro_requests' }, fetchStats)
      .subscribe();

    const depositsChannel = supabase
      .channel('deposits-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(chatgptChannel);
      supabase.removeChannel(canvaChannel);
      supabase.removeChannel(depositsChannel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
}
