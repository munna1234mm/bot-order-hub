import { useState } from 'react';
import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Circle, Coins, Ban, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TelegramUsersPanel() {
  const { users, activeUsers, loading } = useTelegramUsers();
  const { t } = useLanguage();
  const [banningUserId, setBanningUserId] = useState<string | null>(null);

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
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Coins className="h-3 w-3 text-primary" />
                      {user.balance || 0}
                    </div>
                    {isActive(user.last_active_at) ? (
                      <span className="text-[10px] text-status-delivered font-medium uppercase tracking-wider">
                        {t('active')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
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
