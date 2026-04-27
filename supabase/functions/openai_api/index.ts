import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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
    const { text: transcript } = await transcriptionRes.json();

    // 3. Parse with GPT-4o-mini (Returning ONLY amount and category)
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

    const completionData = await completionRes.json();
    const result = JSON.parse(completionData.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});