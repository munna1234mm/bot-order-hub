import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin Bot Token
const ADMIN_BOT_TOKEN = '8561569158:AAFvTLEciz6Q3l9gTMbv1PTxSzDpunw7-hk';

// Check if a chat ID is an authorized admin
async function isAuthorizedAdmin(supabase: any, chatId: number): Promise<boolean> {
  const { data } = await supabase
    .from('admin_telegram_ids')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('is_active', true)
    .maybeSingle();
  
  return !!data;
}

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
      
      const isAdmin = await isAuthorizedAdmin(supabase, chatId);
      if (!isAdmin) {
        await sendTelegramMessage(chatId, '❌ You are not authorized.');
        return new Response('OK', { headers: corsHeaders });
      }

      console.log('Callback data:', data);

      // ChatGPT Order Actions
      if (data.startsWith('approve_chatgpt_')) {
        const orderId = data.replace('approve_chatgpt_', '');
        await sendTelegramMessage(chatId, `📝 Send credentials:\n\n/send_gpt ${orderId} gmail@example.com password123`);
      } 
      else if (data.startsWith('reject_chatgpt_')) {
        const orderId = data.replace('reject_chatgpt_', '');
        const { data: order } = await supabase.from('chatgpt_orders').select('telegram_user_id').eq('id', orderId).single();
        
        if (order) {
          await supabase.from('chatgpt_orders').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', orderId);
          const { data: user } = await supabase.from('telegram_users').select('balance').eq('telegram_id', order.telegram_user_id).single();
          if (user) {
            await supabase.from('telegram_users').update({ balance: user.balance + 12 }).eq('telegram_id', order.telegram_user_id);
          }
          await sendToUser(order.telegram_user_id, '❌ Your ChatGPT order was rejected. 12 credits refunded.');
          await sendTelegramMessage(chatId, '✅ Order rejected, 12 credits refunded.');
        }
      }
      // Canva Pro Actions
      else if (data.startsWith('approve_canva_')) {
        const requestId = data.replace('approve_canva_', '');
        const { data: request } = await supabase.from('canva_pro_requests').select('telegram_user_id, gmail').eq('id', requestId).single();
        
        if (request) {
          await supabase.from('canva_pro_requests').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', requestId);
          const { data: user } = await supabase.from('telegram_users').select('balance').eq('telegram_id', request.telegram_user_id).single();
          if (user && user.balance >= 5) {
            await supabase.from('telegram_users').update({ balance: user.balance - 5 }).eq('telegram_id', request.telegram_user_id);
          }
          await sendToUser(request.telegram_user_id, '✅ Your Canva Pro account is ready! Check your email.');
          await sendTelegramMessage(chatId, `✅ Canva Pro approved for ${request.gmail}`);
        }
      }
      else if (data.startsWith('reject_canva_')) {
        const requestId = data.replace('reject_canva_', '');
        const { data: request } = await supabase.from('canva_pro_requests').select('telegram_user_id').eq('id', requestId).single();
        
        if (request) {
          await supabase.from('canva_pro_requests').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', requestId);
          await sendToUser(request.telegram_user_id, '❌ Your Canva Pro request was rejected.');
          await sendTelegramMessage(chatId, '✅ Canva Pro request rejected.');
        }
      }
      // Deposit Actions - Show credit selection options
      else if (data.startsWith('approve_deposit_')) {
        const depositId = data.replace('approve_deposit_', '');
        const { data: deposit } = await supabase.from('deposits').select('telegram_user_id, amount').eq('id', depositId).single();
        
        if (deposit) {
          // Show credit amount selection options
          const defaultCredits = Math.floor(deposit.amount);
          await sendTelegramMessage(chatId, `💰 <b>Select Credit Amount</b>\n\nDeposit: ৳${deposit.amount}\nDefault: ${defaultCredits} credits\n\nChoose credits to add:`, {
            inline_keyboard: [
              [
                { text: `${Math.floor(defaultCredits * 0.5)} 💳`, callback_data: `confirm_deposit_${depositId}_${Math.floor(defaultCredits * 0.5)}` },
                { text: `${defaultCredits} 💳`, callback_data: `confirm_deposit_${depositId}_${defaultCredits}` },
                { text: `${Math.floor(defaultCredits * 1.5)} 💳`, callback_data: `confirm_deposit_${depositId}_${Math.floor(defaultCredits * 1.5)}` },
              ],
              [
                { text: `${defaultCredits * 2} 💳`, callback_data: `confirm_deposit_${depositId}_${defaultCredits * 2}` },
                { text: '✏️ Custom', callback_data: `custom_deposit_${depositId}` },
              ],
              [
                { text: '❌ Cancel', callback_data: `cancel_deposit_${depositId}` },
              ]
            ]
          });
        }
      }
      // Confirm deposit with selected credits
      else if (data.startsWith('confirm_deposit_')) {
        const parts = data.replace('confirm_deposit_', '').split('_');
        const depositId = parts[0];
        const credits = parseInt(parts[1]);
        
        const { data: deposit } = await supabase.from('deposits').select('telegram_user_id, amount, status').eq('id', depositId).single();
        
        if (deposit && deposit.status === 'pending') {
          await supabase.from('deposits').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', depositId);
          const { data: user } = await supabase.from('telegram_users').select('balance').eq('telegram_id', deposit.telegram_user_id).single();
          if (user) {
            await supabase.from('telegram_users').update({ balance: user.balance + credits }).eq('telegram_id', deposit.telegram_user_id);
          }
          await sendToUser(deposit.telegram_user_id, `✅ Deposit of ৳${deposit.amount} approved!\n\n💰 ${credits} credits added to your balance.`);
          await sendTelegramMessage(chatId, `✅ Deposit ৳${deposit.amount} approved.\n💰 ${credits} credits added to user.`);
        } else {
          await sendTelegramMessage(chatId, '❌ Deposit already processed or not found.');
        }
      }
      // Custom credit input prompt
      else if (data.startsWith('custom_deposit_')) {
        const depositId = data.replace('custom_deposit_', '');
        await sendTelegramMessage(chatId, `📝 Send custom credits:\n\n/approve_deposit ${depositId} AMOUNT\n\nExample: /approve_deposit ${depositId} 50`);
      }
      // Cancel deposit selection
      else if (data.startsWith('cancel_deposit_')) {
        await sendTelegramMessage(chatId, '❌ Deposit approval cancelled.');
      }
      else if (data.startsWith('reject_deposit_')) {
        const depositId = data.replace('reject_deposit_', '');
        const { data: deposit } = await supabase.from('deposits').select('telegram_user_id, amount').eq('id', depositId).single();
        
        if (deposit) {
          await supabase.from('deposits').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', depositId);
          await sendToUser(deposit.telegram_user_id, `❌ Deposit request of ৳${deposit.amount} was rejected.`);
          await sendTelegramMessage(chatId, '✅ Deposit rejected.');
        }
      }
      // Ban/Unban Actions
      else if (data.startsWith('ban_user_')) {
        const tgId = parseInt(data.replace('ban_user_', ''));
        await supabase.from('telegram_users').update({ is_banned: true, banned_at: new Date().toISOString() }).eq('telegram_id', tgId);
        await sendTelegramMessage(chatId, `🚫 User ${tgId} banned.`);
      }
      else if (data.startsWith('unban_user_')) {
        const tgId = parseInt(data.replace('unban_user_', ''));
        await supabase.from('telegram_users').update({ is_banned: false, banned_at: null }).eq('telegram_id', tgId);
        await sendTelegramMessage(chatId, `✅ User ${tgId} unbanned.`);
      }
      // Coupon Actions
      else if (data.startsWith('toggle_coupon_')) {
        const couponId = data.replace('toggle_coupon_', '');
        const { data: coupon } = await supabase.from('coupon_codes').select('is_active').eq('id', couponId).single();
        if (coupon) {
          await supabase.from('coupon_codes').update({ is_active: !coupon.is_active }).eq('id', couponId);
          await sendTelegramMessage(chatId, `✅ Coupon ${coupon.is_active ? 'deactivated' : 'activated'}.`);
        }
      }
      else if (data.startsWith('delete_coupon_')) {
        const couponId = data.replace('delete_coupon_', '');
        await supabase.from('coupon_codes').delete().eq('id', couponId);
        await sendTelegramMessage(chatId, '✅ Coupon deleted.');
      }
      // Command Actions
      else if (data.startsWith('toggle_cmd_')) {
        const cmdId = data.replace('toggle_cmd_', '');
        const { data: cmd } = await supabase.from('bot_commands').select('is_active').eq('id', cmdId).single();
        if (cmd) {
          await supabase.from('bot_commands').update({ is_active: !cmd.is_active }).eq('id', cmdId);
          await sendTelegramMessage(chatId, `✅ Command ${cmd.is_active ? 'disabled' : 'enabled'}.`);
        }
      }
      else if (data.startsWith('delete_cmd_')) {
        const cmdId = data.replace('delete_cmd_', '');
        await supabase.from('bot_commands').delete().eq('id', cmdId);
        await sendTelegramMessage(chatId, '✅ Command deleted.');
      }
      // Payment Method Actions
      else if (data.startsWith('toggle_pm_')) {
        const pmId = data.replace('toggle_pm_', '');
        const { data: pm } = await supabase.from('payment_methods').select('is_active').eq('id', pmId).single();
        if (pm) {
          await supabase.from('payment_methods').update({ is_active: !pm.is_active }).eq('id', pmId);
          await sendTelegramMessage(chatId, `✅ Payment method ${pm.is_active ? 'disabled' : 'enabled'}.`);
        }
      }
      else if (data.startsWith('delete_pm_')) {
        const pmId = data.replace('delete_pm_', '');
        await supabase.from('payment_methods').delete().eq('id', pmId);
        await sendTelegramMessage(chatId, '✅ Payment method deleted.');
      }

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

    const isAdmin = await isAuthorizedAdmin(supabase, chatId);
    if (!isAdmin) {
      await sendTelegramMessage(chatId, '❌ You are not authorized to use this bot.\n\nContact the admin to add your Telegram ID.');
      return new Response('OK', { headers: corsHeaders });
    }

    // ========== COMMANDS ==========
    
    if (text === '/start' || text === '/help') {
      await sendTelegramMessage(chatId, `🤖 <b>Admin Bot - All Commands</b>

📊 <b>Dashboard</b>
/stats - Statistics overview
/users - User management
/user ID - View user profile
/messages - Recent messages

📦 <b>Orders</b>
/orders - Pending ChatGPT orders
/canva - Pending Canva requests
/deposits - Pending deposits

💳 <b>Settings</b>
/coupons - Manage coupons
/commands - Bot commands
/payments - Payment methods
/referral - Referral bonus
/admins - Admin IDs

📤 <b>User Actions</b>
/ban ID - Ban user
/unban ID - Unban user
/addcredit ID AMOUNT - Add credits
/removecredit ID AMOUNT - Remove credits
/broadcast MSG - Broadcast message

📦 <b>Order Actions</b>
/send_gpt ORDER_ID GMAIL PASS - Send GPT creds
/approve_deposit ID CREDITS - Approve deposit

➕ <b>Add New</b>
/addcoupon CODE CREDITS - Add coupon
/addcmd /CMD RESPONSE - Add bot command
/editcmd /CMD RESPONSE - Edit command
/delcmd /CMD - Delete command
/togglecmd /CMD - Toggle command
/addpayment NAME TYPE NUMBER - Add payment
/addadmin CHAT_ID NAME - Add admin`);
    }

    // ========== STATS ==========
    else if (text === '/stats') {
      const { count: totalUsers } = await supabase.from('telegram_users').select('*', { count: 'exact', head: true });
      const { count: activeUsers } = await supabase.from('telegram_users').select('*', { count: 'exact', head: true }).eq('is_banned', false);
      const { count: pendingOrders } = await supabase.from('chatgpt_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingDeposits } = await supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingCanva } = await supabase.from('canva_pro_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: totalCoupons } = await supabase.from('coupon_codes').select('*', { count: 'exact', head: true }).eq('is_active', true);
      
      await sendTelegramMessage(chatId, `📊 <b>Dashboard Statistics</b>

👥 <b>Users</b>
Total: ${totalUsers || 0}
Active: ${activeUsers || 0}
Banned: ${(totalUsers || 0) - (activeUsers || 0)}

⏳ <b>Pending</b>
ChatGPT Orders: ${pendingOrders || 0}
Deposits: ${pendingDeposits || 0}
Canva Requests: ${pendingCanva || 0}

🎫 Active Coupons: ${totalCoupons || 0}`);
    }

    // ========== USERS ==========
    else if (text === '/users') {
      const { data: users } = await supabase
        .from('telegram_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!users || users.length === 0) {
        await sendTelegramMessage(chatId, '📭 No users found.');
      } else {
        let msg = '👥 <b>Recent Users</b>\n\n';
        for (const u of users) {
          const status = u.is_banned ? '🚫' : '✅';
          msg += `${status} <b>${u.first_name || 'Unknown'}</b> (@${u.username || 'N/A'})\n`;
          msg += `   ID: <code>${u.telegram_id}</code> | 💰 ${u.balance}\n\n`;
        }
        msg += `\n/user TELEGRAM_ID - View user details`;
        await sendTelegramMessage(chatId, msg);
      }
    }

    else if (text.startsWith('/user ')) {
      const tgId = parseInt(text.replace('/user ', '').trim());
      if (isNaN(tgId)) {
        await sendTelegramMessage(chatId, '❌ Invalid Telegram ID.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const { data: user } = await supabase.from('telegram_users').select('*').eq('telegram_id', tgId).single();
      
      if (!user) {
        await sendTelegramMessage(chatId, '❌ User not found.');
      } else {
        await sendTelegramMessage(chatId, `👤 <b>User Details</b>

📛 Name: ${user.first_name || ''} ${user.last_name || ''}
👤 Username: @${user.username || 'N/A'}
🆔 Telegram ID: <code>${user.telegram_id}</code>
💰 Balance: ${user.balance} credits
🌐 Language: ${user.language}
👥 Referrals: ${user.referral_count || 0}
📅 Joined: ${new Date(user.created_at).toLocaleDateString()}
🕐 Last Active: ${new Date(user.last_active_at).toLocaleString()}
${user.is_banned ? '🚫 BANNED' : '✅ Active'}`, {
          inline_keyboard: [
            [
              { text: user.is_banned ? '✅ Unban' : '🚫 Ban', callback_data: user.is_banned ? `unban_user_${tgId}` : `ban_user_${tgId}` }
            ]
          ]
        });
      }
    }

    // ========== MESSAGES ==========
    else if (text === '/messages') {
      const { data: messages } = await supabase
        .from('telegram_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (!messages || messages.length === 0) {
        await sendTelegramMessage(chatId, '📭 No messages found.');
      } else {
        let msg = '💬 <b>Recent Messages</b>\n\n';
        for (const m of messages) {
          const { data: user } = await supabase.from('telegram_users').select('first_name, username').eq('telegram_id', m.telegram_user_id).single();
          const name = user?.first_name || 'Unknown';
          msg += `<b>${name}</b>: ${m.message_text?.slice(0, 50) || '[no text]'}${m.message_text && m.message_text.length > 50 ? '...' : ''}\n`;
        }
        await sendTelegramMessage(chatId, msg);
      }
    }

    // ========== ORDERS ==========
    else if (text === '/orders') {
      const { data: orders } = await supabase.from('chatgpt_orders').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
      
      if (!orders || orders.length === 0) {
        await sendTelegramMessage(chatId, '📭 No pending ChatGPT orders.');
      } else {
        for (const order of orders) {
          const { data: user } = await supabase.from('telegram_users').select('first_name, username').eq('telegram_id', order.telegram_user_id).single();
          await sendTelegramMessage(chatId, `📦 <b>ChatGPT Order</b>

👤 ${user?.first_name || 'Unknown'} (@${user?.username || 'N/A'})
🆔 TG ID: <code>${order.telegram_user_id}</code>
📅 ${new Date(order.created_at).toLocaleString()}

🔑 <code>${order.id}</code>`, {
            inline_keyboard: [[
              { text: '✅ Approve', callback_data: `approve_chatgpt_${order.id}` },
              { text: '❌ Reject', callback_data: `reject_chatgpt_${order.id}` }
            ]]
          });
        }
      }
    }

    else if (text === '/canva') {
      const { data: requests } = await supabase.from('canva_pro_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
      
      if (!requests || requests.length === 0) {
        await sendTelegramMessage(chatId, '📭 No pending Canva requests.');
      } else {
        for (const req of requests) {
          const { data: user } = await supabase.from('telegram_users').select('first_name, username').eq('telegram_id', req.telegram_user_id).single();
          await sendTelegramMessage(chatId, `🎨 <b>Canva Pro Request</b>

👤 ${user?.first_name || 'Unknown'} (@${user?.username || 'N/A'})
📧 Gmail: <code>${req.gmail}</code>
📅 ${new Date(req.created_at).toLocaleString()}`, {
            inline_keyboard: [[
              { text: '✅ Approve', callback_data: `approve_canva_${req.id}` },
              { text: '❌ Reject', callback_data: `reject_canva_${req.id}` }
            ]]
          });
        }
      }
    }

    else if (text === '/deposits') {
      const { data: deposits } = await supabase.from('deposits').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
      
      if (!deposits || deposits.length === 0) {
        await sendTelegramMessage(chatId, '📭 No pending deposits.');
      } else {
        for (const dep of deposits) {
          const { data: user } = await supabase.from('telegram_users').select('first_name, username').eq('telegram_id', dep.telegram_user_id).single();
          await sendTelegramMessage(chatId, `💰 <b>Deposit Request</b>

👤 ${user?.first_name || 'Unknown'} (@${user?.username || 'N/A'})
💵 Amount: ৳${dep.amount}
🔢 TXN: <code>${dep.transaction_id}</code>
📅 ${new Date(dep.created_at).toLocaleString()}`, {
            inline_keyboard: [[
              { text: '✅ Approve', callback_data: `approve_deposit_${dep.id}` },
              { text: '❌ Reject', callback_data: `reject_deposit_${dep.id}` }
            ]]
          });
        }
      }
    }

    // ========== COUPONS ==========
    else if (text === '/coupons') {
      const { data: coupons } = await supabase.from('coupon_codes').select('*').order('created_at', { ascending: false }).limit(10);
      
      if (!coupons || coupons.length === 0) {
        await sendTelegramMessage(chatId, '📭 No coupons found.\n\n/addcoupon CODE CREDITS - Add new coupon');
      } else {
        for (const c of coupons) {
          await sendTelegramMessage(chatId, `🎫 <b>${c.code}</b>

💰 Credits: ${c.credits}
📊 Uses: ${c.current_uses}/${c.max_uses || '∞'}
${c.is_active ? '✅ Active' : '❌ Inactive'}`, {
            inline_keyboard: [[
              { text: c.is_active ? '❌ Disable' : '✅ Enable', callback_data: `toggle_coupon_${c.id}` },
              { text: '🗑 Delete', callback_data: `delete_coupon_${c.id}` }
            ]]
          });
        }
      }
    }

    else if (text.startsWith('/addcoupon ')) {
      const parts = text.replace('/addcoupon ', '').trim().split(' ');
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, '❌ Usage: /addcoupon CODE CREDITS [MAX_USES]');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const code = parts[0].toUpperCase();
      const credits = parseInt(parts[1]);
      const maxUses = parts[2] ? parseInt(parts[2]) : null;
      
      if (isNaN(credits)) {
        await sendTelegramMessage(chatId, '❌ Invalid credits amount.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('coupon_codes').insert({ code, credits, max_uses: maxUses });
      await sendTelegramMessage(chatId, `✅ Coupon <b>${code}</b> created!\n💰 ${credits} credits\n📊 Max uses: ${maxUses || 'Unlimited'}`);
    }

    // ========== BOT COMMANDS ==========
    else if (text === '/commands') {
      const { data: commands } = await supabase.from('bot_commands').select('*').order('command');
      
      if (!commands || commands.length === 0) {
        await sendTelegramMessage(chatId, `📭 No commands found.

<b>Add a new command:</b>
/addcmd /command Response text

<b>Example:</b>
/addcmd /hello Welcome to our bot!`);
      } else {
        let msg = `⚡ <b>Bot Commands (${commands.length})</b>\n\n`;
        for (const cmd of commands) {
          const status = cmd.is_active ? '✅' : '❌';
          msg += `${status} <b>/${cmd.command}</b>\n   📝 ${cmd.response.slice(0, 50)}${cmd.response.length > 50 ? '...' : ''}\n\n`;
        }
        msg += `<b>Manage:</b>\n/addcmd /cmd Response - Add\n/editcmd /cmd Response - Edit\n/delcmd /cmd - Delete\n/togglecmd /cmd - Toggle`;
        await sendTelegramMessage(chatId, msg);
      }
    }

    else if (text.startsWith('/delcmd ')) {
      let command = text.replace('/delcmd ', '').trim();
      if (command.startsWith('/')) {
        command = command.slice(1);
      }
      
      const { data: existing } = await supabase.from('bot_commands').select('id').eq('command', command).maybeSingle();
      if (!existing) {
        await sendTelegramMessage(chatId, `❌ Command <b>/${command}</b> not found!`);
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('bot_commands').delete().eq('command', command);
      await sendTelegramMessage(chatId, `✅ Command <b>/${command}</b> deleted!`);
    }

    else if (text.startsWith('/togglecmd ')) {
      let command = text.replace('/togglecmd ', '').trim();
      if (command.startsWith('/')) {
        command = command.slice(1);
      }
      
      const { data: cmd } = await supabase.from('bot_commands').select('id, is_active').eq('command', command).maybeSingle();
      if (!cmd) {
        await sendTelegramMessage(chatId, `❌ Command <b>/${command}</b> not found!`);
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('bot_commands').update({ is_active: !cmd.is_active }).eq('command', command);
      await sendTelegramMessage(chatId, `✅ Command <b>/${command}</b> ${cmd.is_active ? 'disabled' : 'enabled'}!`);
    }

    else if (text.startsWith('/addcmd ')) {
      const content = text.replace('/addcmd ', '').trim();
      const spaceIndex = content.indexOf(' ');
      if (spaceIndex === -1) {
        await sendTelegramMessage(chatId, '❌ Usage: /addcmd /command Response text\n\nExample: /addcmd /help This is the help message');
        return new Response('OK', { headers: corsHeaders });
      }
      
      let command = content.slice(0, spaceIndex);
      const response = content.slice(spaceIndex + 1);
      
      // Remove leading slash if present for consistent storage
      if (command.startsWith('/')) {
        command = command.slice(1);
      }
      
      // Check if command already exists
      const { data: existing } = await supabase.from('bot_commands').select('id').eq('command', command).maybeSingle();
      if (existing) {
        await sendTelegramMessage(chatId, `❌ Command <b>/${command}</b> already exists!\n\nUse /editcmd /${command} New response`);
        return new Response('OK', { headers: corsHeaders });
      }
      
      const { error } = await supabase.from('bot_commands').insert({ command, response });
      if (error) {
        console.error('Error adding command:', error);
        await sendTelegramMessage(chatId, `❌ Error adding command: ${error.message}`);
      } else {
        await sendTelegramMessage(chatId, `✅ Command <b>/${command}</b> added!\n\nUsers can now use /${command} in the bot.`);
      }
    }

    else if (text.startsWith('/editcmd ')) {
      const content = text.replace('/editcmd ', '').trim();
      const spaceIndex = content.indexOf(' ');
      if (spaceIndex === -1) {
        await sendTelegramMessage(chatId, '❌ Usage: /editcmd /command New response text\n\nExample: /editcmd /help Updated help message');
        return new Response('OK', { headers: corsHeaders });
      }
      
      let command = content.slice(0, spaceIndex);
      const response = content.slice(spaceIndex + 1);
      
      // Remove leading slash if present
      if (command.startsWith('/')) {
        command = command.slice(1);
      }
      
      const { data: existing } = await supabase.from('bot_commands').select('id').eq('command', command).maybeSingle();
      if (!existing) {
        await sendTelegramMessage(chatId, `❌ Command <b>/${command}</b> not found!\n\nUse /addcmd /${command} Response text`);
        return new Response('OK', { headers: corsHeaders });
      }
      
      const { error } = await supabase.from('bot_commands').update({ response, updated_at: new Date().toISOString() }).eq('command', command);
      if (error) {
        await sendTelegramMessage(chatId, `❌ Error updating command: ${error.message}`);
      } else {
        await sendTelegramMessage(chatId, `✅ Command <b>/${command}</b> updated!`);
      }
    }

    // ========== PAYMENT METHODS ==========
    else if (text === '/payments') {
      const { data: methods } = await supabase.from('payment_methods').select('*').order('name');
      
      if (!methods || methods.length === 0) {
        await sendTelegramMessage(chatId, '📭 No payment methods.\n\n/addpayment NAME TYPE NUMBER');
      } else {
        for (const pm of methods) {
          await sendTelegramMessage(chatId, `💳 <b>${pm.name}</b>

📱 Type: ${pm.type}
🔢 Number: <code>${pm.account_number}</code>
👤 Name: ${pm.account_name || 'N/A'}
${pm.is_active ? '✅ Active' : '❌ Inactive'}`, {
            inline_keyboard: [[
              { text: pm.is_active ? '❌ Disable' : '✅ Enable', callback_data: `toggle_pm_${pm.id}` },
              { text: '🗑 Delete', callback_data: `delete_pm_${pm.id}` }
            ]]
          });
        }
      }
    }

    else if (text.startsWith('/addpayment ')) {
      const parts = text.replace('/addpayment ', '').trim().split(' ');
      if (parts.length < 3) {
        await sendTelegramMessage(chatId, '❌ Usage: /addpayment NAME TYPE NUMBER [ACCOUNT_NAME]');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const name = parts[0];
      const type = parts[1];
      const accountNumber = parts[2];
      const accountName = parts.slice(3).join(' ') || null;
      
      await supabase.from('payment_methods').insert({ name, type, account_number: accountNumber, account_name: accountName });
      await sendTelegramMessage(chatId, `✅ Payment method <b>${name}</b> added!`);
    }

    // ========== REFERRAL SETTINGS ==========
    else if (text === '/referral') {
      const { data: setting } = await supabase.from('bot_settings').select('value').eq('key', 'referral_bonus_amount').single();
      const bonus = setting?.value || '1';
      
      await sendTelegramMessage(chatId, `🎁 <b>Referral Bonus Settings</b>

💰 Current Bonus: <b>${bonus} credits</b>

To change: /setreferral AMOUNT`);
    }

    else if (text.startsWith('/setreferral ')) {
      const amount = text.replace('/setreferral ', '').trim();
      
      const { data: existing } = await supabase.from('bot_settings').select('id').eq('key', 'referral_bonus_amount').single();
      
      if (existing) {
        await supabase.from('bot_settings').update({ value: amount }).eq('key', 'referral_bonus_amount');
      } else {
        await supabase.from('bot_settings').insert({ key: 'referral_bonus_amount', value: amount });
      }
      
      await sendTelegramMessage(chatId, `✅ Referral bonus set to <b>${amount} credits</b>!`);
    }

    // ========== ADMIN IDS ==========
    else if (text === '/admins') {
      const { data: admins } = await supabase.from('admin_telegram_ids').select('*').order('created_at');
      
      if (!admins || admins.length === 0) {
        await sendTelegramMessage(chatId, '📭 No admin IDs configured.\n\n/addadmin CHAT_ID NAME');
      } else {
        let msg = '👨‍💼 <b>Admin IDs</b>\n\n';
        for (const admin of admins) {
          const status = admin.is_active ? '✅' : '❌';
          msg += `${status} <b>${admin.name || 'Unnamed'}</b>\n   ID: <code>${admin.telegram_chat_id}</code>\n\n`;
        }
        msg += `/addadmin CHAT_ID NAME - Add admin\n/removeadmin CHAT_ID - Remove admin`;
        await sendTelegramMessage(chatId, msg);
      }
    }

    else if (text.startsWith('/addadmin ')) {
      const parts = text.replace('/addadmin ', '').trim().split(' ');
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, '❌ Usage: /addadmin CHAT_ID NAME');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const telegramChatId = parseInt(parts[0]);
      const name = parts.slice(1).join(' ');
      
      if (isNaN(telegramChatId)) {
        await sendTelegramMessage(chatId, '❌ Invalid Chat ID.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('admin_telegram_ids').insert({ telegram_chat_id: telegramChatId, name });
      await sendTelegramMessage(chatId, `✅ Admin <b>${name}</b> added!`);
    }

    else if (text.startsWith('/removeadmin ')) {
      const chatIdToRemove = parseInt(text.replace('/removeadmin ', '').trim());
      
      if (isNaN(chatIdToRemove)) {
        await sendTelegramMessage(chatId, '❌ Invalid Chat ID.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('admin_telegram_ids').delete().eq('telegram_chat_id', chatIdToRemove);
      await sendTelegramMessage(chatId, `✅ Admin removed.`);
    }

    // ========== USER ACTIONS ==========
    else if (text.startsWith('/ban ')) {
      const tgId = parseInt(text.replace('/ban ', '').trim());
      if (isNaN(tgId)) {
        await sendTelegramMessage(chatId, '❌ Usage: /ban TELEGRAM_ID');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('telegram_users').update({ is_banned: true, banned_at: new Date().toISOString() }).eq('telegram_id', tgId);
      await sendTelegramMessage(chatId, `🚫 User ${tgId} banned.`);
    }

    else if (text.startsWith('/unban ')) {
      const tgId = parseInt(text.replace('/unban ', '').trim());
      if (isNaN(tgId)) {
        await sendTelegramMessage(chatId, '❌ Usage: /unban TELEGRAM_ID');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('telegram_users').update({ is_banned: false, banned_at: null }).eq('telegram_id', tgId);
      await sendTelegramMessage(chatId, `✅ User ${tgId} unbanned.`);
    }

    else if (text.startsWith('/addcredit ')) {
      const parts = text.replace('/addcredit ', '').trim().split(' ');
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, '❌ Usage: /addcredit TELEGRAM_ID AMOUNT');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const tgId = parseInt(parts[0]);
      const amount = parseInt(parts[1]);
      
      if (isNaN(tgId) || isNaN(amount)) {
        await sendTelegramMessage(chatId, '❌ Invalid ID or amount.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const { data: user } = await supabase.from('telegram_users').select('balance, first_name').eq('telegram_id', tgId).single();
      if (!user) {
        await sendTelegramMessage(chatId, '❌ User not found.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('telegram_users').update({ balance: user.balance + amount }).eq('telegram_id', tgId);
      await sendTelegramMessage(chatId, `✅ Added ${amount} credits to ${user.first_name || tgId}.\nNew balance: ${user.balance + amount}`);
    }

    else if (text.startsWith('/removecredit ')) {
      const parts = text.replace('/removecredit ', '').trim().split(' ');
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, '❌ Usage: /removecredit TELEGRAM_ID AMOUNT');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const tgId = parseInt(parts[0]);
      const amount = parseInt(parts[1]);
      
      if (isNaN(tgId) || isNaN(amount)) {
        await sendTelegramMessage(chatId, '❌ Invalid ID or amount.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const { data: user } = await supabase.from('telegram_users').select('balance, first_name').eq('telegram_id', tgId).single();
      if (!user) {
        await sendTelegramMessage(chatId, '❌ User not found.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const newBalance = Math.max(0, user.balance - amount);
      await supabase.from('telegram_users').update({ balance: newBalance }).eq('telegram_id', tgId);
      await sendTelegramMessage(chatId, `✅ Removed ${amount} credits from ${user.first_name || tgId}.\nNew balance: ${newBalance}`);
    }

    // ========== APPROVE DEPOSIT WITH CUSTOM CREDITS ==========
    else if (text.startsWith('/approve_deposit ')) {
      const parts = text.replace('/approve_deposit ', '').trim().split(' ');
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, '❌ Usage: /approve_deposit DEPOSIT_ID CREDITS');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const depositId = parts[0];
      const credits = parseInt(parts[1]);
      
      if (isNaN(credits) || credits <= 0) {
        await sendTelegramMessage(chatId, '❌ Invalid credits amount.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const { data: deposit } = await supabase.from('deposits').select('telegram_user_id, amount, status').eq('id', depositId).single();
      
      if (!deposit) {
        await sendTelegramMessage(chatId, '❌ Deposit not found.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      if (deposit.status !== 'pending') {
        await sendTelegramMessage(chatId, '❌ Deposit already processed.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('deposits').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', depositId);
      const { data: user } = await supabase.from('telegram_users').select('balance').eq('telegram_id', deposit.telegram_user_id).single();
      if (user) {
        await supabase.from('telegram_users').update({ balance: user.balance + credits }).eq('telegram_id', deposit.telegram_user_id);
      }
      await sendToUser(deposit.telegram_user_id, `✅ Deposit of ৳${deposit.amount} approved!\n\n💰 ${credits} credits added to your balance.`);
      await sendTelegramMessage(chatId, `✅ Deposit ৳${deposit.amount} approved.\n💰 ${credits} credits added to user.`);
    }

    // ========== SEND GPT CREDENTIALS ==========
    else if (text.startsWith('/send_gpt ')) {
      const parts = text.replace('/send_gpt ', '').trim().split(' ');
      if (parts.length < 3) {
        await sendTelegramMessage(chatId, '❌ Usage: /send_gpt ORDER_ID GMAIL PASSWORD');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const orderId = parts[0];
      const gmail = parts[1];
      const password = parts.slice(2).join(' ');
      
      const { data: order } = await supabase.from('chatgpt_orders').select('telegram_user_id').eq('id', orderId).single();
      
      if (!order) {
        await sendTelegramMessage(chatId, '❌ Order not found.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await supabase.from('chatgpt_orders').update({
        status: 'completed',
        gmail,
        password,
        processed_at: new Date().toISOString()
      }).eq('id', orderId);
      
      const sent = await sendToUser(order.telegram_user_id, `✅ <b>Your ChatGPT Account is Ready!</b>

📧 Gmail: <code>${gmail}</code>
🔑 Password: <code>${password}</code>

⚠️ Save these credentials securely.`);
      
      await sendTelegramMessage(chatId, sent ? '✅ Credentials sent!' : '⚠️ Saved but user may have blocked bot.');
    }

    // ========== BROADCAST ==========
    else if (text.startsWith('/broadcast ')) {
      const broadcastMsg = text.replace('/broadcast ', '').trim();
      
      if (!broadcastMsg) {
        await sendTelegramMessage(chatId, '❌ Usage: /broadcast YOUR_MESSAGE');
        return new Response('OK', { headers: corsHeaders });
      }
      
      await sendTelegramMessage(chatId, '📤 Broadcasting...');
      
      const { data: users } = await supabase.from('telegram_users').select('telegram_id').eq('is_banned', false);
      
      if (!users || users.length === 0) {
        await sendTelegramMessage(chatId, '❌ No users to broadcast to.');
        return new Response('OK', { headers: corsHeaders });
      }
      
      let success = 0, failed = 0;
      
      for (const user of users) {
        const sent = await sendToUser(user.telegram_id, broadcastMsg);
        if (sent) success++;
        else failed++;
        await new Promise(r => setTimeout(r, 50));
      }
      
      await sendTelegramMessage(chatId, `✅ <b>Broadcast Complete!</b>

📤 Sent: ${success}
❌ Failed: ${failed}
📊 Total: ${users.length}`);
    }

    else {
      await sendTelegramMessage(chatId, `❓ Unknown command.\n\n/help - Show all commands`);
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
