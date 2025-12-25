import { useState } from 'react';
import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Circle, Coins, Ban, CheckCircle, Plus, Minus, Users, Send, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function TelegramUsersPanel() {
  const { users, activeUsers, loading } = useTelegramUsers();
  const { t } = useLanguage();
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [updatingCredits, setUpdatingCredits] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Message sending states
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageUser, setMessageUser] = useState<typeof users[0] | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const getDisplayName = (user: typeof users[0]) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.username) return `@${user.username}`;
    return `User ${user.telegram_id}`;
  };

  const isActive = (lastActiveAt: string) => {
    const lastActive = new Date(lastActiveAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActive > fiveMinutesAgo;
  };

  const handleToggleBan = async (user: typeof users[0]) => {
    setBanningUserId(user.id);
    try {
      const newBanStatus = !user.is_banned;
      const { error } = await supabase
        .from('telegram_users')
        .update({ 
          is_banned: newBanStatus,
          banned_at: newBanStatus ? new Date().toISOString() : null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(newBanStatus 
        ? `${getDisplayName(user)} has been banned` 
        : `${getDisplayName(user)} has been unbanned`
      );
    } catch (error) {
      console.error('Error toggling ban status:', error);
      toast.error('Failed to update ban status');
    } finally {
      setBanningUserId(null);
    }
  };

  const handleAdjustCredits = async (type: 'add' | 'subtract') => {
    if (!selectedUser) return;
    
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setUpdatingCredits(true);
    try {
      const newBalance = type === 'add' 
        ? selectedUser.balance + amount 
        : Math.max(0, selectedUser.balance - amount);

      const { error } = await supabase
        .from('telegram_users')
        .update({ balance: newBalance })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(
        type === 'add' 
          ? `Added ${amount} credits to ${getDisplayName(selectedUser)}` 
          : `Removed ${amount} credits from ${getDisplayName(selectedUser)}`
      );
      setCreditAmount('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Failed to adjust credits');
    } finally {
      setUpdatingCredits(false);
    }
  };

  const openCreditDialog = (user: typeof users[0]) => {
    setSelectedUser(user);
    setCreditAmount('');
    setDialogOpen(true);
  };

  const openMessageDialog = (user: typeof users[0]) => {
    setMessageUser(user);
    setMessageText('');
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageUser || !messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          chatId: messageUser.telegram_id,
          message: messageText.trim()
        }
      });

      if (error) throw error;

      toast.success(`Message sent to ${getDisplayName(messageUser)}`);
      setMessageText('');
      setMessageDialogOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t('botUsers')}</h3>
          <p className="text-xs text-muted-foreground">
            {activeUsers.length} {t('active').toLowerCase()} • {users.length} total
          </p>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('loading')}
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noUsers')}
            </p>
          ) : (
            users.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 transition-all duration-300 animate-slide-in",
                  user.is_banned ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-semibold",
                    user.is_banned 
                      ? "bg-destructive/20 text-destructive" 
                      : "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
                  )}>
                    {getDisplayName(user).charAt(0).toUpperCase()}
                  </div>
                  <Circle 
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3",
                      user.is_banned
                        ? "fill-destructive text-destructive"
                        : isActive(user.last_active_at) 
                          ? "fill-status-delivered text-status-delivered" 
                          : "fill-muted-foreground text-muted-foreground"
                    )} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      user.is_banned ? "text-destructive" : "text-foreground"
                    )}>
                      {getDisplayName(user)}
                    </p>
                    {user.is_banned && (
                      <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium">
                        BANNED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                    if (!open) setDialogOpen(false);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => openCreditDialog(user)}
                        title="Adjust credits"
                      >
                        <Coins className="h-3 w-3 mr-1 text-primary" />
                        {user.balance || 0}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[350px]">
                      <DialogHeader>
                        <DialogTitle>Adjust Credits - {getDisplayName(user)}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{user.balance || 0}</p>
                          <p className="text-sm text-muted-foreground">Current Balance</p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Amount"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => handleAdjustCredits('subtract')}
                            disabled={updatingCredits}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => handleAdjustCredits('add')}
                            disabled={updatingCredits}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Send Message Dialog */}
                  <Dialog open={messageDialogOpen && messageUser?.id === user.id} onOpenChange={(open) => {
                    if (!open) setMessageDialogOpen(false);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => openMessageDialog(user)}
                        title="Send message"
                      >
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle>Send Message to {getDisplayName(user)}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="text-sm text-muted-foreground">
                          Telegram ID: {user.telegram_id}
                        </div>
                        <Textarea
                          placeholder="Type your message here..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={4}
                          disabled={sendingMessage}
                          className="resize-none"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !messageText.trim()}
                          className="w-full"
                        >
                          {sendingMessage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant={user.is_banned ? "outline" : "destructive"}
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleBan(user)}
                    disabled={banningUserId === user.id}
                    title={user.is_banned ? "Unban user" : "Ban user"}
                  >
                    {user.is_banned ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
