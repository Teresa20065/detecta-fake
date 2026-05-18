import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `Eres DetectaFake, experto en detección de desinformación para Latinoamérica.
Analiza el texto recibido y responde ÚNICAMENTE con JSON válido, sin markdown, sin texto extra.

Estructura exacta:
{
  "verdict": "VERDADERO" | "FALSO" | "ENGAÑOSO" | "NO VERIFICABLE",
  "score": número 0-100 (100 = completamente falso, 0 = completamente verdadero),
  "reasoning": "Explicación en español de 2-3 párrafos",
  "redFlags": ["señal1", "señal2"],
  "verifiableElements": ["elemento1", "elemento2"]
}

Criterios:
- VERDADERO (score 0-30): información precisa y verificable
- FALSO (score 70-100): información incorrecta o fabricada  
- ENGAÑOSO (score 40-70): verdades parciales que crean impresión falsa
- NO VERIFICABLE (score 30-60): no hay suficiente info para determinar`

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'El texto debe tener al menos 10 caracteres' }, { status: 400 })
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analiza este contenido:\n\n${text}` }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Mistral error:', err)
      throw new Error(`Mistral ${response.status}`)
    }

    const aiData = await response.json()
    const raw = aiData.choices[0].message.content
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(cleaned)

    supabase.from('analyses').insert({
      type: 'text',
      input_text: text,
      verdict: analysis.verdict,
      score: analysis.score,
      reasoning: analysis.reasoning,
      red_flags: analysis.redFlags || [],
      verifiable_elements: analysis.verifiableElements || [],
      analyzed_text: text.slice(0, 200)
    }).then(({ error }) => {
      if (error) console.error('Supabase insert error:', error)
    })

    return NextResponse.json({
      verdict: analysis.verdict,
      score: analysis.score,
      reasoning: analysis.reasoning,
      redFlags: analysis.redFlags || [],
      verifiableElements: analysis.verifiableElements || [],
      analyzedText: text.slice(0, 200)
    })

  } catch (error) {
    console.error('Error /api/analyze:', error)
    return NextResponse.json({ error: 'Error al analizar. Intentá de nuevo.' }, { status: 500 })
  }
}