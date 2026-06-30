import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini 2.0 Flash — free tier: 1,500 requests/day, 15 RPM
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are UniPilot's AI Study Coach — a helpful, concise academic assistant for university students.

Your role is to help students UNDERSTAND and PREPARE, not to complete work for them.

Guidelines:
- Be clear, structured, and student-friendly
- Use markdown formatting where appropriate (headers, bullet points, bold)
- Be encouraging and motivating
- Never write full assignments, essays, or exam answers
- Never help with plagiarism or academic dishonesty
- Always remind students that understanding the material is what builds long-term success

When generating:
- SUMMARY: Extract and organise the key ideas clearly
- FLASHCARDS: Create Q&A pairs in format "Q: ... A: ..."
- QUIZ: Create 5-8 multiple choice or short answer questions with answers
- EXPLANATION: Break down complex concepts into simple terms with examples
- STUDY_PLAN: Create a structured day-by-day revision schedule`;

function buildUserMessage(type: string, input: string, moduleName: string | null): string {
  const context = moduleName ? `Module: ${moduleName}\n\n` : '';

  switch (type) {
    case 'summary':
      return `${context}Please summarise the following notes into clear, organised key points:\n\n${input}`;
    case 'flashcards':
      return `${context}Generate 8-10 study flashcards (Q&A format) for the following topic or notes:\n\n${input}`;
    case 'quiz':
      return `${context}Create 6 quiz questions (with answers) to test understanding of:\n\n${input}`;
    case 'explanation':
      return `${context}Explain this concept in simple, clear terms that a student can understand:\n\n${input}`;
    case 'study_plan':
      return `${context}Create a focused revision plan for the following topic. Include specific activities for each session:\n\n${input}`;
    default:
      return `${context}${input}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check subscription and usage limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .single();

    const plan = subscription?.plan_name ?? 'free';
    const monthlyLimits = { free: 3, pro: 100, pro_plus: 300 };
    const limit = monthlyLimits[plan as keyof typeof monthlyLimits] ?? 3;

    // Count this month's generations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('ai_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if ((count ?? 0) >= limit) {
      return new Response(JSON.stringify({
        error: `Monthly AI limit reached (${limit} for ${plan} plan). Upgrade to Pro for more.`,
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, input, moduleId, moduleName } = await req.json();

    if (!type || !input) {
      return new Response(JSON.stringify({ error: 'Missing type or input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Google Gemini 2.0 Flash
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('GEMINI_API_KEY secret not set');

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserMessage(type, input, moduleName) }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const geminiData = await geminiResponse.json();
    const outputText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
    const tokensUsed =
      (geminiData.usageMetadata?.promptTokenCount ?? 0) +
      (geminiData.usageMetadata?.candidatesTokenCount ?? 0);

    // Log to ai_generations
    await supabase.from('ai_generations').insert({
      user_id: user.id,
      module_id: moduleId ?? null,
      generation_type: type,
      input_text: input.slice(0, 2000),
      output_text: outputText,
      tokens_used: tokensUsed,
    });

    return new Response(JSON.stringify({ output: outputText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
