import { useTelegramMessages } from '@/hooks/useTelegramMessages';
import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MessagesPanel() {
  const { messages, loading } = useTelegramMessages();
  const { users } = useTelegramUsers();
  const { t } = useLanguage();

  const getUserName = (telegramUserId: number) => {
    const user = users.find(u => u.telegram_id === telegramUserId);
    if (!user) return `User ${telegramUserId}`;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.username) return `@${user.username}`;
    return `User ${telegramUserId}`;
  };

  const getUserInitial = (telegramUserId: number) => {
    const name = getUserName(telegramUserId);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t('messages')}</h3>
          <p className="text-xs text-muted-foreground">
            {messages.length} {t('messages').toLowerCase()}
          </p>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('loading')}
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noMessages')}
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className="flex gap-3 rounded-lg bg-muted/50 p-3 transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold shrink-0">
                  {getUserInitial(message.telegram_user_id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getUserName(message.telegram_user_id)}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-words">
                    {message.message_text || `[${message.message_type}]`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}