import { useState } from 'react';
import { useBotCommands } from '@/hooks/useBotCommands';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Terminal, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BotCommandsPanel() {
  const { commands, loading, addCommand, updateCommand, deleteCommand } = useBotCommands();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [newCommand, setNewCommand] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editResponse, setEditResponse] = useState('');

  const handleAdd = async () => {
    if (!newCommand.trim() || !newResponse.trim()) return;
    const success = await addCommand(newCommand, newResponse);
    if (success) {
      setNewCommand('');
      setNewResponse('');
      setIsAdding(false);
    }
  };

  const handleEdit = async (id: string) => {
    const success = await updateCommand(id, { response: editResponse });
    if (success) {
      setEditingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('botCommands')}</h3>
            <p className="text-xs text-muted-foreground">{commands.length} {t('command').toLowerCase()}s</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" /> {t('addCommand')}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 p-4 rounded-lg bg-muted/50 space-y-3">
          <Input
            placeholder="/command (without slash)"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
          />
          <Textarea
            placeholder="Bot reply message..."
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              <Check className="h-4 w-4 mr-1" /> {t('save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4 mr-1" /> {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('loading')}</p>
        ) : commands.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('noCommands')}</p>
        ) : (
          commands.map((cmd) => (
            <div
              key={cmd.id}
              className={cn(
                "rounded-lg bg-muted/50 p-3 transition-all",
                !cmd.is_active && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono text-primary">/{cmd.command}</code>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cmd.is_active}
                    onCheckedChange={(checked) => updateCommand(cmd.id, { is_active: checked })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(cmd.id);
                      setEditResponse(cmd.response);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteCommand(cmd.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {editingId === cmd.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editResponse}
                    onChange={(e) => setEditResponse(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(cmd.id)}>{t('save')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('cancel')}</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-2">{cmd.response}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
