import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, User, Package, CreditCard, Palette, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  type: 'chatgpt' | 'canva' | 'deposit';
  status: string;
  created_at: string;
  user: {
    telegram_id: number;
    first_name: string | null;
    username: string | null;
  } | null;
  details?: string;
  amount?: number;
}

export function OrdersOverviewPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    try {
      // Fetch ChatGPT orders with user info
      const { data: chatgptOrders } = await supabase
        .from('chatgpt_orders')
        .select('id, status, created_at, telegram_user_id')
        .order('created_at', { ascending: false });

      // Fetch Canva Pro requests with user info
      const { data: canvaOrders } = await supabase
        .from('canva_pro_requests')
        .select('id, status, created_at, telegram_user_id, gmail')
        .order('created_at', { ascending: false });

      // Fetch Deposits with user info
      const { data: deposits } = await supabase
        .from('deposits')
        .select('id, status, created_at, telegram_user_id, amount')
        .order('created_at', { ascending: false });

      // Get all unique telegram user IDs
      const allUserIds = new Set<number>();
      chatgptOrders?.forEach(o => allUserIds.add(o.telegram_user_id));
      canvaOrders?.forEach(o => allUserIds.add(o.telegram_user_id));
      deposits?.forEach(o => allUserIds.add(o.telegram_user_id));

      // Fetch all users
      const { data: users } = await supabase
        .from('telegram_users')
        .select('telegram_id, first_name, username')
        .in('telegram_id', Array.from(allUserIds));

      const userMap = new Map(users?.map(u => [u.telegram_id, u]) || []);

      // Combine all orders
      const allOrders: OrderItem[] = [
        ...(chatgptOrders?.map(o => ({
          id: o.id,
          type: 'chatgpt' as const,
          status: o.status,
          created_at: o.created_at,
          user: userMap.get(o.telegram_user_id) || null,
          details: 'ChatGPT Plus Account',
        })) || []),
        ...(canvaOrders?.map(o => ({
          id: o.id,
          type: 'canva' as const,
          status: o.status,
          created_at: o.created_at,
          user: userMap.get(o.telegram_user_id) || null,
          details: `Canva Pro - ${o.gmail}`,
        })) || []),
        ...(deposits?.map(o => ({
          id: o.id,
          type: 'deposit' as const,
          status: o.status,
          created_at: o.created_at,
          user: userMap.get(o.telegram_user_id) || null,
          amount: o.amount,
          details: `Deposit ৳${o.amount}`,
        })) || []),
      ];

      // Sort by date
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('all-orders-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatgpt_orders' }, fetchAllOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canva_pro_requests' }, fetchAllOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchAllOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'completed':
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chatgpt':
        return <Bot className="h-4 w-4 text-green-400" />;
      case 'canva':
        return <Palette className="h-4 w-4 text-purple-400" />;
      case 'deposit':
        return <CreditCard className="h-4 w-4 text-blue-400" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'chatgpt':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ChatGPT</Badge>;
      case 'canva':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Canva Pro</Badge>;
      case 'deposit':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Deposit</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Calculate stats
  const totalOrders = orders.length;
  const chatgptCount = orders.filter(o => o.type === 'chatgpt').length;
  const canvaCount = orders.filter(o => o.type === 'canva').length;
  const depositCount = orders.filter(o => o.type === 'deposit').length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <Card className="bg-card border-border">
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">All Orders Overview</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {totalOrders} Total
          </Badge>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {pendingCount} Pending
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3 text-green-400" /> {chatgptCount}
            </span>
            <span className="flex items-center gap-1">
              <Palette className="h-3 w-3 text-purple-400" /> {canvaCount}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-blue-400" /> {depositCount}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={`${order.type}-${order.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-background">
                        {getTypeIcon(order.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {order.user?.first_name || 'Unknown'}
                          </span>
                          {order.user?.username && (
                            <span className="text-primary">@{order.user.username}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {order.details}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTypeBadge(order.type)}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}
