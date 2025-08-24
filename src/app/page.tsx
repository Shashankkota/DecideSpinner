"use client"

import { useState, useEffect } from "react"
import { AuthProvider } from "@/lib/auth-context"
import Header from "@/components/Header"
import DecisionMaker from "@/components/DecisionMaker"
import CommunityPoll from "@/components/CommunityPoll"
import DecisionHistory from "@/components/DecisionHistory"
import ShareModal from "@/components/ShareModal"
import OnboardingPanel from "@/components/OnboardingPanel"

export default function HomePage() {
  const [showCommunityPanel, setShowCommunityPanel] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [currentPollId, setCurrentPollId] = useState<string | undefined>()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const pollId = params.get("poll")
      
      if (pollId) {
        setCurrentPollId(pollId)
        setShowCommunityPanel(true)
      }
    }
  }, [])

  const handleToggleCommunityPanel = () => {
    setShowCommunityPanel(!showCommunityPanel)
  }

  const handleShareDecision = (url: string) => {
    setShareUrl(url)
    setShareModalOpen(true)
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div id="decision-maker">
                <DecisionMaker />
              </div>
              
              {showCommunityPanel && (
                <div className="animate-in fade-in-50 duration-300">
                  <CommunityPoll 
                    initialPollId={currentPollId}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <OnboardingPanel />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <div id="history-card">
                <DecisionHistory />
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <span>© 2024 DecisionMaker</span>
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Support</a>
              </div>
              <div className="flex items-center gap-4">
                <span>Made with ❤️ for better decisions</span>
              </div>
            </div>
          </div>
        </footer>

        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          shareUrl={shareUrl}
          title="Shared Decision"
        />
      </div>
    </AuthProvider>
  )
}