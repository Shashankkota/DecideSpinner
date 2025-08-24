"use client"

import { useState } from "react"
import { Search, Moon, Sun, User, Settings, History, LogOut, Menu, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HowItWorksModal } from "@/components/HowItWorksModal"
import { AuthModal } from "@/components/AuthModal"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  const { user, status, logout } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [isPrivate, setIsPrivate] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const handleThemeToggle = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
    toast.success(`Switched to ${!isDark ? "dark" : "light"} mode`)
  }

  const handleAudienceToggle = () => {
    setIsPrivate(!isPrivate)
    toast.success(`Switched to ${!isPrivate ? "Private" : "Community"} mode`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      toast.success(`Searching for: "${searchQuery}"`)
      setSearchQuery("")
    }
  }

  const handleNewDecision = () => {
    const element = document.getElementById("decision-input")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(() => element.focus(), 300)
    }
    toast.success("Ready to make a new decision!")
  }

  const handleMyDecisions = () => {
    const element = document.getElementById("history-card")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    toast.success("Viewing your decision history")
  }

  const handleExamplesClick = () => {
    // First, scroll to the onboarding panel
    const onboardingPanel = document.querySelector('.space-y-6')
    if (onboardingPanel) {
      onboardingPanel.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    
    // Add a temporary highlight to the examples section
    const exampleButtons = document.querySelectorAll('button[class*="bg-secondary hover:bg-secondary/80"]')
    if (exampleButtons.length > 0) {
      exampleButtons.forEach((button, index) => {
        setTimeout(() => {
          button.classList.add('ring-2', 'ring-accent', 'ring-offset-2')
          setTimeout(() => {
            button.classList.remove('ring-2', 'ring-accent', 'ring-offset-2')
          }, 2000)
        }, index * 200)
      })
      toast.success("Check out these example questions!")
    } else {
      toast.info("Scroll down to see example questions in the help panel")
    }
  }

  const handleLogin = () => {
    setAuthModalMode('login')
    setShowAuthModal(true)
  }

  const handleRegister = () => {
    setAuthModalMode('register')
    setShowAuthModal(true)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  return (
    <>
      <header className={`w-full bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 ${className}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
            <span className="font-heading font-semibold text-lg text-foreground">DecisionMaker</span>
          </div>

          {/* Center: Search and Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 h-9 bg-background/50"
                aria-label="Search decisions"
              />
            </form>
            
            <nav className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowHowItWorks(true)}
              >
                How it works
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleExamplesClick}
              >
                Examples
              </Button>
            </nav>
          </div>

          {/* Right: Controls and Profile */}
          <div className="flex items-center gap-3">
            {/* Audience Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAudienceToggle}
              className={`h-8 px-3 text-xs font-medium ${
                isPrivate 
                  ? "bg-muted text-muted-foreground" 
                  : "bg-accent text-accent-foreground"
              }`}
              aria-label={`Currently ${isPrivate ? "private" : "community"} mode`}
            >
              {isPrivate ? "Private" : "Community"}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className="h-8 w-8 p-0"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* New Decision Button */}
            <Button
              onClick={handleNewDecision}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 font-medium"
            >
              New Decision
            </Button>

            {/* Authentication Section */}
            {!isAuthenticated ? (
              // Show login/register buttons when not authenticated
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogin}
                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegister}
                  className="h-8 px-3"
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            ) : (
              // Show profile menu when authenticated
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full"
                    aria-label="Open profile menu"
                    disabled={isLoading}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={`${user?.name}'s avatar`} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                        {user?.name ? getUserInitials(user.name) : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="font-medium text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => toast.info("Settings page coming soon")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleMyDecisions}
                    className="cursor-pointer"
                  >
                    <History className="mr-2 h-4 w-4" />
                    My Decisions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    disabled={isLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <HowItWorksModal 
        open={showHowItWorks} 
        onOpenChange={setShowHowItWorks} 
      />

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        initialMode={authModalMode}
      />
    </>
  )
}