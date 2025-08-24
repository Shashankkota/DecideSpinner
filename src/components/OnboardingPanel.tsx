"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, X, Minimize2, Maximize2, Copy } from "lucide-react"
import { toast } from "sonner"

const EXAMPLES = [
  "Should I take the new job offer or stay at my current company?",
  "What should I have for dinner tonight: pizza, sushi, or cook at home?"
]

const FAQ_ITEMS = [
  {
    question: "How do votes stay anonymous?",
    answer: "All votes are collected without storing any personal information. We only track the vote itself, not who cast it, ensuring complete anonymity for all participants."
  },
  {
    question: "How do I share my decision?",
    answer: "Once you create a decision, you'll get a unique link that you can share via social media, email, or messaging apps. Anyone with the link can vote on your decision."
  },
  {
    question: "Where is my data stored?",
    answer: "All your decisions and preferences are stored locally in your browser. Nothing is sent to our servers unless you explicitly choose to share a decision publicly."
  }
]

export default function OnboardingPanel() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("onboarding-minimized")
      if (saved === "true") {
        setIsMinimized(true)
      }
    }
  }, [])

  const handleMinimizeToggle = () => {
    const newState = !isMinimized
    setIsMinimized(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding-minimized", String(newState))
    }
  }

  const handleExampleClick = async (example: string) => {
    try {
      await navigator.clipboard.writeText(example)
      toast.success("Question copied to clipboard!")
      
      // Attempt to focus the question input
      const questionInput = document.querySelector('#question-input') as HTMLElement
      if (questionInput) {
        questionInput.focus()
        if ('value' in questionInput) {
          (questionInput as HTMLInputElement).value = example
        }
      } else {
        toast.info("Paste the question into the input field above")
      }
    } catch (error) {
      toast.error("Failed to copy question")
    }
  }

  const handleCreateDecision = () => {
    const decisionArea = document.querySelector('#decision-maker') as HTMLElement
    if (decisionArea) {
      decisionArea.scrollIntoView({ behavior: 'smooth' })
      decisionArea.focus()
      toast.success("Ready to create your first decision!")
    } else {
      toast.info("Scroll up to find the decision maker")
    }
  }

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  if (isMinimized) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Quick Help</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimizeToggle}
            className="h-8 w-8 p-0"
            aria-label="Expand help panel"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading text-foreground">
            Get Started Quickly
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimizeToggle}
            className="h-8 w-8 p-0"
            aria-label="Minimize help panel"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <p className="text-sm text-foreground">Type your question or decision</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <p className="text-sm text-foreground">Choose Private or Community voting</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <p className="text-sm text-foreground">Spin the wheel and share your decision</p>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Try these examples:</h4>
          <div className="space-y-2">
            {EXAMPLES.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left p-3 bg-secondary hover:bg-secondary/80 rounded-md text-sm text-secondary-foreground transition-colors group flex items-start gap-2"
              >
                <Copy className="h-3 w-3 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="flex-1">{example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Frequently Asked</h4>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <Collapsible
                key={index}
                open={openFaqItems.includes(index)}
                onOpenChange={() => toggleFaqItem(index)}
              >
                <CollapsibleTrigger
                  className="w-full flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium text-left transition-colors"
                  aria-expanded={openFaqItems.includes(index)}
                >
                  <span>{item.question}</span>
                  {openFaqItems.includes(index) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <div className="px-3 pb-3 pt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button 
          onClick={handleCreateDecision}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
        >
          Create Your First Decision
        </Button>
      </CardContent>
    </Card>
  )
}