import { useDeposits } from '@/hooks/useDeposits';
import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Banknote } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'অপেক্ষমাণ', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'অনুমোদিত', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'বাতিল', color: 'bg-red-500', icon: XCircle }
};

export const DepositsPanel = () => {
  const { deposits, isLoading, approveDeposit, rejectDeposit } = useDeposits();
  const { users } = useTelegramUsers();

  const getUserInfo = (telegramId: number) => {
    const user = users.find(u => u.telegram_id === telegramId);
    return user ? (user.username || user.first_name || `ID: ${telegramId}`) : `ID: ${telegramId}`;
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          ডিপোজিট রিকোয়েস্ট
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deposits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>কোন ডিপোজিট রিকোয়েস্ট নেই</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউজার</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>মেথড</TableHead>
                  <TableHead>ট্রানজেকশন আইডি</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit) => {
                  const status = statusConfig[deposit.status];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={deposit.id}>
                      <TableCell className="font-medium">
                        {getUserInfo(deposit.telegram_user_id)}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        ৳{deposit.amount}
                      </TableCell>
                      <TableCell>
                        {deposit.payment_methods?.name || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {deposit.transaction_id}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(deposit.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {deposit.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveDeposit.mutate({
                                id: deposit.id,
                                telegram_user_id: deposit.telegram_user_id,
                                amount: deposit.amount
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              অনুমোদন
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectDeposit.mutate({ id: deposit.id })}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              বাতিল
                            </Button>
                          </div>
                        )}
                        {deposit.status !== 'pending' && (
                          <span className="text-sm text-muted-foreground">
                            {deposit.processed_at && format(new Date(deposit.processed_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
