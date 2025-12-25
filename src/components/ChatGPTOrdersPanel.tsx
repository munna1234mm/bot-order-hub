import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Check, X, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ChatGPTOrder {
  id: string;
  telegram_user_id: number;
  status: string;
  gmail: string | null;
  password: string | null;
  admin_message: string | null;
  created_at: string;
  processed_at: string | null;
  user?: {
    first_name: string | null;
    username: string | null;
  };
}

export function ChatGPTOrdersPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [orders, setOrders] = useState<ChatGPTOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChatGPTOrder | null>(null);
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('chatgpt-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatgpt_orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('chatgpt_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    // Fetch user details for each order
    const ordersWithUsers = await Promise.all(
      (data || []).map(async (order) => {
        const { data: userData } = await supabase
          .from('telegram_users')
          .select('first_name, username')
          .eq('telegram_id', order.telegram_user_id)
          .maybeSingle();

        return {
          ...order,
          user: userData || undefined
        };
      })
    );

    setOrders(ordersWithUsers);
    setLoading(false);
  };

  const openSendDialog = (order: ChatGPTOrder) => {
    setSelectedOrder(order);
    setGmail(order.gmail || "");
    setPassword(order.password || "");
    setAdminMessage(order.admin_message || "");
    setSendDialogOpen(true);
  };

  const handleSendCredentials = async () => {
    if (!selectedOrder) return;
    if (!gmail.trim() || !password.trim()) {
      toast.error("Gmail এবং Password উভয়ই প্রয়োজন");
      return;
    }

    setSending(true);

    try {
      // Build message
      let message = `🎉 <b>ChatGPT Plus (17 Month) অ্যাকাউন্ট!</b>\n\n📧 Gmail: <b>${gmail}</b>\n🔑 Password: <b>${password}</b>`;
      
      if (adminMessage.trim()) {
        message += `\n\n📝 <b>Note:</b> ${adminMessage}`;
      }

      // Send message to user
      const { error: sendError } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          chatId: selectedOrder.telegram_user_id,
          message
        }
      });

      if (sendError) throw sendError;

      // Update order status
      const { error: updateError } = await supabase
        .from('chatgpt_orders')
        .update({
          status: 'completed',
          gmail,
          password,
          admin_message: adminMessage.trim() || null,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      toast.success("Credentials পাঠানো হয়েছে!");
      setSendDialogOpen(false);
      setGmail("");
      setPassword("");
      setAdminMessage("");
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error sending credentials:', error);
      toast.error("পাঠাতে সমস্যা হয়েছে");
    } finally {
      setSending(false);
    }
  };

  const handleReject = async (order: ChatGPTOrder) => {
    try {
      // Refund credits
      const { data: user } = await supabase
        .from('telegram_users')
        .select('balance')
        .eq('telegram_id', order.telegram_user_id)
        .single();

      if (user) {
        await supabase
          .from('telegram_users')
          .update({ balance: (user.balance || 0) + 6 })
          .eq('telegram_id', order.telegram_user_id);
      }

      // Update order status
      await supabase
        .from('chatgpt_orders')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      // Notify user
      await supabase.functions.invoke('send-telegram-message', {
        body: {
          chatId: order.telegram_user_id,
          message: "❌ আপনার ChatGPT Plus অর্ডার বাতিল হয়েছে। 6 ক্রেডিট ফেরত দেওয়া হয়েছে।"
        }
      });

      toast.success("অর্ডার বাতিল করা হয়েছে এবং ক্রেডিট ফেরত দেওয়া হয়েছে");
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error("বাতিল করতে সমস্যা হয়েছে");
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <>
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">ChatGPT Plus Orders</CardTitle>
              {pendingOrders.length > 0 && (
                <Badge variant="destructive">{pendingOrders.length} pending</Badge>
              )}
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">কোনো অর্ডার নেই</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {order.user?.first_name || 'Unknown'}
                          </span>
                          {order.user?.username && (
                            <span className="text-sm text-muted-foreground">
                              @{order.user.username}
                            </span>
                          )}
                          <Badge variant={
                            order.status === 'pending' ? 'default' :
                            order.status === 'completed' ? 'secondary' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ID: {order.telegram_user_id} | {new Date(order.created_at).toLocaleString()}
                        </div>
                        {order.gmail && (
                          <div className="text-sm mt-1">
                            📧 {order.gmail}
                          </div>
                        )}
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => openSendDialog(order)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(order)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ChatGPT Credentials পাঠান</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gmail">Gmail</Label>
              <Input
                id="gmail"
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="example@gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            <div>
              <Label htmlFor="message">Additional Message (Optional)</Label>
              <Textarea
                id="message"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="যেমন: এই অ্যাকাউন্ট শেয়ার করবেন না..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCredentials} disabled={sending}>
              {sending ? "Sending..." : "Send to User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
