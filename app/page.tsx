"use client"

import { useState, useEffect } from "react"
import { Shield, Search, Upload, AlertTriangle, CheckCircle, XCircle, HelpCircle, Loader2, ImageIcon, FileText, Clock } from "lucide-react"

// Types
interface AnalysisResult {
  id: number
  verdict: "VERDADERO" | "FALSO" | "ENGAÑOSO" | "NO VERIFICABLE"
  score: number
  reasoning: string
  redFlags: string[]
  verifiableElements: string[]
  analyzedText: string
  type: "text" | "image"
  timestamp: Date
}

// Verdict colors
const verdictColors = {
  VERDADERO: { bg: "bg-[#00ff88]", text: "text-[#00ff88]", border: "border-[#00ff88]" },
  FALSO: { bg: "bg-[#ff3b3b]", text: "text-[#ff3b3b]", border: "border-[#ff3b3b]" },
  ENGAÑOSO: { bg: "bg-[#ffaa00]", text: "text-[#ffaa00]", border: "border-[#ffaa00]" },
  "NO VERIFICABLE": { bg: "bg-[#888]", text: "text-[#888]", border: "border-[#888]" },
}

// Components
function VerdictBadge({ verdict }: { verdict: AnalysisResult["verdict"] }) {
  const colors = verdictColors[verdict]
  return (
    <span className={`${colors.bg} text-[#0a0f1e] px-4 py-2 rounded-lg font-bold text-lg uppercase`}>
      {verdict}
    </span>
  )
}

function VerdictBadgeSmall({ verdict }: { verdict: AnalysisResult["verdict"] }) {
  const colors = verdictColors[verdict]
  return (
    <span className={`${colors.bg} text-[#0a0f1e] px-2 py-1 rounded text-xs font-bold uppercase`}>
      {verdict}
    </span>
  )
}

function ScoreMeter({ score, verdict }: { score: number; verdict: AnalysisResult["verdict"] }) {
  const colors = verdictColors[verdict]
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">Confianza</span>
        <span className={colors.text}>{score}/100</span>
      </div>
      <div className="h-3 bg-[#1a2035] rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bg} transition-all duration-500 rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function RedFlagsList({ flags }: { flags: string[] }) {
  if (!flags.length) return null
  return (
    <div className="space-y-2">
      <h4 className="text-white font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#ff3b3b]" />
        Red Flags
      </h4>
      <ul className="space-y-1">
        {flags.map((flag, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
            <span className="w-2 h-2 rounded-full bg-[#ff3b3b] mt-1.5 shrink-0" />
            {flag}
          </li>
        ))}
      </ul>
    </div>
  )
}

function VerifiableList({ elements }: { elements: string[] }) {
  if (!elements.length) return null
  return (
    <div className="space-y-2">
      <h4 className="text-white font-semibold flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-[#00ff88]" />
        Elementos verificables
      </h4>
      <ul className="space-y-1">
        {elements.map((el, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] mt-1.5 shrink-0" />
            {el}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
      <span className="text-[#00d4ff]">Analizando con IA...</span>
    </div>
  )
}

function FileDropzone({ onFileSelect, preview }: { onFileSelect: (file: File) => void; preview: string | null }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-[#00d4ff] bg-[#00d4ff]/10" : "border-gray-600 hover:border-gray-500"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {preview ? (
        <div className="space-y-4">
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
          <p className="text-gray-400 text-sm">Haz clic o arrastra otra imagen para cambiar</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="w-12 h-12 mx-auto text-gray-500" />
          <p className="text-gray-300">Arrastra una imagen o haz clic para subir</p>
          <p className="text-gray-500 text-sm">JPG, PNG, GIF, WebP · máx 5MB</p>
        </div>
      )}
    </div>
  )
}

