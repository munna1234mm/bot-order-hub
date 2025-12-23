import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Mail, User, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useCanvaProRequests } from '@/hooks/useCanvaProRequests';
import { format } from 'date-fns';

export const CanvaProRequestsPanel = () => {
  const { requests, loading, approveRequest, rejectRequest, pendingCount } = useCanvaProRequests();
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = async (requestId: string, telegramUserId: number) => {
    await approveRequest(requestId, telegramUserId);
  };

  const handleReject = async (requestId: string) => {
    await rejectRequest(requestId);
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Canva Pro Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Canva Pro Requests
            {pendingCount > 0 && (
              <Badge className="bg-primary/20 text-primary border-0">{pendingCount} pending</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {requests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No Canva Pro requests yet
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {request.user?.first_name || request.user?.username || 'Unknown'}
                          </span>
                          {request.user?.username && (
                            <span className="text-sm text-muted-foreground">@{request.user.username}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{request.gmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                          onClick={() => handleApprove(request.id, request.telegram_user_id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};
