"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { 
  Copy, 
  Share2, 
  RotateCcw, 
  Save, 
  Download,
  QrCode,
  Shuffle,
  Play
} from "lucide-react"

interface Decision {
  id: string
  question: string
  result: 'Yes' | 'No' | 'Maybe'
  timestamp: number
  isPublic: boolean
  pollUrl?: string
}

interface Weights {
  yes: number
  no: number
  maybe: number
}

const DEFAULT_WEIGHTS: Weights = { yes: 33, no: 33, maybe: 34 }

export default function DecisionMaker() {
  const [question, setQuestion] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<Decision | null>(null)
  const [pollUrl, setPollUrl] = useState<string>("")
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [history, setHistory] = useState<Decision[]>([])
  
  const spinnerRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("decision-maker-history")
        if (saved) {
          setHistory(JSON.parse(saved))
        }
      } catch (error) {
        console.error("Failed to load history:", error)
      }
    }
  }, [])

  // Save history to localStorage
  const saveHistory = (newHistory: Decision[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("decision-maker-history", JSON.stringify(newHistory))
        setHistory(newHistory)
      } catch (error) {
        console.error("Failed to save history:", error)
      }
    }
  }

  // Generate poll URL when public is selected
  useEffect(() => {
    if (isPublic && question.trim()) {
      const token = Math.random().toString(36).substring(2, 10)
      setPollUrl(`${window.location.origin}/poll/${token}`)
    } else {
      setPollUrl("")
    }
  }, [isPublic, question])

  // Normalize weights to sum to 100
  const normalizeWeights = (newWeights: Partial<Weights>): Weights => {
    const current = { ...weights, ...newWeights }
    const total = current.yes + current.no + current.maybe
    
    if (total === 0) return DEFAULT_WEIGHTS
    
    const factor = 100 / total
    return {
      yes: Math.round(current.yes * factor),
      no: Math.round(current.no * factor), 
      maybe: Math.round(current.maybe * factor)
    }
  }

  const updateWeight = (type: keyof Weights, value: number) => {
    const newWeights = normalizeWeights({ [type]: value })
    setWeights(newWeights)
  }

  const randomizeWeights = () => {
    const random1 = Math.random() * 100
    const random2 = Math.random() * (100 - random1)
    const random3 = 100 - random1 - random2
    
    setWeights({
      yes: Math.round(random1),
      no: Math.round(random2),
      maybe: Math.round(random3)
    })
    toast.success("Weights randomized!")
  }

  const resetWeights = () => {
    setWeights(DEFAULT_WEIGHTS)
    toast.success("Weights reset to default")
  }

  const getWeightedResult = (): 'Yes' | 'No' | 'Maybe' => {
    const random = Math.random() * 100
    if (random < weights.yes) return 'Yes'
    if (random < weights.yes + weights.no) return 'No'
    return 'Maybe'
  }

  const spin = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question first")
      return
    }

    setIsSpinning(true)
    
    // Animate the spinner
    if (spinnerRef.current) {
      const randomRotation = 1440 + Math.random() * 720 // 4-6 full rotations
      spinnerRef.current.style.transform = `rotate(${randomRotation}deg)`
    }

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const result = getWeightedResult()
    const decision: Decision = {
      id: Date.now().toString(),
      question: question.trim(),
      result,
      timestamp: Date.now(),
      isPublic,
      pollUrl: isPublic ? pollUrl : undefined
    }
    
    setLastResult(decision)
    setIsSpinning(false)
    
    // Announce result for screen readers
    if (resultRef.current) {
      resultRef.current.setAttribute('aria-live', 'polite')
      resultRef.current.textContent = `Result: ${result}`
    }
    
    toast.success(`Decision made: ${result}!`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSpinning) {
      spin()
    }
  }

  const saveToHistory = () => {
    if (!lastResult) return
    
    const newHistory = [lastResult, ...history.slice(0, 49)] // Keep last 50
    saveHistory(newHistory)
    toast.success("Decision saved to history")
  }

  const copyPollUrl = async () => {
    if (!pollUrl) return
    
    try {
      await navigator.clipboard.writeText(pollUrl)
      toast.success("Poll URL copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy URL")
    }
  }

  const exportHistory = () => {
    if (history.length === 0) {
      toast.error("No history to export")
      return
    }
    
    const csv = [
      'Question,Result,Date,Type',
      ...history.map(d => `"${d.question}","${d.result}","${new Date(d.timestamp).toLocaleString()}","${d.isPublic ? 'Public' : 'Private'}"`)
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'decision-history.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("History exported successfully")
  }

  const getResultColor = (result: 'Yes' | 'No' | 'Maybe') => {
    switch (result) {
      case 'Yes': return 'text-green-600 bg-green-50'
      case 'No': return 'text-red-600 bg-red-50' 
      case 'Maybe': return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getResultSuggestion = (result: 'Yes' | 'No' | 'Maybe') => {
    switch (result) {
      case 'Yes': return 'Go for it! The universe says yes.'
      case 'No': return 'Maybe not this time. Trust the process.'
      case 'Maybe': return 'Consider all angles before deciding.'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card shadow-lg">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="What should I do about...?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-lg h-12"
            disabled={isSpinning}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isPublic ? "outline" : "default"}
              size="sm"
              onClick={() => setIsPublic(false)}
              disabled={isSpinning}
            >
              Private
            </Button>
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPublic(true)}
              disabled={isSpinning}
            >
              Community
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {isPublic ? "Share with others for community input" : "Personal decision only"}
          </div>
        </div>

        {isPublic && pollUrl && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-mono truncate flex-1">{pollUrl}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyPollUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Spinner Visualization */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                ref={spinnerRef}
                className={`w-48 h-48 rounded-full border-8 border-muted transition-transform duration-2000 ease-out ${
                  isSpinning ? 'animate-spin' : ''
                }`}
                style={{
                  background: `conic-gradient(
                    from 0deg,
                    #10b981 0deg ${(weights.yes / 100) * 360}deg,
                    #ef4444 ${(weights.yes / 100) * 360}deg ${((weights.yes + weights.no) / 100) * 360}deg,
                    #f59e0b ${((weights.yes + weights.no) / 100) * 360}deg 360deg
                  )`
                }}
                role="img"
                aria-label={`Decision wheel with ${weights.yes}% Yes, ${weights.no}% No, ${weights.maybe}% Maybe`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === ' ' || e.key === 'Enter') && !isSpinning) {
                    e.preventDefault()
                    spin()
                  }
                }}
              >
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-foreground"></div>
                </div>
                
                {/* Labels */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-sm font-medium">
                    <div className="text-green-600">Yes {weights.yes}%</div>
                    <div className="text-red-600">No {weights.no}%</div>
                    <div className="text-yellow-600">Maybe {weights.maybe}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Adjust Probabilities</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-green-600">Yes</label>
                    <span className="text-sm text-muted-foreground">{weights.yes}%</span>
                  </div>
                  <Slider
                    value={[weights.yes]}
                    onValueChange={([value]) => updateWeight('yes', value)}
                    max={100}
                    step={1}
                    disabled={isSpinning}
                    aria-label="Yes probability percentage"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-red-600">No</label>
                    <span className="text-sm text-muted-foreground">{weights.no}%</span>
                  </div>
                  <Slider
                    value={[weights.no]}
                    onValueChange={([value]) => updateWeight('no', value)}
                    max={100}
                    step={1}
                    disabled={isSpinning}
                    aria-label="No probability percentage"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-yellow-600">Maybe</label>
                    <span className="text-sm text-muted-foreground">{weights.maybe}%</span>
                  </div>
                  <Slider
                    value={[weights.maybe]}
                    onValueChange={([value]) => updateWeight('maybe', value)}
                    max={100}
                    step={1}
                    disabled={isSpinning}
                    aria-label="Maybe probability percentage"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={randomizeWeights}
                  disabled={isSpinning}
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Randomize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetWeights}
                  disabled={isSpinning}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Spin Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={spin}
            disabled={isSpinning || !question.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-lg"
          >
            {isSpinning ? (
              <>
                <div className="animate-spin h-5 w-5 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                Spinning...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Spin
              </>
            )}
          </Button>
        </div>

        {/* Result Display */}
        {lastResult && (
          <div className="border-t pt-6">
            <div className="text-center space-y-4">
              <div
                ref={resultRef}
                className={`inline-block px-6 py-3 rounded-lg text-2xl font-bold ${getResultColor(lastResult.result)}`}
              >
                {lastResult.result}
              </div>
              <p className="text-muted-foreground">
                {getResultSuggestion(lastResult.result)}
              </p>
              
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={spin}
                  disabled={isSpinning}
                >
                  Re-spin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveToHistory}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                {isPublic && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSharePanel(!showSharePanel)}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>

              {/* Share Panel */}
              {showSharePanel && isPublic && pollUrl && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="text-sm font-medium">Share this decision</div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={pollUrl}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={copyPollUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-white border rounded flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* History Section */}
      {history.length > 0 && (
        <CardFooter className="border-t flex-col items-start space-y-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-medium">Recent Decisions</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={exportHistory}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
          
          <div className="w-full space-y-2 max-h-48 overflow-y-auto">
            {history.slice(0, 5).map((decision) => (
              <div
                key={decision.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{decision.question}</div>
                  <div className="text-muted-foreground">
                    {new Date(decision.timestamp).toLocaleDateString()} • {decision.isPublic ? 'Public' : 'Private'}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded font-medium ${getResultColor(decision.result)}`}>
                  {decision.result}
                </div>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}