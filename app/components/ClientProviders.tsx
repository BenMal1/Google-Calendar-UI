"use client"

import { SettingsProvider } from "../contexts/SettingsContext"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  )
} 