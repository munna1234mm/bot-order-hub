import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bell, Shield, Database, Save, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Power } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useBotSettings } from '@/hooks/useBotSettings';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { settings, loading, getSetting, updateSetting } = useBotSettings();
  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [botActive, setBotActive] = useState(true);
  const [togglingBot, setTogglingBot] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    newOrder: true,
    statusChange: true,
    cancelled: true,
  });

  // Load bot token and status from settings when available
  useEffect(() => {
    const token = getSetting('telegram_bot_token');
    if (token) {
      setBotToken(token);
    }
    const activeStatus = getSetting('bot_active');
    setBotActive(activeStatus !== 'false');
  }, [settings, getSetting]);

  const handleToggleBotStatus = async () => {
    setTogglingBot(true);
    try {
      const newStatus = !botActive;
      await updateSetting('bot_active', newStatus ? 'true' : 'false');
      setBotActive(newStatus);
      toast.success(newStatus ? 'বট চালু করা হয়েছে' : 'বট বন্ধ করা হয়েছে');
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast.error('বট স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে');
    } finally {
      setTogglingBot(false);
    }
  };

  const handleSave = async () => {
    if (!botToken.trim()) {
      toast.error('Bot token is required');
      return;
    }

    setSaving(true);
    setWebhookStatus('idle');
    setBotUsername(null);
    
    try {
      // First, setup webhook with the new token
      toast.info('Verifying bot token and setting up webhook...');
      
      const { data, error } = await supabase.functions.invoke('setup-webhook', {
        body: { botToken: botToken.trim() }
      });

      if (error) {
        throw new Error(error.message || 'Failed to setup webhook');
      }

      if (data?.error) {
        throw new Error(data.details || data.error);
      }

      // If webhook setup successful, save the token to database
      await updateSetting('telegram_bot_token', botToken.trim());
      
      setWebhookStatus('success');
      setBotUsername(data.botUsername);
      toast.success(`Bot @${data.botUsername} connected successfully with webhook!`);
    } catch (error) {
      console.error('Error saving bot token:', error);
      setWebhookStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to save bot token');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

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
              {/* Bot Status Toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Power className={`h-5 w-5 ${botActive ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      বট স্ট্যাটাস
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {botActive ? 'বট চালু আছে এবং মেসেজ রিসিভ করছে' : 'বট বন্ধ আছে, কোন মেসেজ প্রসেস হবে না'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleBotStatus}
                  disabled={togglingBot}
                  className={`relative h-7 w-14 rounded-full transition-colors ${
                    botActive ? 'bg-green-500' : 'bg-muted'
                  } disabled:opacity-50`}
                >
                  {togglingBot ? (
                    <Loader2 className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 animate-spin text-foreground" />
                  ) : (
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        botActive ? 'left-8' : 'left-1'
                      }`}
                    />
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bot Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your bot token from @BotFather"
                    className="h-11 w-full rounded-lg border border-border bg-muted/50 px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Get your token from @BotFather on Telegram. Saving will automatically set up the webhook.
                </p>
                
                {/* Webhook Status */}
                {webhookStatus === 'success' && botUsername && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Bot @{botUsername} connected with webhook active</span>
                  </div>
                )}
                {webhookStatus === 'error' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                    <XCircle className="h-4 w-4" />
                    <span>Failed to setup webhook. Please check the token and try again.</span>
                  </div>
                )}
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
          <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
