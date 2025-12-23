import { usePresence } from '@/hooks/usePresence';
import { Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnlineUsersPanel() {
  const { onlineUsers } = usePresence();

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Live Users</h3>
          <p className="text-xs text-muted-foreground">
            {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No users online
          </p>
        ) : (
          onlineUsers.map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-all duration-300 animate-slide-in",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-status-delivered text-status-delivered" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <span className="text-[10px] text-status-delivered font-medium uppercase tracking-wider">
                Live
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
