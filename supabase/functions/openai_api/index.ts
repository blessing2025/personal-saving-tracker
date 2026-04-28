import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    if (!audio) throw new Error("No audio data provided");

    // 1. Convert Base64 to Blob for OpenAI
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });

    // 2. Transcription using OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');

    const transcriptionRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    const transcriptionData = await transcriptionRes.json();
    if (transcriptionData.error) throw new Error(`Whisper Error: ${transcriptionData.error.message}`);
    
    const text = transcriptionData.text;
    console.log("[AI] Transcribed Text:", text);

    // 3. Structured Data Extraction using GPT
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial assistant. Extract the "amount" (number) and "category" (Rent, Food, Transport, Groceries, Bills, Entertainment, or Other) from the text. Return ONLY valid JSON.' 
          },
          { role: 'user', content: `Text: "${text}"` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const gptData = await gptRes.json();
    if (gptData.error) throw new Error(`GPT Error: ${gptData.error.message}`);

    const result = JSON.parse(gptData.choices[0].message.content);
    console.log("[AI] Parsed Result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[AI] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});