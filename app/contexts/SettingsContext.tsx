"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react"

// Define the user settings interface to match the API
interface UserSettings {
  // Display settings
  currentView: "day" | "week" | "month"
  compactness: number
  backgroundOpacity: number
  backgroundBlur: number
  backgroundImage: string
  customBackgroundUrl: string
  allDayEventDisplay: "full" | "compact"
  showTimeline: boolean
  
  // Time and date settings
  selectedTimeZone: string
  
  // UI preferences
  sidebarCollapsed: boolean
  sidebarTab: "calendar" | "calendars"
  
  // Calendar preferences
  selectedCalendarForNewEvents: string
  
  // Color preferences
  recentColors: string[]
  
  // Metadata
  lastUpdated: string
  version: string
}

// Default settings that will be used if no settings exist
const defaultSettings: UserSettings = {
  currentView: "week",
  compactness: 50,
  backgroundOpacity: 40,
  backgroundBlur: 0,
  backgroundImage: "mountain",
  customBackgroundUrl: "",
  allDayEventDisplay: "full",
  showTimeline: false,
  selectedTimeZone: "America/New_York",
  sidebarCollapsed: false,
  sidebarTab: "calendar",
  selectedCalendarForNewEvents: "primary",
  recentColors: [],
  lastUpdated: new Date().toISOString(),
  version: "1.0.0"
}

interface SettingsContextType {
  settings: UserSettings
  isLoading: boolean
  updateSettings: (updates: Partial<UserSettings>) => void
  loadSettings: (googleId: string) => Promise<void>
  addRecentColor: (color: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from API
  const loadSettings = useCallback(async (googleId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user-settings?googleId=${googleId}`)
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // If no settings exist, use defaults
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      // Fallback to defaults
      setSettings(defaultSettings)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update settings function (simplified without debouncing)
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    
    // Get googleId from localStorage or use a default
    const savedUser = localStorage.getItem("calendar_user")
    const googleId = savedUser ? JSON.parse(savedUser).id : "default"
    
    // Save settings immediately (no debouncing for now)
    const updatedSettings = { ...settings, ...updates, lastUpdated: new Date().toISOString() }
    
    fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId, settings: updatedSettings }),
    }).catch(error => {
      console.error("Error saving settings:", error)
    })
  }, [settings])

  // Add recent color function
  const addRecentColor = useCallback((color: string) => {
    setSettings(prev => {
      const recentColors = [color, ...prev.recentColors.filter(c => c !== color)].slice(0, 8)
      return { ...prev, recentColors }
    })
    
    // Get googleId from localStorage or use a default
    const savedUser = localStorage.getItem("calendar_user")
    const googleId = savedUser ? JSON.parse(savedUser).id : "default"
    
    const updatedSettings = { 
      ...settings, 
      recentColors: [color, ...settings.recentColors.filter(c => c !== color)].slice(0, 8) 
    }
    
    fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId, settings: updatedSettings }),
    }).catch(error => {
      console.error("Error saving settings:", error)
    })
  }, [settings.recentColors])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    settings,
    isLoading,
    updateSettings,
    loadSettings,
    addRecentColor,
  }), [settings, isLoading, updateSettings, loadSettings, addRecentColor])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 