import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const update = await req.json();
    console.log('Telegram update received:', JSON.stringify(update));

    const message = update.message || update.edited_message || update.callback_query?.message;
    
    if (!message?.from) {
      console.log('No user info in update');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const telegramUser = message.from;
    const chatId = message.chat.id;
    const messageText = message.text || '';
    
    console.log('Telegram user:', JSON.stringify(telegramUser));
    console.log('Message:', messageText);

    // Upsert user into database
    const { data: userData, error: userError } = await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        last_active_at: new Date().toISOString(),
      }, {
        onConflict: 'telegram_id',
      })
      .select()
      .single();

    if (userError) {
      console.error('User upsert error:', userError);
    }

    // Get user's current balance
    const { data: currentUser } = await supabase
      .from('telegram_users')
      .select('balance, last_daily_claim')
      .eq('telegram_id', telegramUser.id)
      .single();

    // Save message to database
    const { error: msgError } = await supabase
      .from('telegram_messages')
      .insert({
        telegram_user_id: telegramUser.id,
        message_text: messageText,
        message_type: message.photo ? 'photo' : message.document ? 'document' : 'text',
        chat_id: chatId,
      });

    if (msgError) {
      console.error('Message insert error:', msgError);
    }

    // Handle commands
    if (messageText.startsWith('/')) {
      const command = messageText.split(' ')[0].toLowerCase().replace('/', '');
      
      // Handle /start command - show balance
      if (command === 'start') {
        const balance = currentUser?.balance || 0;
        const welcomeMessage = `🎉 <b>স্বাগতম!</b>\n\n💰 আপনার বর্তমান ব্যালেন্স: <b>${balance} ক্রেডিট</b>\n\n📌 <b>উপলব্ধ কমান্ড:</b>\n/daily - ডেইলি বোনাস নিন (প্রতি ২৪ ঘন্টায় ১ ক্রেডিট)\n/balance - ব্যালেন্স দেখুন`;
        await sendTelegramMessage(chatId, welcomeMessage);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /balance command
      if (command === 'balance') {
        const balance = currentUser?.balance || 0;
        await sendTelegramMessage(chatId, `💰 আপনার বর্তমান ব্যালেন্স: <b>${balance} ক্রেডিট</b>`);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /daily command - give 1 credit every 24 hours
      if (command === 'daily') {
        const lastClaim = currentUser?.last_daily_claim;
        const now = new Date();
        
        if (lastClaim) {
          const lastClaimDate = new Date(lastClaim);
          const hoursSinceLastClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastClaim < 24) {
            const hoursRemaining = Math.ceil(24 - hoursSinceLastClaim);
            const minutesRemaining = Math.ceil((24 - hoursSinceLastClaim) * 60) % 60;
            await sendTelegramMessage(chatId, `⏰ আপনি ইতিমধ্যে আজকের বোনাস নিয়েছেন!\n\n⏳ পরবর্তী বোনাস পেতে অপেক্ষা করুন: <b>${hoursRemaining} ঘন্টা ${minutesRemaining} মিনিট</b>`);
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Give daily bonus
        const newBalance = (currentUser?.balance || 0) + 1;
        const { error: updateError } = await supabase
          .from('telegram_users')
          .update({
            balance: newBalance,
            last_daily_claim: now.toISOString(),
          })
          .eq('telegram_id', telegramUser.id);

        if (updateError) {
          console.error('Balance update error:', updateError);
          await sendTelegramMessage(chatId, '❌ বোনাস প্রদানে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
        } else {
          await sendTelegramMessage(chatId, `🎁 <b>ডেইলি বোনাস!</b>\n\n✅ আপনি +1 ক্রেডিট পেয়েছেন!\n💰 নতুন ব্যালেন্স: <b>${newBalance} ক্রেডিট</b>\n\n⏰ পরবর্তী বোনাস ২৪ ঘন্টা পর`);
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check for custom commands
      const { data: commandData } = await supabase
        .from('bot_commands')
        .select('response')
        .eq('command', command)
        .eq('is_active', true)
        .maybeSingle();

      if (commandData?.response) {
        console.log('Sending auto-reply for command:', command);
        await sendTelegramMessage(chatId, commandData.response);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});