import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CanvaProRequest {
  id: string;
  telegram_user_id: number;
  gmail: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  user?: {
    first_name: string | null;
    username: string | null;
  };
}

export const useCanvaProRequests = () => {
  const [requests, setRequests] = useState<CanvaProRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('canva_pro_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canva_pro_requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('canva_pro_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user data for each request
      if (data) {
        const requestsWithUsers = await Promise.all(
          data.map(async (req) => {
            const { data: userData } = await supabase
              .from('telegram_users')
              .select('first_name, username')
              .eq('telegram_id', req.telegram_user_id)
              .maybeSingle();
            
            return {
              ...req,
              user: userData || { first_name: null, username: null }
            };
          })
        );
        setRequests(requestsWithUsers);
      }
    } catch (error) {
      console.error('Error fetching canva pro requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, telegramUserId: number) => {
    try {
      // Get user's current balance
      const { data: userData, error: userError } = await supabase
        .from('telegram_users')
        .select('balance')
        .eq('telegram_id', telegramUserId)
        .single();

      if (userError) throw userError;

      const currentBalance = userData?.balance || 0;
      
      if (currentBalance < 5) {
        toast.error('User has insufficient balance (less than 5 credits)');
        return false;
      }

      // Deduct 5 credits from user
      const { error: balanceError } = await supabase
        .from('telegram_users')
        .update({ balance: currentBalance - 5 })
        .eq('telegram_id', telegramUserId);

      if (balanceError) throw balanceError;

      // Update request status
      const { error: requestError } = await supabase
        .from('canva_pro_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Send notification to user via edge function
      const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      if (telegramBotToken) {
        // Get user's language
        const { data: userInfo } = await supabase
          .from('telegram_users')
          .select('language')
          .eq('telegram_id', telegramUserId)
          .single();
        
        const lang = userInfo?.language || 'en';
        
        const messages: Record<string, string> = {
          en: "🎉 <b>Canva Pro (12 Month) Approved!</b>\n\n✅ Your account has been sent! Please check your Gmail inbox.\n📅 Validity: <b>12 Months</b>\n💰 5 credits have been deducted from your balance.",
          bn: "🎉 <b>Canva Pro (১২ মাস) অনুমোদিত!</b>\n\n✅ আপনার অ্যাকাউন্ট পাঠানো হয়েছে! অনুগ্রহ করে আপনার জিমেইলের ইনবক্স চেক করুন।\n📅 মেয়াদ: <b>১২ মাস</b>\n💰 আপনার ব্যালেন্স থেকে ৫ ক্রেডিট কেটে নেওয়া হয়েছে।",
          hi: "🎉 <b>Canva Pro (12 महीने) स्वीकृत!</b>\n\n✅ आपका अकाउंट भेज दिया गया है! कृपया अपना Gmail इनबॉक्स चेक करें।\n📅 वैधता: <b>12 महीने</b>\n💰 आपके बैलेंस से 5 क्रेडिट काटे गए हैं।"
        };

        try {
          await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramUserId,
              text: messages[lang] || messages.en,
              parse_mode: 'HTML'
            })
          });
        } catch (e) {
          console.error('Failed to send Telegram notification:', e);
        }
      }

      toast.success('Request approved and 5 credits deducted');
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
      return false;
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('canva_pro_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request rejected');
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
      return false;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return {
    requests,
    loading,
    approveRequest,
    rejectRequest,
    pendingCount
  };
};
