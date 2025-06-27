import { NextRequest, NextResponse } from "next/server"

// Fallback in-memory storage for when KV is not available
const fallbackStorage = new Map<string, string>()

// Mock default settings
const defaultSettings = {
  theme: "light",
  timeFormat: "12h",
  defaultView: "week",
  notifications: {
    email: true,
    push: true,
    sound: true,
  },
  calendarSettings: {
    showWeekends: true,
    showHolidays: true,
    defaultDuration: 60, // minutes
  },
  displaySettings: {
    showWeather: true,
    showTasks: true,
    compactMode: false,
    backgroundBlur: 8,
  },
}

// Helper function to safely access KV
async function getKV() {
  try {
    const { kv } = await import("@vercel/kv")
    return kv
  } catch (error) {
    console.warn("Vercel KV not available, using fallback storage:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const googleId = searchParams.get("googleId")

  if (!googleId) {
    return NextResponse.json(
      { error: "Google ID is required" },
      { status: 400 }
    )
  }

  try {
    const kv = await getKV()
    let storedSettings: string | null = null
    
    if (kv) {
      // Try to get settings from KV
      storedSettings = await kv.get(googleId)
    } else {
      // Use fallback storage
      storedSettings = fallbackStorage.get(googleId) || null
    }
    
    if (!storedSettings) {
      // If no settings exist, return defaults
      return NextResponse.json(defaultSettings)
    }

    // Parse and return stored settings
    const settings = JSON.parse(storedSettings)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { googleId, settings } = body

    if (!googleId || !settings) {
      return NextResponse.json(
        { error: "Google ID and settings are required" },
        { status: 400 }
      )
    }

    // Merge with defaults and store
    const updatedSettings = {
      ...defaultSettings,
      ...settings,
    }

    const settingsString = JSON.stringify(updatedSettings)
    const kv = await getKV()
    
    if (kv) {
      // Store in KV
      await kv.set(googleId, settingsString)
    } else {
      // Store in fallback storage
      fallbackStorage.set(googleId, settingsString)
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
} 