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
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError("Failed to load settings")
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
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }, [googleId])

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