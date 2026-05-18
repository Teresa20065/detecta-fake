import { NextRequest, NextResponse } from "next/server"

// Simulated AI analysis for text
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple heuristic-based analysis for demo purposes
    const lowerText = text.toLowerCase()
    
    // Red flag indicators
    const redFlagIndicators = [
      { pattern: /urgente|última hora|breaking/i, flag: "Usa lenguaje urgente típico de desinformación" },
      { pattern: /comparte antes|difunde|viral/i, flag: "Incita a compartir sin verificar" },
      { pattern: /el gobierno oculta|no quieren que sepas/i, flag: "Usa teorías conspirativas" },
      { pattern: /según (fuentes|expertos) (anónimos|cercanos)/i, flag: "Cita fuentes anónimas no verificables" },
      { pattern: /100%|garantizado|comprobado/i, flag: "Usa afirmaciones absolutas" },
      { pattern: /cura (milagrosa|definitiva)|remedio secreto/i, flag: "Promete soluciones milagrosas" },
      { pattern: /whatsapp|cadena|reenvía/i, flag: "Tiene características de cadena viral" },
    ]

    // Verifiable indicators
    const verifiableIndicators = [
      { pattern: /según (reuters|ap|afp|efe)/i, element: "Cita agencia de noticias reconocida" },
      { pattern: /ministerio|secretaría|gobierno oficial/i, element: "Menciona fuente gubernamental oficial" },
      { pattern: /estudio (publicado|de) (en |la )?(universidad|journal|revista)/i, element: "Referencia estudio académico" },
      { pattern: /\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i, element: "Incluye fecha específica verificable" },
      { pattern: /https?:\/\/[^\s]+/i, element: "Incluye enlace a fuente" },
    ]

    const redFlags: string[] = []
    const verifiableElements: string[] = []

    // Check for red flags
    for (const { pattern, flag } of redFlagIndicators) {
      if (pattern.test(text)) {
        redFlags.push(flag)
      }
    }

    // Check for verifiable elements
    for (const { pattern, element } of verifiableIndicators) {
      if (pattern.test(text)) {
        verifiableElements.push(element)
      }
    }

    // Calculate score and verdict based on analysis
    const redFlagScore = redFlags.length * 20
    const verifiableScore = verifiableElements.length * 15
    const baseScore = 50

    let score = Math.max(0, Math.min(100, baseScore + redFlagScore - verifiableScore))
    
    // Add some randomness for demo
    score = Math.max(5, Math.min(95, score + Math.floor(Math.random() * 20) - 10))

    let verdict: "VERDADERO" | "FALSO" | "ENGAÑOSO" | "NO VERIFICABLE"
    let reasoning: string

    if (redFlags.length === 0 && verifiableElements.length === 0) {
      verdict = "NO VERIFICABLE"
      reasoning = "No se encontraron suficientes elementos para verificar la veracidad de esta información. Se recomienda buscar fuentes adicionales antes de compartir."
      score = Math.floor(Math.random() * 30) + 35
    } else if (redFlags.length >= 3) {
      verdict = "FALSO"
      reasoning = `Se detectaron ${redFlags.length} señales de alerta típicas de desinformación. El contenido presenta patrones comunes en noticias falsas y carece de fuentes verificables.`
    } else if (redFlags.length >= 1 && verifiableElements.length >= 1) {
      verdict = "ENGAÑOSO"
      reasoning = "El contenido mezcla información potencialmente verificable con elementos típicos de desinformación. Puede contener verdades parciales o fuera de contexto."
    } else if (verifiableElements.length >= 2) {
      verdict = "VERDADERO"
      reasoning = "El contenido incluye elementos verificables y cita fuentes reconocidas. Se recomienda contrastar con la fuente original para confirmar."
      score = Math.floor(Math.random() * 20) + 10
    } else if (redFlags.length > verifiableElements.length) {
      verdict = "FALSO"
      reasoning = "El análisis detectó más señales de alerta que elementos verificables. El contenido presenta características típicas de información falsa."
    } else {
      verdict = "ENGAÑOSO"
      reasoning = "El contenido requiere verificación adicional. Contiene algunos elementos verificables pero también presenta señales de posible manipulación."
    }

    return NextResponse.json({
      verdict,
      score,
      reasoning,
      redFlags,
      verifiableElements,
    })
  } catch (error) {
    console.error("Error analyzing text:", error)
    return NextResponse.json({ error: "Failed to analyze text" }, { status: 500 })
  }
}
