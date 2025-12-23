import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCouponCodes } from '@/hooks/useCouponCodes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ticket, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export const CouponCodesPanel = () => {
  const { coupons, loading, addCoupon, updateCoupon, deleteCoupon } = useCouponCodes();
  const { t } = useLanguage();
  const [newCode, setNewCode] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCoupon = async () => {
    if (!newCode.trim()) {
      toast.error('কুপন কোড লিখুন');
      return;
    }

    const success = await addCoupon(newCode.trim(), newCredits);
    if (success) {
      toast.success('কুপন কোড যোগ হয়েছে');
      setNewCode('');
      setNewCredits(3);
      setIsAdding(false);
    } else {
      toast.error('কুপন কোড যোগ করতে ব্যর্থ');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateCoupon(id, { is_active: !isActive });
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCoupon(id);
    if (success) {
      toast.success('কুপন কোড মুছে ফেলা হয়েছে');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('কোড কপি হয়েছে');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          কুপন কোড
        </CardTitle>
        <Button
          size="sm"
          variant={isAdding ? "secondary" : "default"}
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isAdding ? 'বাতিল' : 'নতুন'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <Input
              placeholder="কুপন কোড (যেমন: BONUS2024)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            />
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="ক্রেডিট"
                value={newCredits}
                onChange={(e) => setNewCredits(parseInt(e.target.value) || 3)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">ক্রেডিট</span>
            </div>
            <Button onClick={handleAddCoupon} className="w-full">
              কুপন যোগ করুন
            </Button>
          </div>
        )}

        {coupons.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            কোনো কুপন কোড নেই
          </p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-bold text-primary">
                      {coupon.code}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyCode(coupon.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      +{coupon.credits} ক্রেডিট
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ব্যবহার: {coupon.current_uses}
                      {coupon.max_uses ? `/${coupon.max_uses}` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={() => handleToggleActive(coupon.id, coupon.is_active)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
