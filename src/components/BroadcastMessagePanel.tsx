import { useState } from 'react';
import { useTelegramUsers, TelegramUser } from '@/hooks/useTelegramUsers';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export function BroadcastMessagePanel() {
  const { users, loading: usersLoading } = useTelegramUsers();
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const activeUsers = users.filter(u => !u.is_banned);

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (activeUsers.length === 0) {
      toast.error('No active users to send message');
      return;
    }

    setSending(true);
    setProgress(0);
    setSuccessCount(0);
    setFailCount(0);

    let success = 0;
    let fail = 0;

    for (let i = 0; i < activeUsers.length; i++) {
      const user = activeUsers[i];
      try {
        const { error } = await supabase.functions.invoke('send-telegram-message', {
          body: {
            chatId: user.telegram_id,
            message: message.trim()
          }
        });

        if (error) {
          console.error(`Failed to send to ${user.telegram_id}:`, error);
          fail++;
        } else {
          success++;
        }
      } catch (err) {
        console.error(`Error sending to ${user.telegram_id}:`, err);
        fail++;
      }

      setProgress(Math.round(((i + 1) / activeUsers.length) * 100));
      setSuccessCount(success);
      setFailCount(fail);

      // Small delay to avoid rate limiting
      if (i < activeUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setSending(false);
    setMessage('');
    
    if (fail === 0) {
      toast.success(`Message sent to all ${success} users!`);
    } else {
      toast.warning(`Sent to ${success} users, failed for ${fail} users`);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Broadcast Message</h3>
          <p className="text-xs text-muted-foreground">
            Send message to all {activeUsers.length} active users
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          disabled={sending}
          className="resize-none"
        />

        {sending && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {successCount} sent
              </span>
              <span>{progress}%</span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                {failCount} failed
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={handleBroadcast}
          disabled={sending || !message.trim() || usersLoading}
          className="w-full"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending... ({progress}%)
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send to All Users ({activeUsers.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
