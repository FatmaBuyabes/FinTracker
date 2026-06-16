// Supabase Edge Function — AI Daily Insight
// Calls OpenRouter to produce a budget runway estimate, daily reminder, and spending tip.
// Model: openai/gpt-4o-mini:free  (change MODEL below if you want a different free model)

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? ''
const MODEL = 'openai/gpt-4o-mini:free'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY secret is not configured in Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { transactions, budgets } = await req.json() as {
      transactions: Array<{ amount: number; type: string; title?: string; category?: { name: string } }>
      budgets: Array<{ amount: number; category?: { name: string } }>
    }

    // Compute month stats
    const totalSpent = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysLeft = daysInMonth - dayOfMonth
    const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0
    const projectedMonthEnd = dailyAvg * daysInMonth
    const netBalance = totalIncome - totalSpent

    const budgetSummary = budgets.length > 0
      ? budgets.map(b => `${b.category?.name ?? 'Unknown'}: $${Number(b.amount).toFixed(0)}`).join(', ')
      : 'No budgets set'

    const prompt = `You are a concise personal finance assistant for a daily expense tracker app.

Month snapshot (day ${dayOfMonth} of ${daysInMonth} — ${daysLeft} days left):
• Spent so far:      $${totalSpent.toFixed(2)}
• Income so far:     $${totalIncome.toFixed(2)}
• Net balance:       $${netBalance.toFixed(2)}
• Daily avg spend:   $${dailyAvg.toFixed(2)}/day
• Projected end-of-month spend: $${projectedMonthEnd.toFixed(2)}
• Budgets: ${budgetSummary}

Reply ONLY with a raw JSON object (no markdown, no extra text) with exactly these three string fields:
{
  "timeEstimate": "One sentence estimating how long the current balance will last or when budget pressure will hit, with specific days/dates",
  "dailyMessage": "One warm, friendly sentence encouraging the user to log today's expenses and stay on track",
  "spendingTip": "One concrete, actionable tip based on their specific numbers above"
}`

    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fintrack.app',
        'X-Title': 'FinTrack',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!orRes.ok) {
      const errText = await orRes.text()
      throw new Error(`OpenRouter ${orRes.status}: ${errText}`)
    }

    const orData = await orRes.json()
    const raw = orData.choices?.[0]?.message?.content ?? '{}'
    const content = JSON.parse(raw)

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai-daily-insight]', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
