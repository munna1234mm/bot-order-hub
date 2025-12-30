import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { botToken, webhookPath } = await req.json();

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, verify the bot token is valid
    console.log('Verifying bot token...');
    const getMeResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const getMeResult = await getMeResponse.json();

    if (!getMeResult.ok) {
      console.error('Invalid bot token:', getMeResult);
      return new Response(
        JSON.stringify({ error: 'Invalid bot token', details: getMeResult.description }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botUsername = getMeResult.result.username;
    console.log(`Bot verified: @${botUsername}`);

    // Delete any existing webhook first
    console.log('Removing old webhook...');
    const deleteResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    const deleteResult = await deleteResponse.json();
    console.log('Delete webhook result:', deleteResult);

    // Set the new webhook - use custom path if provided
    const functionPath = webhookPath || 'telegram-webhook';
    const webhookUrl = `${supabaseUrl}/functions/v1/${functionPath}`;
    console.log('Setting new webhook to:', webhookUrl);

    const setResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const setResult = await setResponse.json();
    console.log('Set webhook result:', setResult);

    if (!setResult.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to set webhook', details: setResult.description }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook info to confirm
    const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const infoResult = await infoResponse.json();
    console.log('Webhook info:', infoResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        botUsername,
        webhookUrl,
        webhookInfo: infoResult.result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error setting up webhook:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
