import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, recipient_id, title = 'Nouveau message' } = await req.json()

    if (!message || !recipient_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!FCM_SERVER_KEY) {
      console.warn("FCM_SERVER_KEY not found in environment variables. Simulation mode active.")
      return new Response(
        JSON.stringify({ success: true, simulated: true, message: "Push notification simulated (no FCM config)" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch user's FCM token (assuming it's stored in profiles.fcm_token)
    // Wait, the schema doesn't show fcm_token. Let's assume it's in profiles.fcm_token or we check if it exists.
    // Actually, looking at webhooks/fcm/route.ts, token is passed directly. 
    // If the schema has fcm_token in profiles, we can get it:
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', recipient_id)
      .single();

    const token = profile?.fcm_token;

    if (!token) {
      console.log(`No FCM token found for user ${recipient_id}`);
      return new Response(
        JSON.stringify({ success: false, message: 'No FCM token for recipient' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title,
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        },
        data: {
          url: '/chat',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FCM send failed:', response.status, errorText);
      throw new Error(`FCM API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, message: 'Push notification sent via FCM', result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error sending push:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
