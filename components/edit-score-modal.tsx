"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Player {
  player_id: number
  player_name: string
  team_id?: number
  team_name?: string
  twos: number
  fives: number
  tens: number
  total_points: number
}

interface EditScoreModalProps {
  isOpen: boolean
  onClose: () => void
  player: Player | null
  eventId: string
  onSave: () => void
}

export function EditScoreModal({ isOpen, onClose, player, eventId, onSave }: EditScoreModalProps) {
  const [scores, setScores] = useState<{ twos: number; fives: number; tens: number }>({
    twos: 0,
    fives: 0,
    tens: 0
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (player) {
      setScores({
        twos: player.twos,
        fives: player.fives,
        tens: player.tens
      })
    }
  }, [player])

  const handleSave = async () => {
    if (!player) return

    try {
      setSaving(true)
      const response = await fetch(`/api/events/${eventId}/individual-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: player.player_id,
          twos: scores.twos,
          fives: scores.fives,
          tens: scores.tens
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update score')
      }

      toast({
        title: 'Success',
        description: 'Score updated successfully'
      })
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating score:', error)
      toast({
        title: 'Error',
        description: 'Failed to update score',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const totalPoints = scores.twos * 2 + scores.fives * 5 + scores.tens * 10

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Score
          </DialogTitle>
          <DialogDescription>
            Update scores for {player?.player_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twos">2-Pointers</Label>
            <Input
              id="twos"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              value={scores.twos}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                if (value >= 0) {
                  setScores(prev => ({ ...prev, twos: value }))
                }
              }}
              onKeyDown={(e) => {
                // Prevent non-numeric keys except backspace, delete, arrow keys, tab, enter
                if (!/[0-9]/.test(e.key) && 
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fives">5-Pointers</Label>
            <Input
              id="fives"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              value={scores.fives}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                if (value >= 0) {
                  setScores(prev => ({ ...prev, fives: value }))
                }
              }}
              onKeyDown={(e) => {
                // Prevent non-numeric keys except backspace, delete, arrow keys, tab, enter
                if (!/[0-9]/.test(e.key) && 
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tens">10-Pointers</Label>
            <Input
              id="tens"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              value={scores.tens}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                if (value >= 0) {
                  setScores(prev => ({ ...prev, tens: value }))
                }
              }}
              onKeyDown={(e) => {
                // Prevent non-numeric keys except backspace, delete, arrow keys, tab, enter
                if (!/[0-9]/.test(e.key) && 
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Points:</span>
              <span className="text-xl font-bold text-primary">{totalPoints}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 