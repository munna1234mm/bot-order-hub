import { Order, OrderStatus } from '@/lib/mockData';
import { StatusBadge } from './StatusBadge';
import { Button } from './ui/button';
import { X, MapPin, MessageCircle, Package, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const statusFlow: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export function OrderDetails({ order, onClose, onUpdateStatus }: OrderDetailsProps) {
  const currentStatusIndex = statusFlow.indexOf(order.status);
  const nextStatus = statusFlow[currentStatusIndex + 1];

  return (
    <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-border bg-card shadow-2xl animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Order {order.orderNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(order.createdAt, 'MMMM d, yyyy • h:mm a')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
        {/* Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            {order.status !== 'cancelled' && order.status !== 'delivered' && nextStatus && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(order.id, nextStatus)}
              >
                Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
              </Button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Customer</h3>
          <div className="space-y-2">
            <p className="text-sm text-foreground">{order.customerName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {order.telegramUsername}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Shipping Address
          </h3>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {order.shippingAddress}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Notes</h3>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Order Timeline */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Clock className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Order Created</p>
                <p className="text-xs text-muted-foreground">
                  {format(order.createdAt, 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            </div>
            {order.updatedAt.getTime() !== order.createdAt.getTime() && (
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {format(order.updatedAt, 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="mt-6 flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
            >
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
