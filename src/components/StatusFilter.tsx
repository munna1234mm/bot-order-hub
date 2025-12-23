import { cn } from '@/lib/utils';
import { OrderStatus } from '@/lib/mockData';

interface StatusFilterProps {
  activeStatus: OrderStatus | 'all';
  onStatusChange: (status: OrderStatus | 'all') => void;
  counts: Record<OrderStatus | 'all', number>;
}

const statuses: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusLabels: Record<OrderStatus | 'all', string> = {
  all: 'All Orders',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function StatusFilter({ activeStatus, onStatusChange, counts }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            activeStatus === status
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {statusLabels[status]}
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
              activeStatus === status
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-background text-foreground'
            )}
          >
            {counts[status]}
          </span>
        </button>
      ))}
    </div>
  );
}
