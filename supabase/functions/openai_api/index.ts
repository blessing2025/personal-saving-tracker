import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable");
    return new Response(JSON.stringify({ error: "Server configuration error: Missing API Key" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { audio } = await req.json(); // Base64 audio from frontend
    
    // 1. Convert Base64 to Blob for OpenAI Whisper
    const blob = await fetch(`data:audio/webm;base64,${audio}`).then(r => r.blob());
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    // 2. Transcribe Audio
    const transcriptionRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData
    });
    
    if (!transcriptionRes.ok) {
      const err = await transcriptionRes.text();
      throw new Error(`Whisper API error: ${err}`);
    }

    const { text: transcript } = await transcriptionRes.json();
    
    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a financial assistant. Extract 'amount' (number) and 'category' from the text. Categories: Rent, Food, Transport, Groceries, Bills, Entertainment, Other. Return ONLY valid JSON." 
          },
          { role: "user", content: transcript }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!completionRes.ok) {
      const err = await completionRes.text();
      throw new Error(`GPT API error: ${err}`);
    }

    const completionData = await completionRes.json();
    const result = JSON.parse(completionData.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[Edge Function Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});