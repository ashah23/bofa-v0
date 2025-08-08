"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RefModeContextType {
  isRefMode: boolean
  toggleRefMode: () => void
  setRefMode: (enabled: boolean) => void
}

const RefModeContext = createContext<RefModeContextType | undefined>(undefined)

const REF_MODE_PASSCODE = "BEER"

export function RefModeProvider({ children }: { children: React.ReactNode }) {
  const [isRefMode, setIsRefMode] = useState(false)
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState(false)
  const { toast } = useToast()

  // Load ref mode state from localStorage on mount
  useEffect(() => {
    const savedRefMode = localStorage.getItem('refMode')
    if (savedRefMode !== null) {
      setIsRefMode(JSON.parse(savedRefMode))
    }
  }, [])

  // Save ref mode state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('refMode', JSON.stringify(isRefMode))
  }, [isRefMode])

  const handleToggleRefMode = () => {
    if (isRefMode) {
      // Disabling ref mode doesn't require passcode
      setIsRefMode(false)
      toast({
        title: "Ref Mode Disabled",
        description: "Ref mode has been disabled. POST actions are now restricted.",
      })
    } else {
      // Enabling ref mode requires passcode
      setShowPasscodeDialog(true)
    }
  }

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passcode.toUpperCase() === REF_MODE_PASSCODE) {
      setIsRefMode(true)
      setShowPasscodeDialog(false)
      setPasscode('')
      setPasscodeError(false)
      toast({
        title: "Ref Mode Enabled",
        description: "Ref mode has been enabled. You can now perform POST actions.",
      })
    } else {
      setPasscodeError(true)
      setPasscode('')
    }
  }

  const handleCancelPasscode = () => {
    setShowPasscodeDialog(false)
    setPasscode('')
    setPasscodeError(false)
  }

  const toggleRefMode = () => {
    handleToggleRefMode()
  }

  const setRefMode = (enabled: boolean) => {
    if (enabled && !isRefMode) {
      // Enabling requires passcode
      handleToggleRefMode()
    } else if (!enabled && isRefMode) {
      // Disabling is allowed
      setIsRefMode(false)
      toast({
        title: "Ref Mode Disabled",
        description: "Ref mode has been disabled. POST actions are now restricted.",
      })
    }
  }

  return (
    <RefModeContext.Provider value={{ isRefMode, toggleRefMode, setRefMode }}>
      {children}
      
      {/* Passcode Dialog */}
      <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Enter Ref Mode Passcode
            </DialogTitle>
            <DialogDescription>
              Enter the passcode to enable referee mode and unlock POST actions.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value)
                  setPasscodeError(false)
                }}
                placeholder="Enter passcode"
                className={passcodeError ? "border-red-500" : ""}
                autoFocus
              />
              {passcodeError && (
                <p className="text-sm text-red-500">Incorrect passcode. Please try again.</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancelPasscode}>
                Cancel
              </Button>
              <Button type="submit">
                <Shield className="h-4 w-4 mr-2" />
                Enable Ref Mode
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RefModeContext.Provider>
  )
}

export function useRefMode() {
  const context = useContext(RefModeContext)
  if (context === undefined) {
    throw new Error('useRefMode must be used within a RefModeProvider')
  }
  return context
} 