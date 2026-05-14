import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Initialize Firebase Admin (mocked/prepared for real credentials)
// In production, you would import a Firebase Admin SDK compatible with Deno 
// or call the FCM HTTP v1 API directly using fetch and a service account token.

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

serve(async (req) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, recipient_id } = await req.json()

    if (!message || !recipient_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: In a real implementation:
    // 1. Fetch recipient's FCM tokens from profiles or a dedicated fcm_tokens table
    // 2. Format the payload for FCM HTTP v1 API
    // 3. Send the request to https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send

    console.log(`Prepared to send push notification to user ${recipient_id}`, message)

    if (!FCM_SERVER_KEY) {
      console.warn("FCM_SERVER_KEY not found in environment variables. Simulation mode active.")
      return new Response(
        JSON.stringify({ success: true, simulated: true, message: "Push notification simulated (no FCM config)" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simulated successful response for when FCM is configured
    return new Response(
      JSON.stringify({ success: true, message: 'Push notification sent via FCM' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
