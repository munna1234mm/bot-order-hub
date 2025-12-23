import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { OrdersTable } from '@/components/OrdersTable';
import { OrderDetails } from '@/components/OrderDetails';
import { StatusFilter } from '@/components/StatusFilter';
import { mockOrders, Order, OrderStatus } from '@/lib/mockData';
import { Search } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.telegramUsername.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date() }
          : order
      )
    );
    setSelectedOrder(prev =>
      prev?.id === orderId
        ? { ...prev, status: newStatus, updatedAt: new Date() }
        : prev
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all orders from your Telegram bot
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <StatusFilter
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            counts={statusCounts}
          />
        </div>

        {/* Orders Table */}
        <OrdersTable
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
          selectedOrderId={selectedOrder?.id}
        />

        {filteredOrders.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground">No orders found</p>
          </div>
        )}
      </main>

      {/* Order Details Sidebar */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default Orders;
