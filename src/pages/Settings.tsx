import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bell, Shield, Database, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Settings = () => {
  const [botToken, setBotToken] = useState('');
  const [notifications, setNotifications] = useState({
    newOrder: true,
    statusChange: true,
    cancelled: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure your Telegram bot and notifications
          </p>
        </div>

        <div className="max-w-2xl space-y-8">
          {/* Bot Configuration */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Bot Configuration</h2>
                <p className="text-sm text-muted-foreground">Connect your Telegram bot</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bot Token
                </label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Enter your bot token from @BotFather"
                  className="h-11 w-full rounded-lg border border-border bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Get your token from @BotFather on Telegram
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'newOrder', label: 'New Orders', desc: 'Get notified when a new order is placed' },
                { key: 'statusChange', label: 'Status Changes', desc: 'Get notified when order status changes' },
                { key: 'cancelled', label: 'Cancellations', desc: 'Get notified when an order is cancelled' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications(prev => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev],
                      }))
                    }
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-foreground transition-transform ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'left-6'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Data & Privacy</h2>
                <p className="text-sm text-muted-foreground">Manage your data settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Database className="h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