function HistoryCard({ item, onExpand, isExpanded }: { item: AnalysisResult; onExpand: () => void; isExpanded: boolean }) {
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "hace unos segundos"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? "s" : ""}`
    return `hace ${Math.floor(hours / 24)} día${Math.floor(hours / 24) > 1 ? "s" : ""}`
  }

  const truncatedText = item.type === "image" 
    ? "🖼️ Imagen analizada" 
    : item.analyzedText.length > 80 
      ? item.analyzedText.slice(0, 80) + "..." 
      : item.analyzedText

  return (
    <div className="bg-[#111827] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <VerdictBadgeSmall verdict={item.verdict} />
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Clock className="w-3 h-3" />
          {timeAgo(item.timestamp)}
        </div>
      </div>
      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{truncatedText}</p>
      <div className="flex items-center justify-between">
        <div className={`text-sm ${verdictColors[item.verdict].text}`}>
          Confianza: {item.score}/100
        </div>
        <button
          onClick={onExpand}
          className="text-[#00d4ff] text-sm hover:underline"
        >
          {isExpanded ? "Ocultar" : "Ver detalles"}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div>
            <h5 className="text-gray-400 text-xs uppercase mb-1">Análisis</h5>
            <p className="text-gray-300 text-sm">{item.reasoning}</p>
          </div>
          {item.redFlags.length > 0 && (
            <div>
              <h5 className="text-gray-400 text-xs uppercase mb-1">Red Flags</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                {item.redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b3b] mt-1.5" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Fake data for preview
const fakeHistory: AnalysisResult[] = [
  {
    id: 1,
    verdict: "FALSO",
    score: 89,
    reasoning: "El texto contiene afirmaciones sin fuente verificable y utiliza lenguaje sensacionalista típico de desinformación.",
    redFlags: ["Sin fuente citada", "Lenguaje alarmista", "Institución mencionada no confirmó la información"],
    verifiableElements: [],
    analyzedText: "VIDEO: El gobierno confirmó que el agua del río Mapocho causa cáncer según estudio de Harvard...",
    type: "text",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    verdict: "ENGAÑOSO",
    score: 61,
    reasoning: "La imagen ha sido manipulada digitalmente. Se detectaron inconsistencias en las sombras y metadatos alterados.",
    redFlags: ["Metadatos alterados", "Inconsistencias visuales"],
    verifiableElements: ["Ubicación geográfica verificable"],
    analyzedText: "🖼️ Imagen analizada",
    type: "image",
    timestamp: new Date(Date.now() - 900000),
  },
  {
    id: 3,
    verdict: "VERDADERO",
    score: 12,
    reasoning: "La información coincide con comunicados oficiales del Banco Central de Chile publicados en su sitio web.",
    redFlags: [],
    verifiableElements: ["Fuente oficial citada", "Fecha verificable", "Datos coinciden con registros públicos"],
    analyzedText: "El Banco Central de Chile subió la tasa de interés 0.25 puntos en su reunión de mayo...",
    type: "text",
    timestamp: new Date(Date.now() - 1800000),
  },
]

export default function DetectaFake() {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text")
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>(fakeHistory)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    const url = URL.createObjectURL(file)
    setImagePreviewUrl(url)
  }

  const analyzeText = async () => {
    if (!inputText.trim()) return
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      })
      const data = await response.json()
      const newResult: AnalysisResult = {
        ...data,
        id: Date.now(),
        type: "text",
        timestamp: new Date(),
        analyzedText: inputText,
      }
      setResult(newResult)
      setHistory((prev) => [newResult, ...prev].slice(0, 10))
    } catch (error) {
      console.error("Error analyzing text:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return
    setIsLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      const newResult: AnalysisResult = {
        ...data,
        id: Date.now(),
        type: "image",
        timestamp: new Date(),
        analyzedText: "🖼️ Imagen analizada",
      }
      setResult(newResult)
      setHistory((prev) => [newResult, ...prev].slice(0, 10))
    } catch (error) {
      console.error("Error analyzing image:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setInputText("")
    setSelectedImage(null)
    setImagePreviewUrl(null)
    setResult(null)
  }

  useEffect(() => {
    // Fetch history on mount
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.history?.length) {
          setHistory(data.history)
        }
      })
      .catch(() => {
        // Keep fake data if API fails
      })
  }, [])

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Hero Header */}
      <header className="pt-12 pb-8 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-[#00d4ff]" />
          <h1 className="text-4xl font-bold">DetectaFake</h1>
        </div>
        <p className="text-[#00d4ff] text-lg mb-2">Detector de desinformación para Latinoamérica</p>
        <p className="text-gray-400 max-w-md mx-auto">
          Pega un texto o sube una imagen. La IA detecta si es real.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-[#1a2035] px-3 py-1.5 rounded-full text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
          Powered by Mistral + MiniMax
        </div>
      </header>

      {/* Analyzer Section */}
      <section className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => { setActiveTab("text"); setResult(null) }}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "text"
                    ? "bg-[#1a2035] text-[#00d4ff] border-b-2 border-[#00d4ff]"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <FileText className="w-5 h-5" />
                Texto
              </button>
              <button
                onClick={() => { setActiveTab("image"); setResult(null) }}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "image"
                    ? "bg-[#1a2035] text-[#00d4ff] border-b-2 border-[#00d4ff]"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                Imagen
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!result ? (
                <>
                  {activeTab === "text" ? (
                    <div className="space-y-4">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Pega aquí el texto, noticia, tweet o mensaje viral que quieres verificar..."
                        className="w-full min-h-[150px] bg-[#0a0f1e] border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] resize-none"
                        disabled={isLoading}
                      />
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : (
                        <button
                          onClick={analyzeText}
                          disabled={!inputText.trim()}
                          className="w-full bg-[#00d4ff] text-[#0a0f1e] font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-[#00b8e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Search className="w-5 h-5" />
                          Analizar Texto
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileDropzone onFileSelect={handleImageSelect} preview={imagePreviewUrl} />
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : (
                        <button
                          onClick={analyzeImage}
                          disabled={!selectedImage}
                          className="w-full bg-[#00d4ff] text-[#0a0f1e] font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-[#00b8e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Search className="w-5 h-5" />
                          Analizar Imagen
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  {/* Verdict */}
                  <div className="text-center">
                    <VerdictBadge verdict={result.verdict} />
                  </div>

                  {/* Score */}
                  <ScoreMeter score={result.score} verdict={result.verdict} />

                  {/* Analysis */}
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      🧠 Análisis
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.reasoning}</p>
                  </div>

                  {/* Red Flags */}
                  <RedFlagsList flags={result.redFlags} />

                  {/* Verifiable Elements */}
                  <VerifiableList elements={result.verifiableElements} />

                  {/* Reset Button */}
                  <button
                    onClick={resetForm}
                    className="w-full border border-[#00d4ff] text-[#00d4ff] font-bold py-3 px-6 rounded-lg hover:bg-[#00d4ff]/10 transition-colors"
                  >
                    Analizar otro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Public Dashboard */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              📊 Últimos análisis de la comunidad
            </h2>
            <p className="text-gray-400 mt-2">Historial público de verificaciones recientes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                isExpanded={expandedCard === item.id}
                onExpand={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
              />
            ))}
          </div>

          {history.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay análisis recientes</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        <p>DetectaFake © 2024 · Combatiendo la desinformación en Latinoamérica</p>
      </footer>
    </main>
  )
}
