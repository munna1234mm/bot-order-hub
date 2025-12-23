import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Circle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TelegramUsersPanel() {
  const { users, activeUsers, loading } = useTelegramUsers();
  const { t } = useLanguage();

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

      <ScrollArea className="h-[250px]">
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
                  "flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-all duration-300 animate-slide-in",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                    {getDisplayName(user).charAt(0).toUpperCase()}
                  </div>
                  <Circle 
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3",
                      isActive(user.last_active_at) 
                        ? "fill-status-delivered text-status-delivered" 
                        : "fill-muted-foreground text-muted-foreground"
                    )} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getDisplayName(user)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                  </p>
                </div>
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
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}