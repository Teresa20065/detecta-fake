import { NextResponse } from "next/server"

// In-memory storage for demo (would be replaced with database in production)
const historyStore: Array<{
  id: number
  verdict: "VERDADERO" | "FALSO" | "ENGAÑOSO" | "NO VERIFICABLE"
  score: number
  reasoning: string
  redFlags: string[]
  verifiableElements: string[]
  analyzedText: string
  type: "text" | "image"
  timestamp: Date
}> = []

export async function GET() {
  // Return the last 10 analyses
  return NextResponse.json({
    history: historyStore.slice(0, 10),
  })
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const entry = {
      id: Date.now(),
      ...data,
      timestamp: new Date(),
    }

    // Add to beginning of array
    historyStore.unshift(entry)

    // Keep only last 100 entries
    if (historyStore.length > 100) {
      historyStore.pop()
    }

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error("Error saving history:", error)
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 })
  }
}
