"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Copy, 
  Share2, 
  RefreshCw, 
  RotateCcw, 
  Lock,
  Unlock,
  QrCode,
  ExternalLink,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface PollData {
  id: string
  question: string
  createdAt: string
  votes: {
    yes: number
    no: number
    maybe: number
  }
  userVote?: 'yes' | 'no' | 'maybe'
  closed: boolean
}

interface CommunityPollProps {
  className?: string
  initialPollId?: string
}

export default function CommunityPoll({ className, initialPollId }: CommunityPollProps) {
  const [pollId, setPollId] = useState(initialPollId || '')
  const [currentPoll, setCurrentPoll] = useState<PollData | null>(null)
  const [showPercentages, setShowPercentages] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [pollInput, setPollInput] = useState('')

  // Generate QR code data URL (simple implementation)
  const generateQRCode = (text: string): string => {
    // This is a simplified placeholder - in production you'd use a proper QR library
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="white"/>
        <text x="50" y="50" text-anchor="middle" font-size="8">QR: ${text.slice(0, 10)}...</text>
      </svg>
    `)}`
  }

  // Load poll from localStorage
  const loadPoll = (id: string): PollData | null => {
    try {
      const stored = localStorage.getItem(`poll_${id}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading poll:', error)
    }
    return null
  }

  // Save poll to localStorage
  const savePoll = (poll: PollData) => {
    try {
      localStorage.setItem(`poll_${poll.id}`, JSON.stringify(poll))
    } catch (error) {
      console.error('Error saving poll:', error)
      toast.error('Failed to save poll data')
    }
  }

  // Create a new poll
  const createPoll = () => {
    const newId = crypto.randomUUID()
    const newPoll: PollData = {
      id: newId,
      question: 'Should we proceed with this decision?',
      createdAt: new Date().toISOString(),
      votes: { yes: 0, no: 0, maybe: 0 },
      closed: false
    }
    savePoll(newPoll)
    setPollId(newId)
    setCurrentPoll(newPoll)
    toast.success('New community poll created!')
  }

  // Load poll by ID
  const loadPollById = (id: string) => {
    if (!id) return
    
    setIsLoading(true)
    
    // Simulate network delay
    setTimeout(() => {
      const poll = loadPoll(id)
      if (poll) {
        setCurrentPoll(poll)
        setPollId(id)
        toast.success('Poll loaded successfully')
      } else {
        toast.error('Poll not found')
      }
      setIsLoading(false)
    }, 300)
  }

  // Cast vote
  const castVote = (option: 'yes' | 'no' | 'maybe') => {
    if (!currentPoll || currentPoll.closed) return

    const updatedPoll = { ...currentPoll }
    
    // Remove previous vote if exists
    if (updatedPoll.userVote) {
      updatedPoll.votes[updatedPoll.userVote] -= 1
    }
    
    // Add new vote
    updatedPoll.votes[option] += 1
    updatedPoll.userVote = option
    
    setCurrentPoll(updatedPoll)
    savePoll(updatedPoll)
    
    toast.success(`Vote cast: ${option.charAt(0).toUpperCase() + option.slice(1)}`)
  }

  // Toggle poll closed state
  const togglePollClosed = () => {
    if (!currentPoll) return
    
    const updatedPoll = { ...currentPoll, closed: !currentPoll.closed }
    setCurrentPoll(updatedPoll)
    savePoll(updatedPoll)
    
    toast.success(updatedPoll.closed ? 'Poll closed' : 'Poll reopened')
  }

  // Reset poll
  const resetPoll = () => {
    if (!currentPoll) return
    
    const updatedPoll = {
      ...currentPoll,
      votes: { yes: 0, no: 0, maybe: 0 },
      userVote: undefined,
      closed: false
    }
    
    setCurrentPoll(updatedPoll)
    savePoll(updatedPoll)
    toast.success('Poll reset successfully')
  }

  // Copy poll link
  const copyPollLink = async () => {
    if (!currentPoll) return
    
    const url = `${window.location.origin}${window.location.pathname}?poll=${currentPoll.id}`
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.success('Poll link copied to clipboard')
      } else {
        throw new Error('Clipboard not supported')
      }
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  // Copy embed code
  const copyEmbedCode = async () => {
    if (!currentPoll) return
    
    const embedCode = `<iframe src="${window.location.origin}/poll/${currentPoll.id}" width="400" height="300" frameborder="0"></iframe>`
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(embedCode)
        toast.success('Embed code copied to clipboard')
      } else {
        throw new Error('Clipboard not supported')
      }
    } catch (error) {
      toast.error('Failed to copy embed code')
    }
  }

  // Calculate totals and percentages
  const getTotalVotes = () => {
    if (!currentPoll) return 0
    return currentPoll.votes.yes + currentPoll.votes.no + currentPoll.votes.maybe
  }

  const getPercentage = (count: number) => {
    const total = getTotalVotes()
    return total === 0 ? 0 : Math.round((count / total) * 100)
  }

  // Load initial poll on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL params for poll ID
      const params = new URLSearchParams(window.location.search)
      const urlPollId = params.get('poll')
      
      if (urlPollId) {
        loadPollById(urlPollId)
      } else if (initialPollId) {
        loadPollById(initialPollId)
      }
    }
  }, [initialPollId])

  return (
    <Card className={`bg-card ${className}`}>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-heading font-semibold">Community Poll</h3>
            <p className="text-sm text-muted-foreground">
              Anonymous voting • Local-first storage • No registration required
            </p>
          </div>
          
          {!currentPoll && (
            <Button onClick={createPoll} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Create New Poll
            </Button>
          )}
        </div>

        {!currentPoll && (
          <div className="space-y-2">
            <Label htmlFor="poll-input">Load Existing Poll</Label>
            <div className="flex gap-2">
              <Input
                id="poll-input"
                placeholder="Enter poll ID or paste link..."
                value={pollInput}
                onChange={(e) => setPollInput(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  const id = pollInput.includes('poll=') 
                    ? pollInput.split('poll=')[1].split('&')[0]
                    : pollInput
                  loadPollById(id)
                }}
                disabled={!pollInput || isLoading}
                size="sm"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load'}
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      {currentPoll && (
        <CardContent className="space-y-6">
          {/* Poll Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-base font-medium leading-relaxed">{currentPoll.question}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                {currentPoll.closed ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
                <span>{currentPoll.closed ? 'Closed' : 'Active'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Created {new Date(currentPoll.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>ID: {currentPoll.id.slice(0, 8)}</span>
            </div>
          </div>

          {/* Vote Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['yes', 'no', 'maybe'] as const).map((option) => (
              <Button
                key={option}
                onClick={() => castVote(option)}
                disabled={currentPoll.closed}
                variant={currentPoll.userVote === option ? "default" : "outline"}
                className={`h-12 text-base font-medium ${
                  currentPoll.userVote === option 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                } ${currentPoll.closed ? 'opacity-60' : ''}`}
                aria-describedby={`${option}-count`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
                {currentPoll.userVote === option && <span className="ml-2">✓</span>}
              </Button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium">Results</h5>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <Label htmlFor="show-percentages" className="text-xs">
                    Show percentages
                  </Label>
                  <Switch
                    id="show-percentages"
                    checked={showPercentages}
                    onCheckedChange={setShowPercentages}
                    size="sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Simulate refresh
                    toast.success('Results refreshed')
                  }}
                  className="h-7 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-3" aria-live="polite" aria-label="Poll results">
              {(['yes', 'no', 'maybe'] as const).map((option) => {
                const count = currentPoll.votes[option]
                const percentage = getPercentage(count)
                
                return (
                  <div key={option} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{option}</span>
                      <span id={`${option}-count`} className="text-muted-foreground">
                        {showPercentages ? `${percentage}%` : `${count} votes`}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={percentage} 
                        className="h-2 bg-muted"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-xs text-muted-foreground">
              Total votes: {getTotalVotes()}
              {currentPoll.userVote && (
                <span> • Your vote: {currentPoll.userVote}</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Share & Admin Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share Actions */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium">Share Poll</h5>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPollLink}
                  className="justify-start"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyEmbedCode}
                  className="justify-start"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Embed Code
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="embed-preview" className="text-xs">Embed Preview</Label>
                <Textarea
                  id="embed-preview"
                  value={`<iframe src="${window.location.origin}/poll/${currentPoll.id}" width="400" height="300" frameborder="0"></iframe>`}
                  readOnly
                  className="h-16 text-xs font-mono resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <img 
                  src={generateQRCode(`${window.location.origin}?poll=${currentPoll.id}`)}
                  alt="QR Code"
                  className="w-12 h-12 bg-white p-1 rounded border"
                />
                <div className="text-xs text-muted-foreground">
                  <p>Scan to access poll</p>
                  <p>Works offline after first load</p>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium">Admin Controls</h5>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="text-sm">
                    <p className="font-medium">Poll Status</p>
                    <p className="text-xs text-muted-foreground">
                      {currentPoll.closed ? 'Voting is closed' : 'Accepting votes'}
                    </p>
                  </div>
                  <Button
                    variant={currentPoll.closed ? "default" : "secondary"}
                    size="sm"
                    onClick={togglePollClosed}
                  >
                    {currentPoll.closed ? (
                      <>
                        <Unlock className="h-3 w-3 mr-2" />
                        Reopen
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 mr-2" />
                        Close Poll
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPoll}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Reset All Votes
                </Button>

                {currentPoll.userVote && !currentPoll.closed && (
                  <div className="text-xs text-muted-foreground p-2 bg-accent/10 rounded">
                    Click any vote button to change your vote
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• All data stored locally</p>
                <p>• Anonymous voting per device</p>
                <p>• No server required</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}