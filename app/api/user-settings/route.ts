import { NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

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
    // Try to get settings from KV
    const storedSettings = await kv.get(googleId)
    
    if (!storedSettings) {
      // If no settings exist, return defaults
      return NextResponse.json(defaultSettings)
    }

    // Parse and return stored settings
    const settings = JSON.parse(storedSettings as string)
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

    // Merge with defaults and store in KV
    const updatedSettings = {
      ...defaultSettings,
      ...settings,
    }

    await kv.set(googleId, JSON.stringify(updatedSettings))

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