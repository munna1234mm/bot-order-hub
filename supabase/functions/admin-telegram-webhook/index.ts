import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin Bot Token
const ADMIN_BOT_TOKEN = '8561569158:AAFvTLEciz6Q3l9gTMbv1PTxSzDpunw7-hk';
const ADMIN_CHAT_ID = 6787688428;

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any): Promise<void> {
  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };
  
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  console.log('Admin bot send message result:', result);
}

async function sendToUser(telegramUserId: number, text: string): Promise<boolean> {
  // Get user bot token from database
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: tokenData } = await supabase
    .from('bot_settings')
    .select('value')
    .eq('key', 'telegram_bot_token')
    .single();
  
  const userBotToken = tokenData?.value || Deno.env.get('TELEGRAM_BOT_TOKEN');
  
  if (!userBotToken) {
    console.error('User bot token not found');
    return false;
  }
  
  const url = `https://api.telegram.org/bot${userBotToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramUserId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  
  const result = await response.json();
  
  if (!result.ok && result.error_code === 403) {
    console.log(`User ${telegramUserId} blocked the bot`);
    return false;
  }
  
  return result.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const update = await req.json();
    console.log('Admin bot update:', JSON.stringify(update));

    const message = update.message;
    const callbackQuery = update.callback_query;

    // Handle callback queries (button clicks)
    if (callbackQuery) {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;
      
      // Check admin
      if (chatId !== ADMIN_CHAT_ID) {
        await sendTelegramMessage(chatId, '❌ You are not authorized to use this bot.');
        return new Response('OK', { headers: corsHeaders });
      }

      console.log('Callback data:', data);

      // Handle order actions
      if (data.startsWith('approve_chatgpt_')) {
        const orderId = data.replace('approve_chatgpt_', '');
        await sendTelegramMessage(chatId, `📝 Send credentials for order ${orderId.slice(0, 8)}...\n\nUse: /send_gpt ${orderId} gmail@example.com password123`);
      } else if (data.startsWith('reject_chatgpt_')) {
        const orderId = data.replace('reject_chatgpt_', '');
        
        // Get order info
        const { data: order } = await supabase
          .from('chatgpt_orders')
          .select('telegram_user_id')
          .eq('id', orderId)
          .single();
        
        if (order) {
          // Update order status
          await supabase
            .from('chatgpt_orders')
            .update({ status: 'rejected', processed_at: new Date().toISOString() })
            .eq('id', orderId);
          
          // Refund credits
          await supabase.rpc('increment_balance', { user_telegram_id: order.telegram_user_id, amount: 12 });
          
          // Notify user
          await sendToUser(order.telegram_user_id, '❌ Your ChatGPT order has been rejected. 12 credits have been refunded.');
          
          await sendTelegramMessage(chatId, '✅ Order rejected and 12 credits refunded.');
        }
      } else if (data.startsWith('approve_canva_')) {
        const requestId = data.replace('approve_canva_', '');
        
        const { data: request } = await supabase
          .from('canva_pro_requests')
          .select('telegram_user_id, gmail')
          .eq('id', requestId)
          .single();
        
        if (request) {
          await supabase
            .from('canva_pro_requests')
            .update({ status: 'approved', processed_at: new Date().toISOString() })
            .eq('id', requestId);
          
          // Deduct credits
          const { data: user } = await supabase
            .from('telegram_users')
            .select('balance')
            .eq('telegram_id', request.telegram_user_id)
            .single();
          
          if (user && user.balance >= 5) {
            await supabase
              .from('telegram_users')
              .update({ balance: user.balance - 5 })
              .eq('telegram_id', request.telegram_user_id);
          }
          
          await sendToUser(request.telegram_user_id, '✅ Your Canva Pro account has been created! Please check your email inbox.');
          await sendTelegramMessage(chatId, `✅ Canva Pro approved for ${request.gmail}`);
        }
      } else if (data.startsWith('reject_canva_')) {
        const requestId = data.replace('reject_canva_', '');
        
        const { data: request } = await supabase
          .from('canva_pro_requests')
          .select('telegram_user_id')
          .eq('id', requestId)
          .single();
        
        if (request) {
          await supabase
            .from('canva_pro_requests')
            .update({ status: 'rejected', processed_at: new Date().toISOString() })
            .eq('id', requestId);
          
          await sendToUser(request.telegram_user_id, '❌ Your Canva Pro request has been rejected.');
          await sendTelegramMessage(chatId, '✅ Canva Pro request rejected.');
        }
      } else if (data.startsWith('approve_deposit_')) {
        const depositId = data.replace('approve_deposit_', '');
        
        const { data: deposit } = await supabase
          .from('deposits')
          .select('telegram_user_id, amount')
          .eq('id', depositId)
          .single();
        
        if (deposit) {
          await supabase
            .from('deposits')
            .update({ status: 'approved', processed_at: new Date().toISOString() })
            .eq('id', depositId);
          
          // Add credits to user
          const { data: user } = await supabase
            .from('telegram_users')
            .select('balance')
            .eq('telegram_id', deposit.telegram_user_id)
            .single();
          
          if (user) {
            await supabase
              .from('telegram_users')
              .update({ balance: user.balance + deposit.amount })
              .eq('telegram_id', deposit.telegram_user_id);
          }
          
          await sendToUser(deposit.telegram_user_id, `✅ Your deposit of ৳${deposit.amount} has been approved! Credits added to your account.`);
          await sendTelegramMessage(chatId, `✅ Deposit of ৳${deposit.amount} approved.`);
        }
      } else if (data.startsWith('reject_deposit_')) {
        const depositId = data.replace('reject_deposit_', '');
        
        const { data: deposit } = await supabase
          .from('deposits')
          .select('telegram_user_id, amount')
          .eq('id', depositId)
          .single();
        
        if (deposit) {
          await supabase
            .from('deposits')
            .update({ status: 'rejected', processed_at: new Date().toISOString() })
            .eq('id', depositId);
          
          await sendToUser(deposit.telegram_user_id, `❌ Your deposit request of ৳${deposit.amount} has been rejected.`);
          await sendTelegramMessage(chatId, `✅ Deposit rejected.`);
        }
      }

      // Answer callback to remove loading state
      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      });

      return new Response('OK', { headers: corsHeaders });
    }

    if (!message) {
      return new Response('OK', { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    
    console.log(`Admin bot message from ${chatId}: ${text}`);

    // Check if admin
    if (chatId !== ADMIN_CHAT_ID) {
      await sendTelegramMessage(chatId, '❌ You are not authorized to use this bot.');
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle commands
    if (text === '/start') {
      await sendTelegramMessage(chatId, `🤖 <b>Admin Bot Ready!</b>\n\n<b>Commands:</b>\n/orders - View pending orders\n/deposits - View pending deposits\n/canva - View pending Canva requests\n/stats - View statistics\n/broadcast MESSAGE - Send message to all users\n/send_gpt ORDER_ID GMAIL PASSWORD - Send ChatGPT credentials\n/users - View total users`);
    }
    
    else if (text === '/orders') {
      const { data: orders } = await supabase
        .from('chatgpt_orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!orders || orders.length === 0) {
        await sendTelegramMessage(chatId, '📭 No pending ChatGPT orders.');
      } else {
        for (const order of orders) {
          const { data: user } = await supabase
            .from('telegram_users')
            .select('first_name, username')
            .eq('telegram_id', order.telegram_user_id)
            .single();
          
          const userName = user?.first_name || 'Unknown';
          const username = user?.username || 'N/A';
          
          await sendTelegramMessage(
            chatId,
            `📦 <b>ChatGPT Order</b>\n\n👤 User: ${userName} (@${username})\n🆔 TG ID: ${order.telegram_user_id}\n📅 Date: ${new Date(order.created_at).toLocaleString()}\n\n🔑 Order ID: <code>${order.id}</code>`,
            {
              inline_keyboard: [
                [
                  { text: '✅ Approve', callback_data: `approve_chatgpt_${order.id}` },
                  { text: '❌ Reject', callback_data: `reject_chatgpt_${order.id}` }
                ]
              ]
            }
          );
        }
      }
    }
    
    else if (text === '/deposits') {
      const { data: deposits } = await supabase
        .from('deposits')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!deposits || deposits.length === 0) {
        await sendTelegramMessage(chatId, '📭 No pending deposits.');
      } else {
        for (const deposit of deposits) {
          const { data: user } = await supabase
            .from('telegram_users')
            .select('first_name, username')
            .eq('telegram_id', deposit.telegram_user_id)
            .single();
          
          const userName = user?.first_name || 'Unknown';
          const username = user?.username || 'N/A';
          
          await sendTelegramMessage(
            chatId,
            `💰 <b>Deposit Request</b>\n\n👤 User: ${userName} (@${username})\n🆔 TG ID: ${deposit.telegram_user_id}\n💵 Amount: ৳${deposit.amount}\n🔢 TXN: ${deposit.transaction_id}\n📅 Date: ${new Date(deposit.created_at).toLocaleString()}`,
            {
              inline_keyboard: [
                [
                  { text: '✅ Approve', callback_data: `approve_deposit_${deposit.id}` },
                  { text: '❌ Reject', callback_data: `reject_deposit_${deposit.id}` }
                ]
              ]
            }
          );
        }
      }
    }
    
    else if (text === '/canva') {
      const { data: requests } = await supabase
        .from('canva_pro_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!requests || requests.length === 0) {
        await sendTelegramMessage(chatId, '📭 No pending Canva Pro requests.');
      } else {
        for (const request of requests) {
          const { data: user } = await supabase
            .from('telegram_users')
            .select('first_name, username')
            .eq('telegram_id', request.telegram_user_id)
            .single();
          
          const userName = user?.first_name || 'Unknown';
          const username = user?.username || 'N/A';
          
          await sendTelegramMessage(
            chatId,
            `🎨 <b>Canva Pro Request</b>\n\n👤 User: ${userName} (@${username})\n🆔 TG ID: ${request.telegram_user_id}\n📧 Gmail: ${request.gmail}\n📅 Date: ${new Date(request.created_at).toLocaleString()}`,
            {
              inline_keyboard: [
                [
                  { text: '✅ Approve', callback_data: `approve_canva_${request.id}` },
                  { text: '❌ Reject', callback_data: `reject_canva_${request.id}` }
                ]
              ]
            }
          );
        }
      }
    }
    
    else if (text === '/stats') {
      const { count: totalUsers } = await supabase
        .from('telegram_users')
        .select('*', { count: 'exact', head: true });
      
      const { count: pendingOrders } = await supabase
        .from('chatgpt_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { count: pendingDeposits } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { count: pendingCanva } = await supabase
        .from('canva_pro_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      await sendTelegramMessage(chatId, `📊 <b>Statistics</b>\n\n👥 Total Users: ${totalUsers || 0}\n📦 Pending ChatGPT Orders: ${pendingOrders || 0}\n💰 Pending Deposits: ${pendingDeposits || 0}\n🎨 Pending Canva Requests: ${pendingCanva || 0}`);
    }
    
    else if (text === '/users') {
      const { count: totalUsers } = await supabase
        .from('telegram_users')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeUsers } = await supabase
        .from('telegram_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', false);
      
      await sendTelegramMessage(chatId, `👥 <b>Users</b>\n\n📊 Total: ${totalUsers || 0}\n✅ Active: ${activeUsers || 0}\n🚫 Banned: ${(totalUsers || 0) - (activeUsers || 0)}`);
    }
    
    else if (text.startsWith('/broadcast ')) {
      const broadcastMsg = text.replace('/broadcast ', '').trim();
      
      if (!broadcastMsg) {
        await sendTelegramMessage(chatId, '❌ Please provide a message.\n\nUsage: /broadcast YOUR_MESSAGE');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await sendTelegramMessage(chatId, '📤 Starting broadcast...');
      
      const { data: users } = await supabase
        .from('telegram_users')
        .select('telegram_id')
        .eq('is_banned', false);
      
      if (!users || users.length === 0) {
        await sendTelegramMessage(chatId, '❌ No users to broadcast to.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      let success = 0;
      let failed = 0;
      
      for (const user of users) {
        const sent = await sendToUser(user.telegram_id, broadcastMsg);
        if (sent) success++;
        else failed++;
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 50));
      }
      
      await sendTelegramMessage(chatId, `✅ <b>Broadcast Complete!</b>\n\n📤 Sent: ${success}\n❌ Failed: ${failed}\n📊 Total: ${users.length}`);
    }
    
    else if (text.startsWith('/send_gpt ')) {
      const parts = text.replace('/send_gpt ', '').trim().split(' ');
      
      if (parts.length < 3) {
        await sendTelegramMessage(chatId, '❌ Usage: /send_gpt ORDER_ID GMAIL PASSWORD');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const orderId = parts[0];
      const gmail = parts[1];
      const password = parts.slice(2).join(' ');
      
      const { data: order } = await supabase
        .from('chatgpt_orders')
        .select('telegram_user_id')
        .eq('id', orderId)
        .single();
      
      if (!order) {
        await sendTelegramMessage(chatId, '❌ Order not found.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      // Update order with credentials
      await supabase
        .from('chatgpt_orders')
        .update({
          status: 'completed',
          gmail: gmail,
          password: password,
          processed_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      // Send credentials to user
      const credentialsMsg = `✅ <b>Your ChatGPT Account is Ready!</b>\n\n📧 Gmail: <code>${gmail}</code>\n🔑 Password: <code>${password}</code>\n\n⚠️ Please save these credentials securely.`;
      
      const sent = await sendToUser(order.telegram_user_id, credentialsMsg);
      
      if (sent) {
        await sendTelegramMessage(chatId, '✅ Credentials sent successfully!');
      } else {
        await sendTelegramMessage(chatId, '⚠️ Credentials saved but user may have blocked the bot.');
      }
    }
    
    else {
      await sendTelegramMessage(chatId, `🤖 <b>Unknown command</b>\n\nUse /start to see available commands.`);
    }

    return new Response('OK', { headers: corsHeaders });
  } catch (error) {
    console.error('Admin bot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
