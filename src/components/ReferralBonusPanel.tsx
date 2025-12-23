import { useState } from 'react';
import { useBotSettings } from '@/hooks/useBotSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Gift, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ReferralBonusPanel() {
  const { getSetting, updateSetting, loading } = useBotSettings();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [bonusValue, setBonusValue] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  // Initialize the bonus value once settings are loaded
  const currentBonus = getSetting('referral_bonus');
  if (currentBonus && !initialized) {
    setBonusValue(currentBonus);
    setInitialized(true);
  }

  const handleSave = async () => {
    const numValue = parseInt(bonusValue);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    setSaving(true);
    try {
      await updateSetting('referral_bonus', bonusValue);
      toast.success('Referral bonus updated successfully');
    } catch (error) {
      console.error('Error updating referral bonus:', error);
      toast.error('Failed to update referral bonus');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Referral Bonus Settings</h3>
          <p className="text-xs text-muted-foreground">
            Set credits for referrer & referred user
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral-bonus">Referral Bonus Credits</Label>
            <div className="flex gap-2">
              <Input
                id="referral-bonus"
                type="number"
                min="0"
                value={bonusValue}
                onChange={(e) => setBonusValue(e.target.value)}
                placeholder="Enter bonus credits"
                className="flex-1"
              />
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Both the referrer and the new user will receive this amount of credits
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Current Bonus:</span>{' '}
              {currentBonus || '0'} credits each
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
