"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

const RESET_PASSCODE = "BEER"

interface ResetPasscodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  actionName: string
}

export function ResetPasscodeDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  actionName 
}: ResetPasscodeDialogProps) {
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (passcode === RESET_PASSCODE) {
      setPasscodeError(false)
      onConfirm()
      handleClose()
    } else {
      setPasscodeError(true)
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setPasscode('')
    setPasscodeError(false)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode">
              Enter passcode to confirm {actionName}
            </Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value)
                if (passcodeError) setPasscodeError(false)
              }}
              placeholder="Enter passcode"
              className={passcodeError ? 'border-red-500' : ''}
              autoFocus
            />
            {passcodeError && (
              <p className="text-sm text-red-500">
                Incorrect passcode. Please try again.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Confirming...' : `Confirm ${actionName}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 