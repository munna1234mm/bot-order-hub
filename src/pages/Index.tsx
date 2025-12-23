import { Sidebar } from '@/components/Sidebar';
import { StatsCard } from '@/components/StatsCard';
import { TelegramUsersPanel } from '@/components/TelegramUsersPanel';
import { BotCommandsPanel } from '@/components/BotCommandsPanel';
import { MessagesPanel } from '@/components/MessagesPanel';
import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useTelegramMessages } from '@/hooks/useTelegramMessages';
import { Users, MessageSquare, Coins, Bot } from 'lucide-react';

const Index = () => {
  const { users, activeUsers } = useTelegramUsers();
  const { messages, totalCount: messageCount } = useTelegramMessages();

  // Calculate total balance across all users
  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your Telegram bot
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total Users"
            value={users.length}
            icon={Users}
            trend={{ value: activeUsers.length, isPositive: true }}
          />
          <StatsCard
            title="Active Now"
            value={activeUsers.length}
            icon={Bot}
            variant="primary"
          />
          <StatsCard
            title="Total Messages"
            value={messageCount}
            icon={MessageSquare}
          />
          <StatsCard
            title="Total Credits"
            value={totalBalance}
            icon={Coins}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Panel - Takes 2 columns */}
          <div className="lg:col-span-2">
            <MessagesPanel />
          </div>

          {/* Right Sidebar - Bot Stats & Commands */}
          <div className="lg:col-span-1 space-y-6">
            <TelegramUsersPanel />
            <BotCommandsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;