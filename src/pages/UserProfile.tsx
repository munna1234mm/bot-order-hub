import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { ArrowLeft, User, Coins, Calendar, Clock, MessageSquare, ShoppingCart, CreditCard, Palette, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';

interface TelegramUser {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  balance: number;
  created_at: string;
  last_active_at: string;
  is_banned: boolean;
  referral_count: number | null;
  language: string;
}

interface OrderItem {
  id: string;
  type: 'chatgpt' | 'canva' | 'deposit';
  status: string;
  created_at: string;
  details?: string;
  amount?: number;
}

export default function UserProfile() {
  const { telegramId } = useParams<{ telegramId: string }>();
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telegramId) return;

    const fetchUserAndOrders = async () => {
      setLoading(true);
      
      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', parseInt(telegramId))
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        setLoading(false);
        return;
      }

      setUser(userData);

      // Fetch all orders for this user
      const [chatgptRes, canvaRes, depositsRes] = await Promise.all([
        supabase
          .from('chatgpt_orders')
          .select('*')
          .eq('telegram_user_id', parseInt(telegramId))
          .order('created_at', { ascending: false }),
        supabase
          .from('canva_pro_requests')
          .select('*')
          .eq('telegram_user_id', parseInt(telegramId))
          .order('created_at', { ascending: false }),
        supabase
          .from('deposits')
          .select('*, payment_methods(name)')
          .eq('telegram_user_id', parseInt(telegramId))
          .order('created_at', { ascending: false }),
      ]);

      const allOrders: OrderItem[] = [];

      chatgptRes.data?.forEach((order) => {
        allOrders.push({
          id: order.id,
          type: 'chatgpt',
          status: order.status,
          created_at: order.created_at,
          details: order.gmail || undefined,
        });
      });

      canvaRes.data?.forEach((request) => {
        allOrders.push({
          id: request.id,
          type: 'canva',
          status: request.status,
          created_at: request.created_at,
          details: request.gmail,
        });
      });

      depositsRes.data?.forEach((deposit) => {
        allOrders.push({
          id: deposit.id,
          type: 'deposit',
          status: deposit.status,
          created_at: deposit.created_at,
          amount: deposit.amount,
          details: (deposit.payment_methods as any)?.name,
        });
      });

      // Sort by date
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(allOrders);
      setLoading(false);
    };

    fetchUserAndOrders();
  }, [telegramId]);

  const getDisplayName = () => {
    if (!user) return 'Unknown';
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.username) return `@${user.username}`;
    return `User ${user.telegram_id}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chatgpt': return <ShoppingCart className="h-4 w-4" />;
      case 'canva': return <Palette className="h-4 w-4" />;
      case 'deposit': return <CreditCard className="h-4 w-4" />;
      default: return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chatgpt': return 'ChatGPT Order';
      case 'canva': return 'Canva Pro Request';
      case 'deposit': return 'Deposit';
      default: return 'Order';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const orderStats = {
    total: orders.length,
    chatgpt: orders.filter(o => o.type === 'chatgpt').length,
    canva: orders.filter(o => o.type === 'canva').length,
    deposits: orders.filter(o => o.type === 'deposit').length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-muted-foreground">User not found</p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">User Profile</h1>
          </div>

          {/* User Info Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold ${
                  user.is_banned 
                    ? 'bg-destructive/20 text-destructive' 
                    : 'bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'
                }`}>
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
                {user.is_banned && (
                  <Ban className="absolute -bottom-1 -right-1 h-6 w-6 text-destructive bg-background rounded-full p-0.5" />
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">{getDisplayName()}</h2>
                    {user.is_banned && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                  </div>
                  {user.username && (
                    <p className="text-muted-foreground">@{user.username}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ID: {user.telegram_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{user.balance} Credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Active {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{orderStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{orderStats.chatgpt}</p>
              <p className="text-xs text-muted-foreground">ChatGPT</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-purple-500">{orderStats.canva}</p>
              <p className="text-xs text-muted-foreground">Canva</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{orderStats.deposits}</p>
              <p className="text-xs text-muted-foreground">Deposits</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{orderStats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-status-delivered">{orderStats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>

          {/* Order History */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Order History</h3>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders found</p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-4 rounded-lg bg-muted/50 p-4"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        order.type === 'chatgpt' ? 'bg-blue-500/20 text-blue-500' :
                        order.type === 'canva' ? 'bg-purple-500/20 text-purple-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {getTypeIcon(order.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{getTypeLabel(order.type)}</p>
                          <Badge variant={getStatusVariant(order.status)} className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.type === 'deposit' && order.amount && `৳${order.amount} via `}
                          {order.details || 'No details'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
}
