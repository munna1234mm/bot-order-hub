import { Sidebar } from '@/components/Sidebar';
import { StatsCard } from '@/components/StatsCard';
import { TelegramUsersPanel } from '@/components/TelegramUsersPanel';
import { BotCommandsPanel } from '@/components/BotCommandsPanel';
import { CouponCodesPanel } from '@/components/CouponCodesPanel';
import { PaymentMethodsPanel } from '@/components/PaymentMethodsPanel';
import { DepositsPanel } from '@/components/DepositsPanel';
import { MessagesPanel } from '@/components/MessagesPanel';
import { LanguageSelector } from '@/components/LanguageSelector';
import AdminTelegramIdsPanel from '@/components/AdminTelegramIdsPanel';
import { CanvaProRequestsPanel } from '@/components/CanvaProRequestsPanel';
import { ServicesPanel } from '@/components/ServicesPanel';
import { ReferralBonusPanel } from '@/components/ReferralBonusPanel';
import { BroadcastMessagePanel } from '@/components/BroadcastMessagePanel';
import { useTelegramUsers } from '@/hooks/useTelegramUsers';
import { useTelegramMessages } from '@/hooks/useTelegramMessages';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, MessageSquare, Coins, Bot } from 'lucide-react';

const Index = () => {
  const { users, activeUsers } = useTelegramUsers();
  const { messages, totalCount: messageCount } = useTelegramMessages();
  const { t } = useLanguage();

  // Calculate total balance across all users
  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('dashboard')}</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your Telegram bot
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title={t('totalUsers')}
            value={users.length}
            icon={Users}
            trend={{ value: activeUsers.length, isPositive: true }}
          />
          <StatsCard
            title={t('activeUsers')}
            value={activeUsers.length}
            icon={Bot}
            variant="primary"
          />
          <StatsCard
            title={t('totalMessages')}
            value={messageCount}
            icon={MessageSquare}
          />
          <StatsCard
            title={t('credits')}
            value={totalBalance}
            icon={Coins}
          />
        </div>

        {/* Deposits Panel */}
        <div className="mb-6">
          <DepositsPanel />
        </div>

        {/* Canva Pro Requests Panel */}
        <div className="mb-6">
          <CanvaProRequestsPanel />
        </div>

        {/* Services Panel */}
        <div className="mb-6">
          <ServicesPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Panel - Takes 2 columns */}
          <div className="lg:col-span-2">
            <MessagesPanel />
          </div>

          {/* Right Sidebar - Bot Stats & Commands */}
          <div className="lg:col-span-1 space-y-6">
            <BroadcastMessagePanel />
            <AdminTelegramIdsPanel />
            <ReferralBonusPanel />
            <TelegramUsersPanel />
            <PaymentMethodsPanel />
            <CouponCodesPanel />
            <BotCommandsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;