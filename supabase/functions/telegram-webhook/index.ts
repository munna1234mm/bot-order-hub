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
    const { error: userError } = await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        last_active_at: new Date().toISOString(),
      }, {
        onConflict: 'telegram_id',
      });

    if (userError) {
      console.error('User upsert error:', userError);
    }

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

    // Check for command and send auto-reply
    if (messageText.startsWith('/')) {
      const command = messageText.split(' ')[0].toLowerCase().replace('/', '');
      
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
