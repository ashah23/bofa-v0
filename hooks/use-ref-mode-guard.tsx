"use client"

import { useRefMode } from "@/components/ref-mode-context"
import { useToast } from "@/hooks/use-toast"

export function useRefModeGuard() {
  const { isRefMode } = useRefMode()
  const { toast } = useToast()

  const guardRefMode = (action: () => void | Promise<void>, actionName: string = "this action") => {
    if (!isRefMode) {
      toast({
        title: "Ref Mode Required",
        description: `Ref mode must be enabled to perform ${actionName}. Please enable ref mode in your profile settings.`,
        variant: "destructive"
      })
      return false
    }
    
    try {
      const result = action()
      if (result instanceof Promise) {
        return result
      }
      return true
    } catch (error) {
      console.error(`Error in ref mode guarded action:`, error)
      toast({
        title: "Error",
        description: `Failed to perform ${actionName}`,
        variant: "destructive"
      })
      return false
    }
  }

  const guardRefModeAsync = async (action: () => Promise<void>, actionName: string = "this action") => {
    if (!isRefMode) {
      toast({
        title: "Ref Mode Required",
        description: `Ref mode must be enabled to perform ${actionName}. Please enable ref mode in your profile settings.`,
        variant: "destructive"
      })
      return false
    }
    
    try {
      await action()
      return true
    } catch (error) {
      console.error(`Error in ref mode guarded async action:`, error)
      toast({
        title: "Error",
        description: `Failed to perform ${actionName}`,
        variant: "destructive"
      })
      return false
    }
  }

  return {
    isRefMode,
    guardRefMode,
    guardRefModeAsync
  }
} 