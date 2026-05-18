import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('id, created_at, type, verdict, score, analyzed_text, reasoning, red_flags')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const mapped = (data || []).map(item => ({
      id: item.id,
      verdict: item.verdict,
      score: item.score,
      reasoning: item.reasoning,
      redFlags: item.red_flags || [],
      verifiableElements: [],
      analyzedText: item.analyzed_text || '',
      type: item.type,
      timestamp: item.created_at
    }))

    return NextResponse.json({ history: mapped })

  } catch (error) {
    console.error('Error /api/history:', error)
    return NextResponse.json({ history: [] })
  }
}