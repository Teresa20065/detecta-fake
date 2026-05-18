import { NextRequest, NextResponse } from "next/server"

// Simulated AI analysis for images
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File | null

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulated image analysis responses
    const analysisResults = [
      {
        verdict: "FALSO" as const,
        score: 87,
        reasoning: "Se detectaron signos de manipulación digital en la imagen. Los metadatos EXIF indican edición con software de retoque. Las sombras y la iluminación presentan inconsistencias.",
        redFlags: [
          "Metadatos EXIF alterados",
          "Inconsistencias en sombras",
          "Posible uso de IA generativa",
          "Compresión inusual en áreas específicas"
        ],
        verifiableElements: [] as string[],
      },
      {
        verdict: "ENGAÑOSO" as const,
        score: 64,
        reasoning: "La imagen parece auténtica pero ha sido sacada de contexto. Se encontró la imagen original en otras fuentes con fecha y ubicación diferentes.",
        redFlags: [
          "Imagen usada fuera de contexto",
          "Fecha de creación no coincide con lo afirmado"
        ],
        verifiableElements: [
          "Imagen original encontrada en archivo",
          "Ubicación geográfica verificable"
        ],
      },
      {
        verdict: "VERDADERO" as const,
        score: 15,
        reasoning: "La imagen no presenta signos evidentes de manipulación. Los metadatos son consistentes y no se detectaron alteraciones digitales significativas.",
        redFlags: [] as string[],
        verifiableElements: [
          "Metadatos EXIF intactos",
          "Sin signos de edición digital",
          "Consistencia en iluminación y sombras"
        ],
      },
      {
        verdict: "NO VERIFICABLE" as const,
        score: 45,
        reasoning: "No se pudo determinar la autenticidad de la imagen. Los metadatos fueron removidos y no se encontraron coincidencias en bases de datos de imágenes.",
        redFlags: [
          "Metadatos removidos"
        ],
        verifiableElements: [] as string[],
      },
    ]

    // Return a random analysis result for demo
    const result = analysisResults[Math.floor(Math.random() * analysisResults.length)]

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
