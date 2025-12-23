import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useTelegramMessages } from '@/hooks/useTelegramMessages';
import { Bot, Circle, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function TelegramUsersPanel() {
  const { users, activeUsers, loading } = useTelegramUsers();
  const { totalCount: messageCount } = useTelegramMessages();

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
          <h3 className="font-semibold text-foreground">Telegram Bot Users</h3>
          <p className="text-xs text-muted-foreground">
            {activeUsers.length} active now • {users.length} total
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="text-lg font-bold text-foreground">{users.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Users</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          <div>
            <p className="text-lg font-bold text-foreground">{messageCount}</p>
            <p className="text-[10px] text-muted-foreground">Messages</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[250px] overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No bot users yet
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
                {isActive(user.last_active_at) ? (
                  <span className="text-[10px] text-status-delivered font-medium uppercase tracking-wider">
                    Active
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
    </div>
  );
}
