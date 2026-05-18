import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `Eres DetectaFake, experto en detección de desinformación visual para Latinoamérica.
Analiza la imagen y responde ÚNICAMENTE con JSON válido, sin markdown, sin texto extra.

Estructura exacta:
{
  "verdict": "VERDADERO" | "FALSO" | "ENGAÑOSO" | "NO VERIFICABLE",
  "score": número 0-100 (100 = completamente falso/manipulado),
  "reasoning": "Descripción de lo que ves y por qué es o no desinformación (2-3 párrafos en español)",
  "redFlags": ["señal1", "señal2"],
  "verifiableElements": ["elemento1"]
}`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })
    }

    const buffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = imageFile.type || 'image/jpeg'

    const response = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-VL-01',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64}`
                }
              },
              {
                type: 'text',
                text: 'Analiza esta imagen en busca de desinformación o manipulación.'
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('MiniMax error:', err)
      throw new Error(`MiniMax ${response.status}`)
    }

    const aiData = await response.json()
    const raw = aiData.choices[0].message.content
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(cleaned)

    supabase.from('analyses').insert({
      type: 'image',
      verdict: analysis.verdict,
      score: analysis.score,
      reasoning: analysis.reasoning,
      red_flags: analysis.redFlags || [],
      verifiable_elements: analysis.verifiableElements || [],
      analyzed_text: '🖼️ Imagen analizada'
    }).then(({ error }) => {
      if (error) console.error('Supabase insert error:', error)
    })

    return NextResponse.json({
      verdict: analysis.verdict,
      score: analysis.score,
      reasoning: analysis.reasoning,
      redFlags: analysis.redFlags || [],
      verifiableElements: analysis.verifiableElements || [],
      analyzedText: '🖼️ Imagen analizada'
    })

  } catch (error) {
    console.error('Error /api/analyze-image:', error)
    return NextResponse.json({ error: 'Error al analizar imagen.' }, { status: 500 })
  }
}