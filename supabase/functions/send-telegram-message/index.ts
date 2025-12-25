import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get bot token from database
async function getBotToken(): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('bot_settings')
    .select('value')
    .eq('key', 'telegram_bot_token')
    .single();
  
  if (error || !data) {
    console.log('No bot token in database, falling back to env variable');
    return Deno.env.get('TELEGRAM_BOT_TOKEN') || null;
  }
  
  return data.value;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatId, message } = await req.json();

    if (!chatId || !message) {
      return new Response(
        JSON.stringify({ error: 'chatId and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TELEGRAM_BOT_TOKEN = await getBotToken();
    
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('Bot token not configured');
    }

    console.log(`Sending message to chat ${chatId}`);

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    console.log('Telegram API response:', result);

    if (!result.ok) {
      // Handle blocked users gracefully - don't throw error, just log and return success
      if (result.error_code === 403) {
        console.log(`User ${chatId} has blocked the bot, skipping...`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: 'User blocked bot' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(result.description || 'Failed to send message');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending Telegram message:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
