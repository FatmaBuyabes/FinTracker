// Supabase Edge Function — AI Daily Insight
// Calls OpenRouter to produce personalised tips based on the user's actual spending.
// Model: openai/gpt-oss-120b:free

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? ''
const MODEL = 'openai/gpt-oss-120b:free'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    // ── Aggregate totals ────────────────────────────────────────────────────
    const expenses = transactions.filter(t => t.type === 'expense')
    const incomes  = transactions.filter(t => t.type === 'income')

    const totalSpent  = expenses.reduce((s, t) => s + Number(t.amount), 0)
    const totalIncome = incomes.reduce((s, t)  => s + Number(t.amount), 0)
    const netBalance  = totalIncome - totalSpent

    const now          = new Date()
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth   = now.getDate()
    const daysLeft     = daysInMonth - dayOfMonth
    const dailyAvg     = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0
    const projectedEnd = dailyAvg * daysInMonth

    // ── Per-category spending ───────────────────────────────────────────────
    const spendByCategory: Record<string, number> = {}
    for (const t of expenses) {
      const cat = t.category?.name ?? 'Uncategorised'
      spendByCategory[cat] = (spendByCategory[cat] ?? 0) + Number(t.amount)
    }

    // Sort categories by spend descending
    const sortedCategories = Object.entries(spendByCategory)
      .sort(([, a], [, b]) => b - a)

    // ── Budget vs actual per category ───────────────────────────────────────
    const budgetMap: Record<string, number> = {}
    for (const b of budgets) {
      const cat = b.category?.name ?? 'Uncategorised'
      budgetMap[cat] = Number(b.amount)
    }

    const categoryLines: string[] = sortedCategories.map(([cat, spent]) => {
      const budget = budgetMap[cat]
      if (budget != null) {
        const pct     = ((spent / budget) * 100).toFixed(0)
        const diff    = spent - budget
        const status  = diff > 0 ? `OVER by $${diff.toFixed(2)}` : `under by $${Math.abs(diff).toFixed(2)}`
        return `  • ${cat}: spent $${spent.toFixed(2)} of $${budget.toFixed(2)} budget (${pct}% — ${status})`
      }
      return `  • ${cat}: spent $${spent.toFixed(2)} (no budget set)`
    })

    // Top spender for targeted tip
    const topCategory = sortedCategories[0]?.[0] ?? null
    const topAmount   = sortedCategories[0]?.[1] ?? 0

    const categorySection = categoryLines.length > 0
      ? categoryLines.join('\n')
      : '  • No expenses recorded this month yet'

    // ── Build prompt ────────────────────────────────────────────────────────
    const prompt = `You are a concise personal finance assistant for a daily expense tracker app.

Month snapshot (day ${dayOfMonth} of ${daysInMonth} — ${daysLeft} days left):
• Total spent:       $${totalSpent.toFixed(2)}
• Total income:      $${totalIncome.toFixed(2)}
• Net balance:       $${netBalance.toFixed(2)}
• Daily avg spend:   $${dailyAvg.toFixed(2)}/day
• Projected end-of-month spend: $${projectedEnd.toFixed(2)}

Spending breakdown by category:
${categorySection}
${topCategory ? `\nHighest spending category this month: ${topCategory} ($${topAmount.toFixed(2)})` : ''}

Reply ONLY with a raw JSON object (no markdown, no extra text) with exactly these three string fields:
{
  "timeEstimate": "One sentence about how the current balance will last or when budget pressure will hit, referencing specific days or dates.",
  "dailyMessage": "One warm, encouraging sentence to motivate the user to log today's expenses and stay on track.",
  "spendingTip": "One concrete, actionable tip DIRECTLY referencing the user's actual highest or over-budget spending category and specific dollar amounts. Do NOT give generic advice — name the category and the numbers."
}`

    // ── Call OpenRouter ─────────────────────────────────────────────────────
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
        max_tokens: 350,
        temperature: 0.7,
      }),
    })

    if (!orRes.ok) {
      const errText = await orRes.text()
      throw new Error(`OpenRouter ${orRes.status}: ${errText}`)
    }

    const orData  = await orRes.json()
    const raw     = orData.choices?.[0]?.message?.content ?? '{}'

    // Strip markdown fences if model wraps in ```json … ```
    const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}'
    const content = JSON.parse(jsonStr)

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
