import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAdminTelegramIds } from '@/hooks/useAdminTelegramIds';
import { UserCog, Plus, Trash2, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminTelegramIdsPanel() {
  const { admins, loading, addAdmin, deleteAdmin, toggleActive } = useAdminTelegramIds();
  const [open, setOpen] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chatId = parseInt(telegramChatId, 10);
    if (isNaN(chatId)) return;

    const success = await addAdmin(chatId, name);
    if (success) {
      setTelegramChatId('');
      setName('');
      setOpen(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Bell className="h-5 w-5" />
          Admin Notifications
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin Telegram ID</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chatId">Telegram Chat ID</Label>
                <Input
                  id="chatId"
                  type="number"
                  placeholder="e.g. 123456789"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Send /start to @userinfobot on Telegram to get your Chat ID
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g. Admin 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Add Admin
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No admin IDs configured. Add an admin to receive deposit notifications.
          </p>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <UserCog className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {admin.name || 'Unnamed Admin'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {admin.telegram_chat_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={admin.is_active}
                    onCheckedChange={() => toggleActive(admin.id, admin.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAdmin(admin.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
