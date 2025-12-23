import { useState } from 'react';
import { Order, OrderStatus } from '@/lib/mockData';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
}

export function OrdersTable({ orders, onSelectOrder, selectedOrderId }: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order, index) => (
            <tr
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className={cn(
                'cursor-pointer transition-colors duration-200',
                selectedOrderId === order.id
                  ? 'bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="px-6 py-4">
                <span className="font-medium text-foreground">
                  {order.orderNumber}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.telegramUsername}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {format(order.createdAt, 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-medium text-foreground">
                  ${order.total.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
