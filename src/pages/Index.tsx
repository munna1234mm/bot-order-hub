import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { StatsCard } from '@/components/StatsCard';
import { OrdersTable } from '@/components/OrdersTable';
import { OrderDetails } from '@/components/OrderDetails';
import { StatusFilter } from '@/components/StatusFilter';
import { TelegramUsersPanel } from '@/components/TelegramUsersPanel';
import { BotCommandsPanel } from '@/components/BotCommandsPanel';
import { mockOrders, getOrderStats, Order, OrderStatus } from '@/lib/mockData';
import { Package, Clock, CheckCircle, DollarSign } from 'lucide-react';

const Index = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');

  const stats = getOrderStats();

  const filteredOrders = activeStatus === 'all'
    ? orders
    : orders.filter(o => o.status === activeStatus);

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

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your Telegram bot orders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Orders"
                value={stats.totalOrders}
                icon={Package}
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="Pending"
                value={stats.pendingOrders}
                icon={Clock}
              />
              <StatsCard
                title="Completed"
                value={stats.completedOrders}
                icon={CheckCircle}
              />
              <StatsCard
                title="Revenue"
                value={`$${stats.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                variant="primary"
                trend={{ value: 8, isPositive: true }}
              />
            </div>

            {/* Orders Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
            </div>

            {/* Status Filter */}
            <StatusFilter
              activeStatus={activeStatus}
              onStatusChange={setActiveStatus}
              counts={statusCounts}
            />

            {/* Orders Table */}
            <OrdersTable
              orders={filteredOrders}
              onSelectOrder={setSelectedOrder}
              selectedOrderId={selectedOrder?.id}
            />
          </div>

          {/* Right Sidebar - Bot Stats & Commands */}
          <div className="lg:col-span-1 space-y-6">
            <TelegramUsersPanel />
            <BotCommandsPanel />
          </div>
        </div>
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

export default Index;
