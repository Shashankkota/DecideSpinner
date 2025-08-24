"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Search, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Play, 
  Eye, 
  Copy, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Circle
} from 'lucide-react'
import { toast } from 'sonner'

interface DecisionOption {
  label: string
  weight: number
  color: string
}

interface HistoryRecord {
  id: string
  question: string
  options: DecisionOption[]
  result: string
  resultColor: string
  audience: 'private' | 'community'
  pollId?: string
  timestamp: number
  note?: string
}

type FilterType = 'all' | 'private' | 'community'

const ITEMS_PER_PAGE = 8
const STORAGE_KEY = 'decision-maker-history'

// Deterministic random function for replay
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export default function DecisionHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [replayingRows, setReplayingRows] = useState<Set<string>>(new Set())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHistory(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      toast.error('Failed to load decision history')
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save history:', error)
      toast.error('Failed to save decision history')
    }
  }, [history])

  // Filter and search history
  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const matchesSearch = record.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.result.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filter === 'all' || record.audience === filter
      return matchesSearch && matchesFilter
    })
  }, [history, searchQuery, filter])

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const toggleRowExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleReplay = async (record: HistoryRecord) => {
    setReplayingRows(prev => new Set(prev).add(record.id))
    
    try {
      // Simulate deterministic spin with same weights
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Use seeded random to get same result
      const seed = record.timestamp + record.options.length
      const random = seededRandom(seed)
      const totalWeight = record.options.reduce((sum, opt) => sum + opt.weight, 0)
      
      let runningWeight = 0
      let selectedOption = record.options[0]
      
      for (const option of record.options) {
        runningWeight += option.weight
        if (random <= runningWeight / totalWeight) {
          selectedOption = option
          break
        }
      }

      // Create new history entry for the replay
      const newRecord: HistoryRecord = {
        ...record,
        id: Date.now().toString(),
        timestamp: Date.now(),
        result: selectedOption.label,
        resultColor: selectedOption.color,
        note: `Replay of "${record.question}"`
      }

      setHistory(prev => [newRecord, ...prev])
      toast.success(`Replayed: ${selectedOption.label}`)
    } catch (error) {
      toast.error('Failed to replay decision')
    } finally {
      setReplayingRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(record.id)
        return newSet
      })
    }
  }

  const handleCopyLink = (record: HistoryRecord) => {
    if (record.pollId) {
      const url = `${window.location.origin}/poll/${record.pollId}`
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Poll link copied to clipboard')
      }).catch(() => {
        toast.error('Failed to copy link')
      })
    } else {
      toast.error('No shareable link available for private decisions')
    }
  }

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(record => record.id !== id))
    setDeleteConfirmId(null)
    toast.success('Decision deleted')
  }

  const handleClearAll = () => {
    setHistory([])
    setShowClearConfirm(false)
    setExpandedRows(new Set())
    setCurrentPage(1)
    toast.success('All decision history cleared')
  }

  const handleExportCSV = () => {
    try {
      if (filteredHistory.length === 0) {
        toast.error('No decisions to export')
        return
      }

      const headers = ['Question', 'Result', 'Audience', 'Date', 'Options', 'Note']
      const csvContent = [
        headers.join(','),
        ...filteredHistory.map(record => [
          `"${record.question.replace(/"/g, '""')}"`,
          `"${record.result.replace(/"/g, '""')}"`,
          record.audience,
          new Date(record.timestamp).toISOString(),
          `"${record.options.map(opt => `${opt.label}:${opt.weight}`).join(';')}"`,
          `"${(record.note || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `decision-history-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      
      toast.success('Decision history exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export decision history')
    }
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-xl">Decision History</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredHistory.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                disabled={history.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'private', 'community'] as FilterType[]).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="capitalize"
                >
                  {filterType}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paginatedHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {history.length === 0 ? 'No decisions made yet' : 'No decisions match your search'}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedHistory.map((record) => (
                <Collapsible 
                  key={record.id}
                  open={expandedRows.has(record.id)}
                  onOpenChange={() => toggleRowExpanded(record.id)}
                >
                  <div className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Circle 
                          className="h-3 w-3 flex-shrink-0" 
                          style={{ fill: record.resultColor, color: record.resultColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {truncateText(record.question, 50)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {record.result}
                            </Badge>
                            <Badge 
                              variant={record.audience === 'community' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {record.audience}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(record.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedRows.has(record.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleRowExpanded(record.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {expandedRows.has(record.id) ? 'Hide' : 'View'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleReplay(record)}
                              disabled={replayingRows.has(record.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {replayingRows.has(record.id) ? 'Replaying...' : 'Re-run'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCopyLink(record)}
                              disabled={!record.pollId}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(record.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <CollapsibleContent className="mt-4 pt-4 border-t">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Full Question</h4>
                          <p className="text-sm text-muted-foreground">{record.question}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Options & Weights</h4>
                          <div className="space-y-2">
                            {record.options.map((option, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Circle 
                                    className="h-2 w-2" 
                                    style={{ fill: option.color, color: option.color }}
                                  />
                                  <span className="text-sm">{option.label}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  Weight: {option.weight}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {record.note && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Note</h4>
                            <p className="text-sm text-muted-foreground">{record.note}</p>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReplay(record)}
                          disabled={replayingRows.has(record.id)}
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {replayingRows.has(record.id) ? 'Replaying...' : 'Replay Decision'}
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Decision</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this decision? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all decision history? This will permanently delete all {history.length} decisions and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}