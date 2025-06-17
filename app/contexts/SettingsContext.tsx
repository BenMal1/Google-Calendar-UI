"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useDebounce } from "../hooks/useDebounce"

interface UserSettings {
  theme: string
  timeFormat: string
  defaultView: string
  notifications: {
    email: boolean
    push: boolean
    sound: boolean
  }
  calendarSettings: {
    showWeekends: boolean
    showHolidays: boolean
    defaultDuration: number
  }
  displaySettings: {
    showWeather: boolean
    showTasks: boolean
    compactMode: boolean
    backgroundBlur?: number
  }
}

interface SettingsContextType {
  settings: UserSettings | null
  isLoading: boolean
  error: string | null
  saveSettings: (updates: Partial<UserSettings>) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children, googleId }: { children: ReactNode; googleId: string | null }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('calendar_settings')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (err) {
          console.error('Error parsing saved settings:', err)
        }
      }
    }
  }, [])

  // Fetch settings
  const fetchSettings = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/user-settings?googleId=${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }
      const data = await response.json()
      setSettings(data)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('calendar_settings', JSON.stringify(data))
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError("Failed to load settings")
      // If API fails, try to load from localStorage
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('calendar_settings')
        if (savedSettings) {
          try {
            setSettings(JSON.parse(savedSettings))
          } catch (parseErr) {
            console.error('Error parsing saved settings:', parseErr)
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!googleId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/user-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleId,
          settings: updates,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const { settings: updatedSettings } = await response.json()
      setSettings(updatedSettings)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('calendar_settings', JSON.stringify(updatedSettings))
      }
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("Failed to save settings")
      // If API fails, still update localStorage
      if (settings && typeof window !== 'undefined') {
        const updatedSettings = { ...settings, ...updates }
        localStorage.setItem('calendar_settings', JSON.stringify(updatedSettings))
      }
    } finally {
      setIsLoading(false)
    }
  }, [googleId, settings])

  // Debounced save function
  const debouncedSaveSettings = useDebounce(updateSettings, 300)

  // Save settings with immediate local update
  const saveSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!settings) return

      // Update local state immediately
      setSettings({
        ...settings,
        ...updates,
      })

      // Debounce the API call
      await debouncedSaveSettings(updates)
    },
    [settings, debouncedSaveSettings]
  )

  // Fetch settings when googleId changes
  useEffect(() => {
    if (googleId) {
      fetchSettings(googleId)
    }
  }, [googleId, fetchSettings])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        saveSettings,
      }}
    >
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