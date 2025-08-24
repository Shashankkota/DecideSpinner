"use client"

import React, { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { 
  Copy, 
  ExternalLink, 
  Download, 
  QrCode, 
  Code, 
  Link as LinkIcon,
  Eye,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  title?: string
}

export default function ShareModal({ 
  open, 
  onOpenChange, 
  shareUrl,
  title = "Shared Decision"
}: ShareModalProps) {
  const [isPrivate, setIsPrivate] = useState(false)
  const [qrSize, setQrSize] = useState([200])
  const [showTitle, setShowTitle] = useState(true)
  const [hideActions, setHideActions] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Generate QR code data URL
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const generateQR = async () => {
      try {
        // Simple QR code generation using a data URL approach
        // In production, you'd use a proper QR library like qrcode
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const size = qrSize[0]
        canvas.width = size
        canvas.height = size
        
        if (ctx) {
          // Create a simple placeholder QR pattern
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, size, size)
          ctx.fillStyle = '#000000'
          
          // Simple grid pattern as QR placeholder
          const cellSize = size / 25
          for (let i = 0; i < 25; i++) {
            for (let j = 0; j < 25; j++) {
              if ((i + j) % 3 === 0 || (i === 0 || i === 24 || j === 0 || j === 24)) {
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
              }
            }
          }
          
          setQrDataUrl(canvas.toDataURL('image/png'))
        }
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }

    generateQR()
  }, [qrSize, shareUrl])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleOpenUrl = () => {
    if (typeof window !== "undefined") {
      window.open(shareUrl, '_blank')
    }
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl) return
    
    try {
      const link = document.createElement('a')
      link.download = `qr-code-${Date.now()}.png`
      link.href = qrDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("QR code downloaded")
    } catch (error) {
      toast.error("Failed to download QR code")
    }
  }

  const generateEmbedCode = () => {
    const params = new URLSearchParams()
    if (!showTitle) params.set('hideTitle', 'true')
    if (hideActions) params.set('hideActions', 'true')
    
    const embedUrl = `${shareUrl}/embed${params.toString() ? '?' + params.toString() : ''}`
    
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`
  }

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode())
      toast.success("Embed code copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy embed code")
    }
  }

  const getSizeLabel = (size: number) => {
    if (size <= 150) return "Small"
    if (size <= 250) return "Medium"
    return "Large"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Share Decision</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="privacy-toggle" className="text-sm font-medium">
                  Private Link
                </Label>
                <p className="text-xs text-muted-foreground" id="privacy-description">
                  {isPrivate ? "Only you can access this link" : "Anyone with the link can view"}
                </p>
              </div>
              <Switch
                id="privacy-toggle"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                aria-describedby="privacy-description"
              />
            </div>

            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR
                </TabsTrigger>
                <TabsTrigger value="embed" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Embed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="share-url">Share URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="share-url"
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleCopyUrl}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleOpenUrl}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4 mt-6">
                <div className="flex flex-col items-center space-y-4">
                  {qrDataUrl && (
                    <div className="bg-white p-4 rounded-lg border">
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code" 
                        className="block"
                        style={{ width: qrSize[0], height: qrSize[0] }}
                      />
                    </div>
                  )}
                  
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Size</Label>
                      <span className="text-sm text-muted-foreground">
                        {getSizeLabel(qrSize[0])}
                      </span>
                    </div>
                    <Slider
                      value={qrSize}
                      onValueChange={setQrSize}
                      max={300}
                      min={100}
                      step={50}
                      className="w-full"
                    />
                  </div>

                  <Button 
                    onClick={handleDownloadQR}
                    className="w-full"
                    disabled={!qrDataUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="embed" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-title">Show Title</Label>
                      <Switch
                        id="show-title"
                        checked={showTitle}
                        onCheckedChange={setShowTitle}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hide-actions">Hide Actions</Label>
                      <Switch
                        id="hide-actions"
                        checked={hideActions}
                        onCheckedChange={setHideActions}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="embed-code">Embed Code</Label>
                    <Textarea
                      id="embed-code"
                      value={generateEmbedCode()}
                      readOnly
                      className="font-mono text-xs resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCopyEmbed}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                Report abuse
              </button>
              <span>•</span>
              <button className="hover:text-foreground transition-colors">
                Terms
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Embed Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg">
            <div className="bg-white rounded border" style={{ height: '400px' }}>
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Embed preview would appear here</p>
                  <p className="text-xs mt-1">
                    {showTitle ? "With title" : "Without title"} • {hideActions ? "Actions hidden" : "Actions visible"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}