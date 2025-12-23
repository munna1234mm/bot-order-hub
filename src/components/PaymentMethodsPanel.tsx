import { useState } from 'react';
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Wallet, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const paymentTypeConfig = {
  bkash: { label: 'বিকাশ', color: 'bg-pink-500', icon: '📱' },
  nagad: { label: 'নগদ', color: 'bg-orange-500', icon: '💳' },
  rocket: { label: 'রকেট', color: 'bg-purple-500', icon: '🚀' },
  binance: { label: 'Binance', color: 'bg-yellow-500', icon: '₿' }
};

export const PaymentMethodsPanel = () => {
  const { paymentMethods, isLoading, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, togglePaymentMethod } = usePaymentMethods();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bkash' as 'bkash' | 'nagad' | 'rocket' | 'binance',
    account_number: '',
    account_name: '',
    instructions: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bkash',
      account_number: '',
      account_name: '',
      instructions: '',
      is_active: true
    });
    setEditingMethod(null);
  };

  const handleSubmit = () => {
    if (editingMethod) {
      updatePaymentMethod.mutate({
        id: editingMethod.id,
        ...formData
      });
    } else {
      addPaymentMethod.mutate(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      account_number: method.account_number,
      account_name: method.account_name || '',
      instructions: method.instructions || '',
      is_active: method.is_active
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          পেমেন্ট মেথড
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              নতুন মেথড
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMethod ? 'পেমেন্ট মেথড এডিট করুন' : 'নতুন পেমেন্ট মেথড যোগ করুন'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>মেথড টাইপ</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'bkash' | 'nagad' | 'rocket' | 'binance') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">বিকাশ</SelectItem>
                    <SelectItem value="nagad">নগদ</SelectItem>
                    <SelectItem value="rocket">রকেট</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>নাম</Label>
                <Input 
                  placeholder="যেমন: বিকাশ পার্সোনাল"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>একাউন্ট নম্বর</Label>
                <Input 
                  placeholder="01XXXXXXXXX"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
              </div>
              <div>
                <Label>একাউন্ট নাম (ঐচ্ছিক)</Label>
                <Input 
                  placeholder="একাউন্ট হোল্ডারের নাম"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                />
              </div>
              <div>
                <Label>নির্দেশনা (ঐচ্ছিক)</Label>
                <Textarea 
                  placeholder="পেমেন্ট করার নির্দেশনা..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingMethod ? 'আপডেট করুন' : 'যোগ করুন'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>কোন পেমেন্ট মেথড নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const config = paymentTypeConfig[method.type];
              return (
                <div 
                  key={method.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.name}</span>
                        <Badge variant="outline" className={`${config.color} text-white text-xs`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{method.account_number}</p>
                      {method.account_name && (
                        <p className="text-xs text-muted-foreground">{method.account_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={(checked) => togglePaymentMethod.mutate({ id: method.id, is_active: checked })}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(method)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deletePaymentMethod.mutate(method.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
