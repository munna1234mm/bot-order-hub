import { Sidebar } from '@/components/Sidebar';
import { mockOrders } from '@/lib/mockData';
import { User, MessageCircle, Package, DollarSign } from 'lucide-react';

const Customers = () => {
  // Extract unique customers from orders
  const customersMap = new Map<string, {
    name: string;
    username: string;
    totalOrders: number;
    totalSpent: number;
  }>();

  mockOrders.forEach(order => {
    const existing = customersMap.get(order.telegramUsername);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += order.total;
    } else {
      customersMap.set(order.telegramUsername, {
        name: order.customerName,
        username: order.telegramUsername,
        totalOrders: 1,
        totalSpent: order.total,
      });
    }
  });

  const customers = Array.from(customersMap.values());

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="mt-1 text-muted-foreground">
            View all customers who ordered through your bot
          </p>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer, index) => (
            <div
              key={customer.username}
              className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Customer Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{customer.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {customer.username}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Orders</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {customer.totalOrders}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Spent</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    ${customer.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Customers;
