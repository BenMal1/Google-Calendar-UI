"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Calendar,
  Upload,
  Link,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Eye,
  EyeOff,
  CheckCircle,
  Repeat,
  X,
  ChevronDown,
} from "lucide-react"

// Google OAuth configuration - make it optional
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const isGoogleAuthEnabled =
  GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "your-google-client-id" && GOOGLE_CLIENT_ID.trim() !== ""

interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
  given_name: string
  family_name: string
  accessToken?: string
}

// Update the GoogleCalendarEvent interface to include calendarColor
interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  colorId?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  organizer?: {
    email: string
    displayName?: string
  }
  calendarId: string
  calendarColor?: string
  recurringEventId?: string
  recurrence?: string[]
}

// Update the event interface to include exactColor
// Add this to your existing event type or create a new interface
interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  color: string
  exactColor: string | null
  day: number
  month: number
  year: number
  description: string
  location: string
  attendees: string[]
  organizer: string
  source: "local" | "google"
  isAllDay: boolean
  isMultiDay: boolean
  endDay: number
  endMonth: number
  endYear: number
  googleId?: string
  calendarId?: string
  calendarName?: string
  recurringEventId?: string
  isRecurring: boolean
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval: number
    daysOfWeek: number[]
    endType: "never" | "count" | "date"
    endDate: Date
    count: number
  }
}

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  backgroundColor?: string
  foregroundColor?: string
  primary?: boolean
  accessRole: string
  selected?: boolean
  visible: boolean
  colorId?: string
}

// Add these type declarations at the top of the file after the imports
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (options: { prompt: string }) => void;
          };
        };
      };
    };
  }
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [formattingSectionCollapsed, setFormattingSectionCollapsed] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isEditMode, setIsEditMode] = useState(isGoogleAuthEnabled)
  const [editingEventId, setEditingEventId] = useState(null)
  const [currentView, setCurrentView] = useState("week")
  const [selectedTimeZone, setSelectedTimeZone] = useState("America/New_York")
  const [compactness, setCompactness] = useState(50)
  const [backgroundOpacity, setBackgroundOpacity] = useState(40)
  const [backgroundBlur, setBackgroundBlur] = useState(0)
  const [backgroundImage, setBackgroundImage] = useState("mountain")
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarTab, setSidebarTab] = useState("calendar") // "calendar" or "calendars"

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const [draggedTimeSlots, setDraggedTimeSlots] = useState([])
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)

  // Recurring event confirmation dialog state
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [recurringEventAction, setRecurringEventAction] = useState<"this" | "future" | "all">("this")
  const [pendingEventUpdate, setPendingEventUpdate] = useState(null)

  // Google Auth state
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(isGoogleAuthEnabled)
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([])
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([])
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Add these new state variables in the component state section
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null)
  const [syncDebounceTimeout, setSyncDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState<boolean>(false)

  const [allDayEventDisplay, setAllDayEventDisplay] = useState<"full" | "compact">("full")

  // Initialize with current date
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [showTimeline, setShowTimeline] = useState(false)
  const [timelineCurrentTime, setTimelineCurrentTime] = useState(new Date())

  // At the top of the component
  const [isClient, setIsClient] = useState(false);
  const [clientTimeLinePosition, setClientTimeLinePosition] = useState<number | null>(null);

  // At the top of the Home component, add:
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);

  // Add a state to track if the user has manually set the start time in the create event modal
  const [hasSetStartTime, setHasSetStartTime] = useState(false);

  // Add state for title error
  const [titleError, setTitleError] = useState("");

  // Add a state to track if the user has attempted to submit
  const [triedSubmit, setTriedSubmit] = useState(false);

  const getCurrentDateInfo = () => {
    return {
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    }
  }

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay()
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  const [events, setEvents] = useState<CalendarEvent[]>([])

  // Helper function to round time to nearest hour
  const roundToNearestHour = (): string => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const roundedHour = minutes >= 30 ? (hours + 1) % 24 : hours
    return `${roundedHour.toString().padStart(2, "0")}:00`
  }

  const addOneHour = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const newHours = (hours + 1) % 24
    return `${newHours.toString().padStart(2, "0")}:00`
  }

  // Time options generation is handled by the more complete implementation below
  // that includes 15-minute increments and proper AM/PM formatting

  // Update the getCurrentDateTime function
  const getCurrentDateTime = () => {
    const now = new Date()
    const currentTime = roundToNearestHour()
    const nextHour = addOneHour(currentTime)

    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      startTime: currentTime,
      endTime: nextHour,
    }
  }

  // Update the handleTimeChange function
  const handleTimeChange = (time: string, isStartTime: boolean): void => {
    if (isStartTime) {
      if (!isEditMode && !hasSetStartTime) {
        const newEndTime = addOneHour(time);
        setNewEvent({ ...newEvent, startTime: time, endTime: newEndTime });
        setHasSetStartTime(true);
      } else {
        setNewEvent({ ...newEvent, startTime: time });
      }
    } else {
      setNewEvent({ ...newEvent, endTime: time });
    }
  }

  const currentDateTime = getCurrentDateTime()
  const [newEvent, setNewEvent] = useState({
    title: "",
    startTime: currentDateTime.startTime,
    endTime: currentDateTime.endTime,
    description: "",
    location: "",
    color: "bg-blue-600",
    day: currentDateTime.day,
    month: currentDateTime.month,
    year: currentDateTime.year,
    isAllDay: false,
    isMultiDay: false,
    endDay: currentDateTime.day,
    endMonth: currentDateTime.month,
    endYear: currentDateTime.year,
    isRecurring: false,
    recurrence: {
      frequency: "weekly" as const,
      interval: 1,
      daysOfWeek: [new Date().getDay()], // Default to current day
      endType: "never" as const,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
      count: 10,
    },
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false)
  const calendarRef = useRef(null)
  const fileInputRef = useRef(null)
  const userMenuRef = useRef(null)

  // Background image options
  const backgroundImages = [
    {
      id: "mountain",
      name: "Mountain Landscape",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "ocean",
      name: "Ocean View",
      url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "forest",
      name: "Forest Path",
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "city",
      name: "City Skyline",
      url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "desert",
      name: "Desert Sunset",
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2070&auto=format&fit=crop",
    },
  ]

  // Sample location suggestions
  const sampleLocations = [
    "Conference Room A, 123 Business St, New York, NY",
    "Conference Room B, 123 Business St, New York, NY",
    "Cafe Nero, 456 Coffee Ave, New York, NY",
    "Starbucks, 789 Main St, New York, NY",
    "Central Park, New York, NY",
    "Times Square, New York, NY",
    "Empire State Building, New York, NY",
    "Brooklyn Bridge, New York, NY",
    "Meeting Room 1, 321 Corporate Blvd, New York, NY",
    "Meeting Room 2, 321 Corporate Blvd, New York, NY",
    "Creative Space, 321 Innovation Dr, San Francisco, CA",
    "Google Headquarters, Mountain View, CA",
    "Apple Park, Cupertino, CA",
  ]

  // Time zones
  const timeZones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  ]

  // Expanded color palette for events
  const eventColors = [
    { name: "Blue", value: "bg-blue-600", preview: "bg-blue-600", googleId: "1" },
    { name: "Green", value: "bg-green-600", preview: "bg-green-600", googleId: "2" },
    { name: "Purple", value: "bg-purple-600", preview: "bg-purple-600", googleId: "3" },
    { name: "Yellow", value: "bg-yellow-600", preview: "bg-yellow-600", googleId: "5" },
    { name: "Red", value: "bg-red-600", preview: "bg-red-600", googleId: "4" },
    { name: "Pink", value: "bg-pink-600", preview: "bg-pink-600", googleId: "6" },
    { name: "Indigo", value: "bg-indigo-600", preview: "bg-indigo-600", googleId: "9" },
    { name: "Orange", value: "bg-orange-600", preview: "bg-orange-600", googleId: "6" },
    { name: "Teal", value: "bg-teal-600", preview: "bg-teal-600", googleId: "7" },
    { name: "Cyan", value: "bg-cyan-600", preview: "bg-cyan-600", googleId: "7" },
    { name: "Emerald", value: "bg-emerald-600", preview: "bg-emerald-600", googleId: "2" },
    { name: "Lime", value: "bg-lime-600", preview: "bg-lime-600", googleId: "2" },
    { name: "Amber", value: "bg-amber-600", preview: "bg-amber-600", googleId: "5" },
    { name: "Rose", value: "bg-rose-600", preview: "bg-rose-600", googleId: "6" },
    { name: "Violet", value: "bg-violet-600", preview: "bg-violet-600", googleId: "3" },
    { name: "Fuchsia", value: "bg-fuchsia-600", preview: "bg-fuchsia-600", googleId: "6" },
    { name: "Sky", value: "bg-sky-600", preview: "bg-sky-600", googleId: "1" },
    { name: "Slate", value: "bg-slate-600", preview: "bg-slate-600", googleId: "8" },
    { name: "Gray", value: "bg-gray-600", preview: "bg-gray-600", googleId: "8" },
    { name: "Zinc", value: "bg-zinc-600", preview: "bg-zinc-600", googleId: "8" },
    { name: "Stone", value: "bg-stone-600", preview: "bg-stone-600", googleId: "10" },
    { name: "Neutral", value: "bg-neutral-600", preview: "bg-neutral-600", googleId: "8" },
  ]

  // Generate time options with 15-minute increments
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const displayTime =
          hour === 0
            ? `12:${minute.toString().padStart(2, "0")} AM`
            : hour < 12
              ? `${hour}:${minute.toString().padStart(2, "0")} AM`
              : hour === 12
                ? `12:${minute.toString().padStart(2, "0")} PM`
                : `${hour - 12}:${minute.toString().padStart(2, "0")} PM`
        times.push({ value: timeString, label: displayTime })
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  // Helper function to generate recurring events
  const generateRecurringEvents = (baseEvent: CalendarEvent): CalendarEvent[] => {
    if (!baseEvent.isRecurring || !baseEvent.recurrence) {
      return [baseEvent]
    }

    const events: CalendarEvent[] = [baseEvent]
    const { frequency, interval, daysOfWeek, endType, endDate, count } = baseEvent.recurrence

    let currentDate = new Date(baseEvent.year, baseEvent.month - 1, baseEvent.day)
    const endDateTime = new Date(endDate)
    let eventCount = 1

    while (
      (endType === "never" && eventCount < 100) || // Limit to 100 events for "never" end type
      (endType === "count" && eventCount < count) ||
      (endType === "date" && currentDate <= endDateTime)
    ) {
      // Add interval based on frequency
      switch (frequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + interval)
          break
        case "weekly":
          // For weekly recurrence, we need to find the next occurrence that matches the selected days
          let daysToAdd = 1
          while (daysToAdd <= 7 * interval) {
            currentDate.setDate(currentDate.getDate() + 1)
            if (daysOfWeek.includes(currentDate.getDay())) {
              break
            }
            daysToAdd++
          }
          break
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + interval)
          break
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + interval)
          break
      }

      // Skip if we've exceeded the end date
      if (endType === "date" && currentDate > endDateTime) {
        break
      }

      // Create new event for this occurrence
      const newEvent: CalendarEvent = {
        ...baseEvent,
        id: `${baseEvent.id}-${eventCount}`,
        day: currentDate.getDate(),
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        endDay: baseEvent.isMultiDay ? new Date(currentDate.getTime() + (baseEvent.endDay - baseEvent.day) * 24 * 60 * 60 * 1000).getDate() : currentDate.getDate(),
        endMonth: baseEvent.isMultiDay ? new Date(currentDate.getTime() + (baseEvent.endDay - baseEvent.day) * 24 * 60 * 60 * 1000).getMonth() + 1 : currentDate.getMonth() + 1,
        endYear: baseEvent.isMultiDay ? new Date(currentDate.getTime() + (baseEvent.endDay - baseEvent.day) * 24 * 60 * 60 * 1000).getFullYear() : currentDate.getFullYear(),
      }

      events.push(newEvent)
      eventCount++
    }

    return events
  }

  // Google OAuth functions
  const initializeGoogleAuth = () => {
    if (typeof window === 'undefined') return;
    
    if (!isGoogleAuthEnabled) {
      console.log("Google Auth is not enabled - missing client ID");
      setIsAuthLoading(false);
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error("Google Client ID is missing");
      setAuthError("Google Sign-In is not properly configured. Please check your environment variables.");
      setIsAuthLoading(false);
      return;
    }

    // Log current origin for debugging
    console.log("Current origin:", window.location.origin);
    console.log("Current hostname:", window.location.hostname);
    console.log("Current protocol:", window.location.protocol);
    console.log("Current port:", window.location.port);
    console.log("Full URL:", window.location.href);

    if (window.google && googleScriptLoaded) {
      try {
        console.log("Initializing Google Auth with client ID:", GOOGLE_CLIENT_ID);
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          use_fedcm_for_prompt: true,
        });

        // Check for existing session
        const savedUser = localStorage.getItem("calendar_user");
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);

            // If we have a saved access token, fetch calendars and events
            if (parsedUser.accessToken) {
              fetchGoogleCalendars(parsedUser.accessToken);
            }
          } catch (error) {
            console.error("Error parsing saved user:", error);
            localStorage.removeItem("calendar_user");
          }
        }
        setAuthError(null);
      } catch (error) {
        console.error("Error initializing Google Auth:", error);
        setAuthError("Google Sign-In is not available. Please check your browser console for details.");
      }
      setIsAuthLoading(false);
    } else {
      console.log("Google script not loaded yet");
    }
  }

  const handleGoogleSignIn = async (response: any) => {
    try {
      console.log("=== Google Sign-In Process Started ===");
      console.log("Handling Google Sign-In response:", response);
      
      // Handle both One Tap and OAuth2 responses
      const credential = response.credential || response.access_token;
      if (!credential) {
        console.error("No credential received from Google Sign-In");
        setAuthError("Failed to get credentials from Google Sign-In. Please try again.");
        return;
      }

      let userData;
      let accessToken;

      if (response.credential) {
        // One Tap response
        console.log("Processing One Tap response...");
        const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
        console.log("Decoded token:", decodedToken);
        userData = {
          id: decodedToken.sub,
          name: decodedToken.name,
          email: decodedToken.email,
          picture: decodedToken.picture,
          given_name: decodedToken.given_name,
          family_name: decodedToken.family_name,
        };
        
        // For One Tap flow, we need to get calendar access separately
        console.log("One Tap flow - getting calendar access...");
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar',
          callback: async (tokenResponse: any) => {
            console.log("One Tap token client callback received:", tokenResponse);
            if (tokenResponse.error) {
              console.error("Error getting access token:", tokenResponse.error);
              setAuthError("Failed to get calendar access. Please try again.");
              return;
            }

            const calendarAccessToken = tokenResponse.access_token;
            console.log("Got access token for One Tap flow");

            // Create user object with access token
            const user: GoogleUser = {
              ...userData,
              accessToken: calendarAccessToken,
            };

            console.log("Saving user to state and localStorage...");
            // Save user to state and localStorage
            setUser(user);
            localStorage.setItem("calendar_user", JSON.stringify(user));

            console.log("Starting calendar sync for One Tap flow...");
            // Fetch calendars and events
            await fetchGoogleCalendars(calendarAccessToken);
          },
        });

        console.log("Requesting access token for One Tap flow...");
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } else {
        // OAuth2 response - we already have the access token
        console.log("Processing OAuth2 response...");
        accessToken = response.access_token;
        
        // For OAuth2, we need to get user info from the token
        try {
          console.log("Getting user info from access token...");
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info');
          }
          
          const userInfo = await userInfoResponse.json();
          console.log("User info received:", userInfo);
          
          userData = {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
          };
        } catch (error) {
          console.error("Error getting user info:", error);
          // Fallback: create minimal user data
          userData = {
            id: 'unknown',
            name: 'Google User',
            email: 'user@example.com',
            picture: '',
            given_name: '',
            family_name: '',
          };
        }

        // Create user object with access token
        const user: GoogleUser = {
          ...userData,
          accessToken: accessToken,
        };

        console.log("Saving user to state and localStorage...");
        // Save user to state and localStorage
        setUser(user);
        localStorage.setItem("calendar_user", JSON.stringify(user));

        console.log("Starting calendar sync for OAuth2 flow...");
        // Fetch calendars and events
        await fetchGoogleCalendars(accessToken);
      }
    } catch (error) {
      console.error("Error handling Google sign in:", error);
      setAuthError("Failed to sign in. Please try again.");
    }
  }

  // Replace the existing fetchGoogleCalendars function with this enhanced version
  const fetchGoogleCalendars = async (accessToken: string, forceSync = false) => {
    console.log("=== fetchGoogleCalendars started ===");
    console.log("Access token available:", !!accessToken);
    console.log("Force sync:", forceSync);
    
    if (!accessToken) {
      console.error("No access token available");
      setSyncError("No access token available. Please sign in again.")
      setSyncStatus("error")
      return
    }

    // Prevent excessive syncing - only sync if it's been at least 30 seconds since last attempt
    // unless forceSync is true
    const now = new Date()
    if (!forceSync && lastSyncAttempt && now.getTime() - lastSyncAttempt.getTime() < 30000) {
      console.log("Skipping sync - too soon since last attempt")
      return
    }

    setLastSyncAttempt(now)
    setSyncStatus("syncing")
    setSyncError(null)

    try {
      console.log("Fetching calendar list from Google API...");
      const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      console.log("Calendar list response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Calendar list data:", data);
      console.log("Number of calendars found:", data.items?.length || 0);
      
      const calendars = data.items.map((cal: any) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        primary: cal.primary,
        accessRole: cal.accessRole,
        selected: cal.selected,
        visible: cal.primary || cal.selected || false, // Default to visible for primary calendar
        colorId: cal.colorId,
      }))

      console.log("Processed calendars:", calendars);
      console.log("Visible calendars:", calendars.filter((cal: GoogleCalendar) => cal.visible));
      
      setGoogleCalendars(calendars)

      // Fetch events for visible calendars
      console.log("Starting to fetch events for visible calendars...");
      await fetchGoogleCalendarEvents(
        accessToken,
        calendars.filter((cal: GoogleCalendar) => cal.visible),
        forceSync,
      )

      setSyncStatus("synced")
      setHasUnsyncedChanges(false)
      console.log("=== fetchGoogleCalendars completed successfully ===");
    } catch (error) {
      console.error("Error fetching Google Calendars:", error)
      setSyncError("Failed to fetch your Google Calendars. Please try again.")
      setSyncStatus("error")
    }
  }

  // Replace the existing fetchGoogleCalendarEvents function with this enhanced version
  const fetchGoogleCalendarEvents = async (
    accessToken: string,
    calendarsToFetch?: GoogleCalendar[],
    forceSync = false,
  ) => {
    console.log("=== fetchGoogleCalendarEvents started ===");
    console.log("Access token available:", !!accessToken);
    console.log("Calendars to fetch:", calendarsToFetch?.length || 0);
    console.log("Force sync:", forceSync);
    
    if (!accessToken) {
      console.error("No access token available for events");
      setSyncError("No access token available. Please sign in again.")
      setSyncStatus("error")
      return
    }

    setIsLoadingEvents(true)
    setSyncError(null)

    try {
      const calendarsToSync = calendarsToFetch || googleCalendars.filter((cal) => cal.visible)
      console.log("Calendars to sync:", calendarsToSync.length);
      console.log("Calendar details:", calendarsToSync);

      // Calculate date range for events (1 month before and after current date)
      const startDate = new Date(currentDate)
      startDate.setMonth(startDate.getMonth() - 1)

      const endDate = new Date(currentDate)
      endDate.setMonth(endDate.getMonth() + 1)

      const timeMin = startDate.toISOString()
      const timeMax = endDate.toISOString()
      
      console.log("Date range for events:", { timeMin, timeMax });

      const allEvents: GoogleCalendarEvent[] = []

      // Fetch events from each visible calendar
      for (const calendar of calendarsToSync) {
        try {
          console.log(`Fetching events for calendar: ${calendar.summary} (${calendar.id})`);
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          )

          console.log(`Response for ${calendar.summary}:`, response.status);
          if (response.ok) {
            const data = await response.json()
            console.log(`Events for ${calendar.summary}:`, data.items?.length || 0);
            const calendarEvents = data.items.map((event: any) => ({
              ...event,
              calendarId: calendar.id,
              calendarColor: calendar.backgroundColor,
            }))
            allEvents.push(...calendarEvents)
          } else {
            console.error(`Failed to fetch events for ${calendar.summary}:`, response.status, response.statusText);
          }
        } catch (error) {
          console.error(`Error fetching events for calendar ${calendar.summary}:`, error)
        }
      }

      console.log("Total events fetched:", allEvents.length);
      setGoogleCalendarEvents(allEvents)

      // Convert Google Calendar events to our app's format and merge with local events
      console.log("Converting Google events to app format...");
      const googleEvents = convertGoogleEvents(allEvents)
      console.log("Converted events:", googleEvents.length);

      // Filter out local events (keep only those with source: "local")
      const localEvents = events.filter((event) => event.source === "local")
      console.log("Local events to keep:", localEvents.length);

      // Merge local events with Google events
      console.log("Merging events...");
      setEvents([...localEvents, ...googleEvents])
      setLastSyncTime(new Date())
      setSyncStatus("synced")
      console.log("=== fetchGoogleCalendarEvents completed successfully ===");
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error)
      setSyncError("Failed to fetch your Google Calendar events. Please try again.")
      setSyncStatus("error")
    } finally {
      setIsLoadingEvents(false)
    }
  }

  // Replace the existing convertGoogleEvents function with this enhanced version
  const convertGoogleEvents = (googleEvents: GoogleCalendarEvent[]) => {
    return googleEvents.map((event) => {
      // Determine if it's an all-day event
      const isAllDay = Boolean(event.start.date)

      // Parse start and end times
      let startDate, endDate, startTime, endTime

      if (isAllDay) {
        // Handle undefined date values
        if (!event.start.date || !event.end.date) {
          console.warn("Missing date for all-day event:", event);
          return null;
        }
        startDate = new Date(event.start.date)
        endDate = new Date(event.end.date)
        // Subtract one day from end date because Google's end date is exclusive
        endDate.setDate(endDate.getDate() - 1)
        startTime = "00:00"
        endTime = "23:59"
      } else {
        // Handle undefined dateTime values
        if (!event.start.dateTime || !event.end.dateTime) {
          console.warn("Missing dateTime for timed event:", event);
          return null;
        }
        startDate = new Date(event.start.dateTime)
        endDate = new Date(event.end.dateTime)
        startTime = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`
        endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`
      }

      // Get calendar info for color
      const calendar = googleCalendars.find((cal) => cal.id === event.calendarId)

      // Use the exact color from Google Calendar if available
      let color = "bg-blue-600" // Default fallback
      let exactColor = null

      if (event.calendarColor) {
        exactColor = event.calendarColor
      } else if (calendar?.backgroundColor) {
        exactColor = calendar.backgroundColor
      }

      // Map Google color ID to our color scheme as fallback
      if (!exactColor && event.colorId) {
        const colorMapping: { [key: string]: string } = {
          "1": "bg-blue-600", // Blue
          "2": "bg-green-600", // Green
          "3": "bg-purple-600", // Purple
          "4": "bg-red-600", // Red
          "5": "bg-yellow-600", // Yellow
          "6": "bg-pink-600", // Pink
          "7": "bg-teal-600", // Teal
          "8": "bg-gray-600", // Gray
          "9": "bg-indigo-600", // Indigo
          "10": "bg-stone-600", // Brown
          "11": "bg-orange-600", // Orange
        }
        color = colorMapping[event.colorId] || "bg-blue-600"
      }

      // Get attendees
      const attendees = event.attendees ? event.attendees.map((a) => a.displayName || a.email) : []

      // Check if this is a recurring event
      const isRecurring = Boolean(event.recurringEventId || event.recurrence)

      return {
        id: event.id,
        title: event.summary || "Untitled Event",
        startTime,
        endTime,
        color,
        exactColor,
        day: startDate.getDate(),
        month: startDate.getMonth(),
        year: startDate.getFullYear(),
        description: event.description || "",
        location: event.location || "",
        attendees,
        organizer: event.organizer?.displayName || event.organizer?.email || "Unknown",
        isAllDay,
        isMultiDay: !isAllDay && startDate.toDateString() !== endDate.toDateString(),
        endDay: endDate.getDate(),
        endMonth: endDate.getMonth(),
        endYear: endDate.getFullYear(),
        source: "google" as const,
        googleId: event.id,
        calendarId: event.calendarId,
        calendarName: calendar?.summary || "Unknown Calendar",
        recurringEventId: event.recurringEventId,
        isRecurring,
      }
    }).filter(Boolean) as CalendarEvent[] // Filter out null values and ensure type
  }

  // Helper function to convert recurrence to Google Calendar format
  const convertRecurrenceToGoogle = (recurrence) => {
    if (!recurrence) return []

    const { frequency, interval, daysOfWeek, endType, endDate, count } = recurrence
    let rrule = `FREQ=${frequency.toUpperCase()}`

    if (interval > 1) {
      rrule += `;INTERVAL=${interval}`
    }

    if (frequency === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
      const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
      const days = daysOfWeek.map((day) => dayMap[day]).join(",")
      rrule += `;BYDAY=${days}`
    }

    if (endType === "date" && endDate) {
      const endDateStr = endDate.toISOString().split("T")[0].replace(/-/g, "")
      rrule += `;UNTIL=${endDateStr}`
    } else if (endType === "count" && count) {
      rrule += `;COUNT=${count}`
    }

    return [`RRULE:${rrule}`]
  }

  // Create a new Google Calendar event with recurrence support
  const createGoogleCalendarEvent = async (eventData, calendarId = "primary") => {
    if (!user?.accessToken) {
      setSyncError("No access token available. Please sign in again.")
      return null
    }

    try {
      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.isAllDay
          ? {
              date: `${eventData.year}-${(eventData.month + 1).toString().padStart(2, "0")}-${eventData.day.toString().padStart(2, "0")}`,
            }
          : {
              dateTime: `${eventData.year}-${(eventData.month + 1).toString().padStart(2, "0")}-${eventData.day.toString().padStart(2, "0")}T${eventData.startTime}:00`,
              timeZone: selectedTimeZone,
            },
        end: eventData.isAllDay
          ? {
              date: `${eventData.endYear}-${(eventData.endMonth + 1).toString().padStart(2, "0")}-${(eventData.endDay + 1).toString().padStart(2, "0")}`,
            }
          : {
              dateTime: `${eventData.year}-${(eventData.month + 1).toString().padStart(2, "0")}-${eventData.day.toString().padStart(2, "0")}T${eventData.endTime}:00`,
              timeZone: selectedTimeZone,
            },
        colorId: eventColors.find((color) => color.value === eventData.color)?.googleId || "1",
      }

      // Add recurrence if specified
      if (eventData.isRecurring && eventData.recurrence) {
        googleEvent.recurrence = convertRecurrenceToGoogle(eventData.recurrence)
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(googleEvent),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status} ${response.statusText}`)
      }

      const createdEvent = await response.json()

      // Refresh calendar events to show the new event
      await fetchGoogleCalendarEvents(user.accessToken, undefined, true)

      return createdEvent
    } catch (error) {
      console.error("Error creating Google Calendar event:", error)
      setSyncError("Failed to create event in Google Calendar. Please try again.")
      return null
    }
  }

  // Update an existing Google Calendar event with recurring event support
  const updateGoogleCalendarEvent = async (eventData, googleEventId, calendarId, updateScope = "this") => {
    if (!user?.accessToken) {
      setSyncError("No access token available. Please sign in again.")
      return null
    }

    try {
      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.isAllDay
          ? {
              date: `${eventData.year}-${(eventData.month + 1).toString().padStart(2, "0")}-${eventData.day.toString().padStart(2, "0")}`,
            }
          : {
              dateTime: `${eventData.year}-${(eventData.month + 1).toString().padStart(2, "0")}-${eventData.day.toString().padStart(2, "0")}T${eventData.startTime}:00`,
              timeZone: selectedTimeZone,
            },
        end: eventData.isAllDay
          ? {
              date: `${eventData.endYear}-${(eventData.endMonth + 1).toString().padStart(2, "0")}-${(eventData.endDay + 1).toString().padStart(2, "0")}`,
            }
          : {
              dateTime: `${eventData.year}-${(eventData.month + 1).toString().padStart(2, "0")}-${eventData.day.toString().padStart(2, "0")}T${eventData.endTime}:00`,
              timeZone: selectedTimeZone,
            },
        colorId: eventColors.find((color) => color.value === eventData.color)?.googleId || "1",
      }

      // Add recurrence if specified
      if (eventData.isRecurring && eventData.recurrence) {
        googleEvent.recurrence = convertRecurrenceToGoogle(eventData.recurrence)
      }

      // Add sendUpdates parameter based on update scope
      const sendUpdates = updateScope === "all" ? "all" : "none"
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}?sendUpdates=${sendUpdates}`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      })

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.status} ${response.statusText}`)
      }

      const updatedEvent = await response.json()

      // Refresh calendar events to show the updated event
      await fetchGoogleCalendarEvents(user.accessToken, undefined, true)

      return updatedEvent
    } catch (error) {
      console.error("Error updating Google Calendar event:", error)
      setSyncError("Failed to update event in Google Calendar. Please try again.")
      return null
    }
  }

  // Delete a Google Calendar event
  const deleteGoogleCalendarEvent = async (googleEventId, calendarId) => {
    if (!user?.accessToken) {
      setSyncError("No access token available. Please sign in again.")
      return false
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`)
      }

      // Refresh calendar events to remove the deleted event
      await fetchGoogleCalendarEvents(user.accessToken, undefined, true)

      return true
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error)
      setSyncError("Failed to delete event from Google Calendar. Please try again.")
      return false
    }
  }

  const [selectedCalendarForNewEvents, setSelectedCalendarForNewEvents] = useState("primary")

  // Handle recurring event confirmation
  const handleRecurringEventConfirm = async () => {
    if (!pendingEventUpdate) return

    const { eventData, googleEventId, calendarId } = pendingEventUpdate

    if (selectedEvent?.source === "google") {
      // Update Google Calendar event with the selected scope
      const success = await updateGoogleCalendarEvent(eventData, googleEventId, calendarId, recurringEventAction)
      if (!success) return // Don't close modal if update failed
    } else {
      // Update local event - find and update the correct event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                title: eventData.title,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                description: eventData.description,
                location: eventData.location,
                color: eventData.color,
                day: eventData.day,
                month: eventData.month,
                year: eventData.year,
                isAllDay: eventData.isAllDay,
                isMultiDay: eventData.isMultiDay,
                endDay: eventData.endDay,
                endMonth: eventData.endMonth,
                endYear: eventData.endYear,
                // Preserve original event properties that shouldn't change
                id: event.id,
                source: event.source,
                attendees: event.attendees,
                organizer: event.organizer,
                googleId: event.googleId,
                calendarId: event.calendarId,
                calendarName: event.calendarName,
                exactColor: event.exactColor,
              }
            : event,
        ),
      )
    }

    // Reset states and close modals
    setShowRecurringDialog(false)
    setPendingEventUpdate(null)
    setRecurringEventAction("this")

    // Reset form and close modal
    const currentDateInfo = getCurrentDateInfo()
    setNewEvent({
      title: "",
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      location: "",
      color: "bg-blue-600",
      day: currentDateInfo.day,
      month: currentDateInfo.month,
      year: currentDateInfo.year,
      isAllDay: false,
      isMultiDay: false,
      endDay: currentDateInfo.day,
      endMonth: currentDateInfo.month,
      endYear: currentDateInfo.year,
      isRecurring: false,
      recurrence: {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        endType: "never",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        count: 10,
      },
    })
    setShowCreateModal(false)
    setIsEditMode(false)
    setEditingEventId(null)
    setIsCreatingEvent(false)
    setSelectedEvent(null)
  }

  const handleSaveEvent = async () => {
    setTriedSubmit(true);
    if (!newEvent.title || newEvent.title.trim() === "") {
      setTitleError("Needs an event title");
      return;
    } else {
      setTitleError("");
    }
    if (newEvent.title && newEvent.startTime && newEvent.endTime) {
      if (isEditMode) {
        // Check if this is a recurring event and show confirmation dialog
        if (selectedEvent?.isRecurring && selectedEvent?.source === "google") {
          setPendingEventUpdate({
            eventData: newEvent,
            googleEventId: selectedEvent.googleId,
            calendarId: selectedEvent.calendarId,
          })
          setShowRecurringDialog(true)
          return // Don't proceed with save until user confirms
        }

        if (selectedEvent?.source === "google") {
          // Update Google Calendar event first
          const success = await updateGoogleCalendarEvent(newEvent, selectedEvent.googleId, selectedEvent.calendarId)
          if (!success) {
            setError("Failed to update Google Calendar event. Please try again.")
            return // Don't close modal if update failed
          }

          // Then update local event
          setEvents((prevEvents) =>
            prevEvents.map((event) =>
              event.id === editingEventId
                ? {
                    ...event,
                    title: newEvent.title,
                    startTime: newEvent.startTime,
                    endTime: newEvent.endTime,
                    description: newEvent.description,
                    location: newEvent.location,
                    color: newEvent.color,
                    day: newEvent.day,
                    month: newEvent.month,
                    year: newEvent.year,
                    isAllDay: newEvent.isAllDay,
                    isMultiDay: newEvent.isMultiDay,
                    endDay: newEvent.endDay,
                    endMonth: newEvent.endMonth,
                    endYear: newEvent.endYear,
                    isRecurring: newEvent.isRecurring,
                    recurrence: newEvent.recurrence,
                    // Preserve original event properties
                    id: event.id,
                    source: event.source,
                    attendees: event.attendees,
                    organizer: event.organizer,
                    googleId: event.googleId,
                    calendarId: event.calendarId,
                    calendarName: event.calendarName,
                    exactColor: event.exactColor,
                  }
                : event,
            ),
          )
        } else {
          // Update local event
          setEvents((prevEvents) =>
            prevEvents.map((event) =>
              event.id === editingEventId
                ? {
                    ...event,
                    title: newEvent.title,
                    startTime: newEvent.startTime,
                    endTime: newEvent.endTime,
                    description: newEvent.description,
                    location: newEvent.location,
                    color: newEvent.color,
                    day: newEvent.day,
                    month: newEvent.month,
                    year: newEvent.year,
                    isAllDay: newEvent.isAllDay,
                    isMultiDay: newEvent.isMultiDay,
                    endDay: newEvent.endDay,
                    endMonth: newEvent.endMonth,
                    endYear: newEvent.endYear,
                    isRecurring: newEvent.isRecurring,
                    recurrence: newEvent.recurrence,
                    // Preserve original event properties
                    id: event.id,
                    source: event.source,
                    attendees: event.attendees,
                    organizer: event.organizer,
                    googleId: event.googleId,
                    calendarId: event.calendarId,
                    calendarName: event.calendarName,
                    exactColor: event.exactColor,
                  }
                : event,
            ),
          )
        }
      } else {
        // Create new event
        if (user?.accessToken && selectedCalendarForNewEvents !== "local") {
          // Create Google Calendar event
          const success = await createGoogleCalendarEvent(newEvent, selectedCalendarForNewEvents)
          if (!success) {
            setError("Failed to create Google Calendar event. Please try again.")
            return // Don't close modal if creation failed
          }
        } else {
          // Create local event(s)
          const baseEvent = {
            ...newEvent,
            id: Date.now(),
            attendees: [],
            organizer: user?.name || "You",
            source: "local",
          }

          // Generate recurring events if applicable
          const eventsToAdd = generateRecurringEvents(baseEvent)
          setEvents((prevEvents) => [...prevEvents, ...eventsToAdd])
        }
      }

      // Reset form and close modal
      const currentDateInfo = getCurrentDateInfo()
      setNewEvent({
        title: "",
        startTime: "09:00",
        endTime: "10:00",
        description: "",
        location: "",
        color: "bg-blue-600",
        day: currentDateInfo.day,
        month: currentDateInfo.month,
        year: currentDateInfo.year,
        isAllDay: false,
        isMultiDay: false,
        endDay: currentDateInfo.day,
        endMonth: currentDateInfo.month,
        endYear: currentDateInfo.year,
        isRecurring: false,
        recurrence: {
          frequency: "weekly",
          interval: 1,
          daysOfWeek: [new Date().getDay()],
          endType: "never",
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          count: 10,
        },
      })
      setShowCreateModal(false)
      setIsEditMode(false)
      setEditingEventId(null)
      setIsCreatingEvent(false)
      setSelectedEvent(null) // Clear any selected event
    }
  }

  const handleDeleteEvent = async () => {
    if (selectedEvent.source === "google") {
      const success = await deleteGoogleCalendarEvent(selectedEvent.googleId, selectedEvent.calendarId)
      if (success) {
        setSelectedEvent(null)
      }
    } else {
      setEvents(events.filter((event) => event.id !== selectedEvent.id))
      setSelectedEvent(null)
    }
  }

  const handleDateSelect = (day, month, year) => {
    setNewEvent({ ...newEvent, day, month, year })
    setShowDatePicker(false)
  }

  const handleEndDateSelect = (day, month, year) => {
    setNewEvent({ ...newEvent, endDay: day, endMonth: month, endYear: year })
    setShowEndDatePicker(false)
  }

  const handleRecurrenceEndDateSelect = (day, month, year) => {
    setNewEvent({
      ...newEvent,
      recurrence: {
        ...newEvent.recurrence,
        endDate: new Date(year, month, day),
      },
    })
    setShowRecurrenceEndDatePicker(false)
  }

  const handleAllDayToggle = () => {
    const newAllDayState = !newEvent.isAllDay
    setNewEvent({
      ...newEvent,
      isAllDay: newAllDayState,
      startTime: newAllDayState ? "00:00" : "09:00",
      endTime: newAllDayState ? "23:59" : "10:00",
    })
  }

  const handleMultiDayToggle = () => {
    const newMultiDayState = !newEvent.isMultiDay
    setNewEvent({
      ...newEvent,
      isMultiDay: newMultiDayState,
      endDay: newMultiDayState ? newEvent.day : newEvent.day,
      endMonth: newMultiDayState ? newEvent.month : newEvent.month,
      endYear: newMultiDayState ? newEvent.year : newEvent.year,
    })
  }

  const handleRecurringToggle = () => {
    setNewEvent({
      ...newEvent,
      isRecurring: !newEvent.isRecurring,
    })
  }

  // Get current week dates based on current date
  const getCurrentWeekDates = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return {
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
      }
    })
  }

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekDates = getCurrentWeekDates()
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  // Calculate slot height based on compactness slider
  const getSlotHeight = () => {
    return Math.round(30 + (compactness / 100) * 50)
  }

  // Helper function to calculate event position and height
  const calculateEventStyle = (startTime, endTime) => {
    const start = Number.parseInt(startTime.split(":")[0]) + Number.parseInt(startTime.split(":")[1]) / 60
    const end = Number.parseInt(endTime.split(":")[0]) + Number.parseInt(endTime.split(":")[1]) / 60
    const slotHeight = getSlotHeight()
    const top = start * slotHeight
    const height = (end - start) * slotHeight
    return { top: `${top}px`, height: `${height}px` }
  }

  // Calculate current time line position - only on client side
  const getCurrentTimeLinePosition = () => {
    if (typeof window === 'undefined') return 0; // Return 0 on server
    const now = currentTime
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const totalMinutes = hours * 60 + minutes + seconds / 60
    const slotHeight = getSlotHeight()
    const position = (totalMinutes / 60) * slotHeight
    return position
  }

  // Check if current time line should be shown (only for current day)
  const shouldShowCurrentTimeLine = (dayDate = null) => {
    const now = new Date()

    if (currentView === "day") {
      // For day view, check if viewing current day
      return (
        currentDate.getDate() === now.getDate() &&
        currentDate.getMonth() === now.getMonth() &&
        currentDate.getFullYear() === now.getFullYear()
      )
    } else if (currentView === "week" && dayDate) {
      // For week view, check if this specific day is today
      return dayDate.date === now.getDate() && dayDate.month === now.getMonth() && dayDate.year === now.getFullYear()
    }

    return false
  }

  // Generate mini calendar days for date picker
  const generateDatePickerDays = (month, year) => {
    const daysInMonth = getDaysInMonth(month, year)
    const firstDayOffset = getFirstDayOfMonth(month, year)
    return Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
      i < firstDayOffset ? null : i - firstDayOffset + 1,
    )
  }

  // Generate mini calendar days for sidebar
  const sidebarCurrentDateInfo = getCurrentDateInfo()
  const daysInMonth = getDaysInMonth(sidebarCurrentDateInfo.month, sidebarCurrentDateInfo.year)
  const firstDayOffset = getFirstDayOfMonth(sidebarCurrentDateInfo.month, sidebarCurrentDateInfo.year)
  const miniCalendarDays = Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1,
  )

  // Filter events for current display
  const getEventsForDisplay = () => {
    if (currentView === "day") {
      return events.filter(
        (event) =>
          event.day === getCurrentDateInfo().day &&
          event.month === getCurrentDateInfo().month &&
          event.year === getCurrentDateInfo().year,
      )
    } else if (currentView === "week") {
      return events.filter((event) =>
        weekDates.some(
          (weekDate) => event.day === weekDate.date && event.month === weekDate.month && event.year === weekDate.year,
        ),
      )
    } else {
      return events.filter(
        (event) => event.month === getCurrentDateInfo().month && event.year === getCurrentDateInfo().year,
      )
    }
  }

  const isCurrentDay = (day) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      sidebarCurrentDateInfo.month === today.getMonth() &&
      sidebarCurrentDateInfo.year === today.getFullYear()
    )
  }

  const isCurrentWeekDay = (weekDate) => {
    const today = new Date()
    return (
      weekDate.date === today.getDate() && weekDate.month === today.getMonth() && weekDate.year === today.getFullYear()
    )
  }

  // Get current background image
  const getCurrentBackgroundUrl = () => {
    if (backgroundImage === "custom" && customBackgroundUrl) {
      return customBackgroundUrl
    }
    const currentBg = backgroundImages.find((img) => img.id === backgroundImage)
    return currentBg?.url || backgroundImages[0].url
  }

  // Format time display
  const formatTimeDisplay = (time) => {
    if (time === 0) return "12 AM"
    if (time < 12) return `${time} AM`
    if (time === 12) return "12 PM"
    return `${time - 12} PM`
  }

  // Get display title based on current view
  const getDisplayTitle = () => {
    if (currentView === "day") {
      return `${weekDays[currentDate.getDay()]}, ${monthNames[getCurrentDateInfo().month]} ${getCurrentDateInfo().day}, ${getCurrentDateInfo().year}`
    } else if (currentView === "week") {
      const startOfWeek = weekDates[0]
      const endOfWeek = weekDates[6]
      if (startOfWeek.month === endOfWeek.month) {
        return `${monthNames[startOfWeek.month]} ${startOfWeek.date} - ${endOfWeek.date}, ${startOfWeek.year}`
      } else {
        return `${monthNames[startOfWeek.month]} ${startOfWeek.date} - ${monthNames[endOfWeek.month]} ${endOfWeek.date}, ${startOfWeek.year}`
      }
    } else {
      return `${monthNames[getCurrentDateInfo().month]} ${getCurrentDateInfo().year}`
    }
  }

  const handleTimeSlotMouseDown = (timeSlot, dayIndex = null) => {
    if (currentView === "month") return // Don't allow dragging in month view

    setIsDragging(true)
    setDragStart({ time: timeSlot, day: dayIndex })
    setDragEnd({ time: timeSlot, day: dayIndex })
    setDraggedTimeSlots([timeSlot])
  }

  const handleTimeSlotMouseEnter = (timeSlot, dayIndex = null) => {
    if (!isDragging) return

    setDragEnd({ time: timeSlot, day: dayIndex })

    // Calculate dragged time slots
    const startTime = Math.min(dragStart.time, timeSlot)
    const endTime = Math.max(dragStart.time, timeSlot)
    const slots = []
    for (let i = startTime; i <= endTime; i++) {
      slots.push(i)
    }
    setDraggedTimeSlots(slots)
  }

  const handleTimeSlotMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) return

    setIsDragging(false)

    // Calculate start and end times
    const startHour = Math.min(dragStart.time, dragEnd.time)
    const endHour = Math.max(dragStart.time, dragEnd.time) + 1

    const startTime = `${startHour.toString().padStart(2, "0")}:00`
    const endTime = `${endHour.toString().padStart(2, "0")}:00`

    // Determine the date
    let eventDate
    if (currentView === "day") {
      eventDate = getCurrentDateInfo()
    } else if (currentView === "week" && dragStart.day !== null) {
      const weekDate = weekDates[dragStart.day]
      eventDate = { day: weekDate.date, month: weekDate.month, year: weekDate.year }
    } else {
      eventDate = getCurrentDateInfo()
    }

    // Pre-fill the new event with dragged time and date
    setNewEvent({
      title: "",
      startTime,
      endTime,
      description: "",
      location: "",
      color: "bg-blue-600",
      day: eventDate.day,
      month: eventDate.month,
      year: eventDate.year,
      isAllDay: false,
      isMultiDay: false,
      endDay: eventDate.day,
      endMonth: eventDate.month,
      endYear: eventDate.year,
      isRecurring: false,
      recurrence: {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        endType: "never",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        count: 10,
      },
    })

    openCreateEventModal();

    // Reset drag state
    setDragStart(null)
    setDragEnd(null)
    setDraggedTimeSlots([])
  }

  const isTimeSlotDragged = (timeSlot) => {
    return draggedTimeSlots.includes(timeSlot)
  }

  // Helper function to detect overlapping events and calculate positioning
  const getOverlappingEvents = (events, targetEvent) => {
    return events.filter((event) => {
      if (event.id === targetEvent.id) return false

      const targetStart = parseTimeToMinutes(targetEvent.startTime)
      const targetEnd = parseTimeToMinutes(targetEvent.endTime)
      const eventStart = parseTimeToMinutes(event.startTime)
      const eventEnd = parseTimeToMinutes(event.endTime)

      // Check if events overlap
      return targetStart < eventEnd && targetEnd > eventStart
    })
  }

  const parseTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
  }

  const calculateEventPositioning = (events, targetEvent) => {
    const overlappingEvents = getOverlappingEvents(events, targetEvent)
    const allEvents = [targetEvent, ...overlappingEvents].sort((a, b) => {
      const aStart = parseTimeToMinutes(a.startTime)
      const bStart = parseTimeToMinutes(b.startTime)
      if (aStart === bStart) {
        // If start times are equal, sort by end time (longer events first)
        return parseTimeToMinutes(b.endTime) - parseTimeToMinutes(a.endTime)
      }
      return aStart - bStart
    })

    const totalEvents = allEvents.length
    const eventIndex = allEvents.findIndex((event) => event.id === targetEvent.id)

    if (totalEvents === 1) {
      return { width: "100%", left: "0%", zIndex: 20 }
    }

    // Adaptive width calculation - events fill the entire available space
    const width = 100 / totalEvents
    const left = eventIndex * width

    return {
      width: `${width}%`,
      left: `${left}%`,
      zIndex: 20 + eventIndex,
    }
  }

  // Helper function to calculate event position and height
  const calculateEventStyleFn = (startTime, endTime, events = [], targetEvent = null) => {
    const start = Number.parseInt(startTime.split(":")[0]) + Number.parseInt(startTime.split(":")[1]) / 60
    const end = Number.parseInt(endTime.split(":")[0]) + Number.parseInt(endTime.split(":")[1]) / 60
    const slotHeight = getSlotHeight()
    const top = start * slotHeight
    const height = (end - start) * slotHeight

    let positioning = { width: "100%", left: "0%", zIndex: 20 }

    if (targetEvent && events.length > 0) {
      positioning = calculateEventPositioning(events, targetEvent)
    }

    return {
      top: `${top}px`,
      height: `${height}px`,
      ...positioning,
    }
  }

  // Helper function to check if an event spans multiple days in the current week view
  const getEventSpanDays = (event, weekDates) => {
    if (!event.isMultiDay) return []

    const startDate = new Date(event.year, event.month, event.day)
    const endDate = new Date(event.endYear, event.endMonth, event.endDay)
    const spanDays = []

    // Find which days of the current week this event spans
    weekDates.forEach((weekDate, index) => {
      const currentDay = new Date(weekDate.year, weekDate.month, weekDate.date)
      if (currentDay >= startDate && currentDay <= endDate) {
        spanDays.push(index)
      }
    })

    return spanDays
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDisplay()
    const allDayEvents = dayEvents.filter((event) => event.isAllDay)
    const timedEvents = dayEvents.filter((event) => !event.isAllDay)
    const slotHeight = getSlotHeight()
    const showTimeLine = shouldShowCurrentTimeLine()

    return (
      <div 
        className="calendar-container h-full flex flex-col" 
        style={{
          background: `rgba(0, 0, 0, ${backgroundOpacity/100})`,
          borderRadius: backgroundOpacity === 100 ? '1rem' : '0',
          backdropFilter: `blur(${backgroundBlur}px)`,
          WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="p-4 border-b border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
          <h3 className="text-xl font-semibold text-white">{getDisplayTitle()}</h3>

          {/* All-Day Events Section */}
          {allDayEvents.length > 0 && (
            <div className="mt-3">
              {allDayEventDisplay === "full" ? (
                <div className="space-y-2">
                  <div className="text-sm text-white/70 font-medium">All-Day Events</div>
                  <div className="grid gap-2">
                    {allDayEvents.map((event, i) => (
                      <div
                        key={i}
                        className={`${event.color} rounded-md p-3 text-white text-sm shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-1px] hover:shadow-lg ${
                          event.source === "google" ? "border-l-4 border-white" : ""
                        }`}
                        style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {event.title}
                            {event.source === "google" && (
                              <span className="ml-2 text-xs bg-white/20 px-1 py-0.5 rounded">Google</span>
                            )}
                            {event.isRecurring && <Repeat className="inline h-3 w-3 ml-1" />}
                          </div>
                          <div className="text-xs bg-white/20 px-2 py-1 rounded">All Day</div>
                        </div>
                        {event.location && <div className="opacity-80 text-xs mt-1">{event.location}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {allDayEvents.map((event, i) => (
                    <div
                      key={i}
                      className={`${event.color} rounded-full px-3 py-1 text-white text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                        event.source === "google" ? "border border-white/40" : ""
                      }`}
                      style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                      onClick={() => handleEventClick(event)}
                      title={`${event.title} (All Day)${event.location ? ` - ${event.location}` : ""}`}
                    >
                      {event.title}
                      {event.source === "google" && <span className="ml-1">📅</span>}
                      {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full 24-Hour Timeline Container with Synced Scrolling */}
        <div className="flex flex-1 min-h-0 relative">
          <div
            className="flex w-full overflow-y-auto custom-scrollbar"
            onScroll={(e) => {
              // Sync scroll between time column and content
              const scrollTop = e.target.scrollTop
              const timeColumn = e.target.querySelector(".time-column")
              if (timeColumn) {
                timeColumn.scrollTop = scrollTop
              }
            }}
          >
            {/* Fixed Time Column */}
            <div className="w-20 text-white/90 border-r border-white/20 bg-black/20 backdrop-blur-sm z-10 flex-shrink-0 sticky left-0">
              <div className="time-column" style={{ height: `${timeSlots.length * slotHeight}px` }}>
                {timeSlots.map((time, i) => (
                  <div
                    key={i}
                    className="border-b pr-2 text-right text-xs flex items-center justify-end bg-black/20"
                    style={{
                      height: `${slotHeight}px`,
                      borderBottomColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {formatTimeDisplay(time)}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area with Proper Event Containment */}
            <div className="flex-1 relative min-w-0" style={{ height: `${timeSlots.length * slotHeight}px` }}>
              {/* Hour Grid Lines with Drag Functionality */}
              {timeSlots.map((hour, timeIndex) => (
                <div
                  key={timeIndex}
                  className={`border-b cursor-pointer hover:bg-white/5 transition-colors ${
                    isTimeSlotDragged(hour) ? "bg-blue-500/30 border-blue-400" : ""
                  }`}
                  style={{
                    height: `${slotHeight}px`,
                    borderBottomColor: "rgba(255, 255, 255, 0.2)",
                  }}
                  onMouseDown={() => handleTimeSlotMouseDown(hour)}
                  onMouseEnter={() => handleTimeSlotMouseEnter(hour)}
                  onMouseUp={handleTimeSlotMouseUp}
                ></div>
              ))}

              {/* Current Time Line - Only for current day */}
              {showTimeLine && isClient && clientTimeLinePosition !== null && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none"
                  style={{ top: `${clientTimeLinePosition}px` }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full shadow-lg"></div>
                    <div className="flex-1 h-0.5 bg-orange-500 shadow-lg"></div>
                  </div>
                </div>
              )}

              {/* Timed Events with Strict Column Containment */}
              {timedEvents.map((event, i) => {
                const eventStyle = calculateEventStyleFn(event.startTime, event.endTime, timedEvents, event)
                return (
                  <div
                    key={`${event.id}-${i}`}
                    className={`absolute ${event.color} rounded-md p-2 text-white text-sm shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg hover:z-50 overflow-hidden ${
                      event.source === "google" ? "border-l-4 border-white" : ""
                    }`}
                    style={{
                      top: eventStyle.top,
                      height: eventStyle.height,
                      left: `calc(8px + ${eventStyle.left})`,
                      width: `calc(${eventStyle.width} - 16px)`,
                      maxWidth: `calc(100% - 16px)`,
                      zIndex: eventStyle.zIndex,
                      minWidth: "80px",
                      ...(event.exactColor ? { backgroundColor: event.exactColor } : {}),
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEventClick(event)
                    }}
                  >
                    <div className="font-medium truncate text-xs flex items-center">
                      {event.title}
                      {event.source === "google" && (
                        <span className="ml-1 text-[10px] bg-white/20 px-1 py-0.5 rounded">G</span>
                      )}
                      {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                    </div>
                    <div className="opacity-80 text-[10px] mt-1 truncate">{`${event.startTime} - ${event.endTime}`}</div>
                    {event.location && <div className="opacity-80 text-[10px] truncate">{event.location}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const slotHeight = getSlotHeight()
    const weekEvents = getEventsForDisplay()

    return (
      <div 
        className="calendar-container h-full flex flex-col" 
        style={{
          background: `rgba(0, 0, 0, ${backgroundOpacity/100})`,
          borderRadius: backgroundOpacity === 100 ? '1rem' : '0',
          backdropFilter: `blur(${backgroundBlur}px)`,
          WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Shared container for header and grid to maintain alignment */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Week Header - Fixed position */}
          <div className="flex border-b border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
            <div className="w-20 p-2 text-center text-gray-500 text-xs border-r border-white/20 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-7 divide-x divide-white/20 relative min-w-0">
              {weekDays.map((day, i) => {
                const dayDate = weekDates[i]
                const dayAllDayEvents = weekEvents.filter(
                  (event) =>
                    event.isAllDay &&
                    event.day === dayDate.date &&
                    event.month === dayDate.month &&
                    event.year === dayDate.year,
                )

                return (
                  <div key={i} className="p-2 text-center">
                    <div className="text-xs text-white/70 font-medium">{day}</div>
                    <div
                      className={`text-lg font-medium mt-1 ${
                        isCurrentWeekDay(weekDates[i])
                          ? "bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto ring-2 ring-orange-300 font-bold text-white"
                          : "text-white/90"
                      }`}
                    >
                      {weekDates[i].date}
                    </div>

                    {/* All-Day Events for this day */}
                    {dayAllDayEvents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {allDayEventDisplay === "compact" ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {dayAllDayEvents.slice(0, 2).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={`w-2 h-2 rounded-full ${event.color} cursor-pointer relative`}
                                style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                                title={`${event.title} (All Day)`}
                              >
                                {event.isRecurring && <Repeat className="absolute -top-1 -right-1 h-2 w-2 text-white" />}
                              </div>
                            ))}
                            {dayAllDayEvents.length > 2 && (
                              <div className="text-xs text-white/60">+{dayAllDayEvents.length - 2}</div>
                            )}
                          </div>
                        ) : (
                          dayAllDayEvents.slice(0, 2).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={`${event.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate ${
                                event.source === "google" ? "border-l-2 border-white" : ""
                              }`}
                              style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventClick(event)
                              }}
                            >
                              <div className="flex items-center">
                                {event.title}
                                {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Scrollbar-aligned placeholder cell */}
            <div className="w-[10px] flex-shrink-0" aria-hidden="true"></div>
          </div>

          {/* Time Grid with Synced Scrolling */}
          <div className="flex flex-1 min-h-0">
            <div
              className="flex w-full overflow-y-auto custom-scrollbar"
              style={{ 
                scrollbarGutter: 'stable',
                scrollbarWidth: 'thin',
                msOverflowStyle: 'none'
              }}
              onScroll={(e) => {
                // Sync scroll between time column and content
                const scrollTop = e.target.scrollTop
                const timeColumn = e.target.querySelector(".time-column")
                if (timeColumn) {
                  timeColumn.scrollTop = scrollTop
                }
              }}
            >
              {/* Fixed Time Column */}
              <div className="w-20 text-white/90 border-r border-white/20 bg-black/20 backdrop-blur-sm z-10 flex-shrink-0 sticky left-0">
                <div className="time-column" style={{ height: `${timeSlots.length * slotHeight}px` }}>
                  {timeSlots.map((time, i) => (
                    <div
                      key={i}
                      className="border-b pr-2 text-right text-xs flex items-center justify-end bg-black/20"
                      style={{
                        height: `${slotHeight}px`,
                        borderBottomColor: "rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      {formatTimeDisplay(time)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Days Grid with Proper Event Containment and Multi-day Support */}
              <div
                className="flex-1 grid grid-cols-7 divide-x divide-white/20 relative min-w-0"
                style={{ height: `${timeSlots.length * slotHeight}px` }}
              >
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const dayDate = weekDates[dayIndex]
                  const showTimeLine = shouldShowCurrentTimeLine(dayDate)

                  return (
                    <div key={dayIndex} className="relative overflow-hidden">
                      {/* Hour Grid Lines with Drag Functionality */}
                      {timeSlots.map((hour, timeIndex) => (
                        <div
                          key={timeIndex}
                          className={`border-b cursor-pointer hover:bg-white/5 transition-colors ${
                            isTimeSlotDragged(hour) && (dragStart?.day === dayIndex || currentView === "day")
                              ? "bg-blue-500/30 border-blue-400"
                              : ""
                          }`}
                          style={{
                            height: `${slotHeight}px`,
                            borderBottomColor: "rgba(255, 255, 255, 0.2)",
                          }}
                          onMouseDown={() => handleTimeSlotMouseDown(hour, dayIndex)}
                          onMouseEnter={() => handleTimeSlotMouseEnter(hour, dayIndex)}
                          onMouseUp={handleTimeSlotMouseUp}
                        ></div>
                      ))}

                      {/* Current Time Line - Only for current day */}
                      {showTimeLine && isClient && clientTimeLinePosition !== null && (
                        <div
                          className="absolute left-0 right-0 z-30 pointer-events-none"
                          style={{ top: `${clientTimeLinePosition}px` }}
                        >
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full shadow-lg"></div>
                            <div className="flex-1 h-0.5 bg-orange-500 shadow-lg"></div>
                          </div>
                        </div>
                      )}

                      {/* Timed Events with Strict Column Containment */}
                      {events
                        .filter(
                          (event) =>
                            !event.isAllDay &&
                            event.day === weekDates[dayIndex].date &&
                            event.month === weekDates[dayIndex].month &&
                            event.year === weekDates[dayIndex].year,
                        )
                        .map((event, i) => {
                          const dayEvents = events.filter(
                            (e) =>
                              !e.isAllDay &&
                              e.day === weekDates[dayIndex].date &&
                              e.month === weekDates[dayIndex].month &&
                              e.year === weekDates[dayIndex].year,
                          )
                          const eventStyle = calculateEventStyleFn(event.startTime, event.endTime, dayEvents, event)
                          return (
                            <div
                              key={`${event.id}-${i}`}
                              className={`absolute ${event.color} rounded-md p-1 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg hover:z-50 overflow-hidden ${
                                event.source === "google" ? "border-l-2 border-white" : ""
                              }`}
                              style={{
                                top: eventStyle.top,
                                height: eventStyle.height,
                                left: `calc(4px + ${eventStyle.left})`,
                                width: `calc(${eventStyle.width} - 8px)`,
                                maxWidth: `calc(100% - 8px)`,
                                zIndex: eventStyle.zIndex,
                                minWidth: "40px",
                                ...(event.exactColor ? { backgroundColor: event.exactColor } : {}),
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventClick(event)
                              }}
                            >
                              <div className="font-medium truncate text-[10px] flex items-center">
                                {event.title}
                                {event.source === "google" && (
                                  <span className="ml-1 text-[8px] bg-white/20 px-1 rounded">G</span>
                                )}
                                {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                              </div>
                              <div className="opacity-80 text-[8px] mt-1 truncate">{`${event.startTime} - ${event.endTime}`}</div>
                            </div>
                          )
                        })}
                    </div>
                  )
                })}

                {/* Multi-day Events Overlay */}
                {weekEvents
                  .filter((event) => event.isMultiDay && !event.isAllDay)
                  .map((event, i) => {
                    const spanDays = getEventSpanDays(event, weekDates)
                    if (spanDays.length === 0) return null

                    const startDayIndex = spanDays[0]
                    const endDayIndex = spanDays[spanDays.length - 1]
                    const eventStyle = calculateEventStyleFn(event.startTime, event.endTime, [], event)

                    return (
                      <div
                        key={`multi-${event.id}-${i}`}
                        className={`absolute ${event.color} rounded-md p-1 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg hover:z-50 overflow-hidden border-2 border-white/30 ${
                          event.source === "google" ? "border-l-4 border-white" : ""
                        }`}
                        style={{
                          top: eventStyle.top,
                          height: eventStyle.height,
                          left: `calc(${(startDayIndex / 7) * 100}% + 4px)`,
                          width: `calc(${((endDayIndex - startDayIndex + 1) / 7) * 100}% - 8px)`,
                          zIndex: 25,
                          minWidth: "60px",
                          ...(event.exactColor ? { backgroundColor: event.exactColor } : {}),
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="font-medium truncate text-[10px] flex items-center">
                          {event.title}
                          {event.source === "google" && (
                            <span className="ml-1 text-[8px] bg-white/20 px-1 rounded">G</span>
                          )}
                          {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                          <span className="ml-1 text-[8px] bg-white/20 px-1 rounded">Multi-day</span>
                        </div>
                        <div className="opacity-80 text-[8px] mt-1 truncate">{`${event.startTime} - ${event.endTime}`}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthEvents = getEventsForDisplay()

    return (
      <div 
        className="calendar-container" 
        style={{
          background: `rgba(0, 0, 0, ${backgroundOpacity/100})`,
          borderRadius: backgroundOpacity === 100 ? '1rem' : '0',
          backdropFilter: `blur(${backgroundBlur}px)`,
          WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Month Header */}
        <div className="grid grid-cols-7 border-b border-white/20 bg-black/20 backdrop-blur-sm">
          {weekDays.map((day, i) => (
            <div key={i} className="p-3 text-center border-r border-white/20 last:border-r-0">
              <div className="text-sm text-white/90 font-medium">{day}</div>
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 h-full overflow-y-auto custom-scrollbar">
          {miniCalendarDays.map((day, i) => {
            const dayEvents = monthEvents.filter((event) => event.day === day)
            const allDayEvents = dayEvents.filter((event) => event.isAllDay)
            const timedEvents = dayEvents.filter((event) => !event.isAllDay)

            return (
              <div
                key={i}
                className={`border-r border-b last:border-r-0 p-2 min-h-[120px] ${!day ? "invisible" : ""}`}
                style={{
                  borderBottomColor: `rgba(255, 255, 255, 0.2)`,
                  borderRightColor: `rgba(255, 255, 255, 0.2)`,
                }}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isCurrentDay(day)
                          ? "bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                          : "text-white/90"
                      }`}
                    >
                      {day}
                    </div>

                    <div className="space-y-1">
                      {/* All-Day Events */}
                      {allDayEvents.length > 0 && (
                        <div className="space-y-1">
                          {allDayEventDisplay === "compact" ? (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {allDayEvents.slice(0, 3).map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  className={`w-2 h-2 rounded-full ${event.color} cursor-pointer relative`}
                                  style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                                  onClick={() => handleEventClick(event)}
                                  title={`${event.title} (All Day)`}
                                >
                                  {event.isRecurring && (
                                    <Repeat className="absolute -top-1 -right-1 h-1 w-1 text-white" />
                                  )}
                                </div>
                              ))}
                              {allDayEvents.length > 3 && (
                                <div className="text-xs text-white/60">+{allDayEvents.length - 3}</div>
                              )}
                            </div>
                          ) : (
                            allDayEvents.slice(0, 2).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={`${event.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 overflow-hidden ${
                                  event.source === "google" ? "border-l-2 border-white" : ""
                                }`}
                                style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                                onClick={() => handleEventClick(event)}
                              >
                                <div className="truncate font-medium flex items-center">
                                  {event.title} (All Day)
                                  {event.source === "google" && (
                                    <span className="ml-1 text-[8px] bg-white/20 px-1 rounded">G</span>
                                  )}
                                  {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Timed Events */}
                      {timedEvents.slice(0, allDayEventDisplay === "compact" ? 4 : 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`${event.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 overflow-hidden ${
                            event.source === "google" ? "border-l-2 border-white" : ""
                          }`}
                          style={event.exactColor ? { backgroundColor: event.exactColor } : {}}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="truncate font-medium flex items-center">
                            {event.title}
                            {event.source === "google" && (
                              <span className="ml-1 text-[8px] bg-white/20 px-1 rounded">G</span>
                            )}
                            {event.isRecurring && <Repeat className="inline h-2 w-2 ml-1" />}
                          </div>
                          <div className="truncate opacity-80">{event.startTime}</div>
                        </div>
                      ))}

                      {allDayEvents.length + timedEvents.length > (allDayEventDisplay === "compact" ? 4 : 3) && (
                        <div className="text-xs text-white/60">
                          +{allDayEvents.length + timedEvents.length - (allDayEventDisplay === "compact" ? 4 : 3)} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const handleSettingsClick = () => {
    console.log("Settings button clicked!")
    setShowSettingsModal(true)
  }

  const handleCloseCreateModal = () => {
    console.log("Closing create modal")
    setShowCreateModal(false)
    setIsEditMode(false)
    setEditingEventId(null)
    setIsCreatingEvent(false)

    // Reset the new event form to current date/time values
    const currentDateTime = getCurrentDateTime()
    setNewEvent({
      title: "",
      startTime: currentDateTime.startTime,
      endTime: currentDateTime.endTime,
      description: "",
      location: "",
      color: "bg-blue-600",
      day: currentDateTime.day,
      month: currentDateTime.month,
      year: currentDateTime.year,
      isAllDay: false,
      isMultiDay: false,
      endDay: currentDateTime.day,
      endMonth: currentDateTime.month,
      endYear: currentDateTime.year,
      isRecurring: false,
      recurrence: {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        endType: "never",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        count: 10,
      },
    })
  }

  const handleCloseSettingsModal = () => {
    console.log("Closing settings modal")
    setShowSettingsModal(false)
  }

  const handleGoogleSignOut = () => {
    setUser(null)
    localStorage.removeItem("calendar_user")
    setGoogleCalendars([])
    setGoogleCalendarEvents([])
    setAuthError(null)
  }

  const promptGoogleSignIn = () => {
    if (typeof window === "undefined") return;
    
    if (!window.google) {
      console.error("Google API not loaded");
      setAuthError("Google Sign-In is not ready. Please try again in a moment.");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error("Google Client ID is missing");
      setAuthError("Google Sign-In is not properly configured. Please check your environment variables.");
      return;
    }

    try {
      console.log("Prompting Google Sign-In (FedCM-compliant)");
      window.google.accounts.id.prompt((moment) => {
        let momentType = null;
        if (typeof moment.getMomentType === 'function') {
          momentType = moment.getMomentType();
        }
        // FedCM-compliant handling
        switch (momentType) {
          case 'display':
            console.log("Google One Tap is displayed");
            break;
          case 'skipped':
            console.log("Google One Tap was skipped, falling back to OAuth2");
            fallbackToOAuth2();
            break;
          case 'dismissed':
            console.log("Google One Tap was dismissed, falling back to OAuth2");
            fallbackToOAuth2();
            break;
          default:
            // For older browsers or unknown cases
            if (moment.isNotDisplayed && moment.isNotDisplayed()) {
              console.log("Google One Tap not displayed (legacy), falling back to OAuth2");
              fallbackToOAuth2();
            } else if (moment.isSkippedMoment && moment.isSkippedMoment()) {
              console.log("Google One Tap skipped (legacy), falling back to OAuth2");
              fallbackToOAuth2();
            } else if (moment.isDismissedMoment && moment.isDismissedMoment()) {
              console.log("Google One Tap dismissed (legacy), falling back to OAuth2");
              fallbackToOAuth2();
            } else {
              // If we can't determine, always offer fallback
              setAuthError("Google Sign-In prompt could not be displayed. Please use the manual sign-in option.");
              fallbackToOAuth2();
            }
        }
      });
    } catch (error) {
      console.error("Error showing Google Sign-In prompt:", error);
      setAuthError("Failed to show Google Sign-In prompt. Please try again.");
      fallbackToOAuth2();
    }
  }

  // Helper for OAuth2 fallback
  const fallbackToOAuth2 = () => {
    try {
      console.log("Starting OAuth2 fallback...");
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar',
        callback: (response) => {
          console.log("OAuth2 callback received:", response);
          if (response.error) {
            console.error("OAuth2 error:", response.error);
            setAuthError("Failed to sign in. Please try again.");
            return;
          }
          console.log("OAuth2 successful, calling handleGoogleSignIn...");
          handleGoogleSignIn(response);
        },
      });
      console.log("Requesting OAuth2 access token...");
      client.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error("Error in OAuth2 fallback:", error);
      setAuthError("Failed to show Google OAuth2 sign-in. Please try again.");
    }
  }

  const handleCreateEvent = () => {
    const currentDateTime = getCurrentDateTime()
    setNewEvent({
      title: "",
      startTime: currentDateTime.startTime,
      endTime: currentDateTime.endTime,
      description: "",
      location: "",
      color: "bg-blue-600",
      day: currentDateTime.day,
      month: currentDateTime.month,
      year: currentDateTime.year,
      isAllDay: false,
      isMultiDay: false,
      endDay: currentDateTime.day,
      endMonth: currentDateTime.month,
      endYear: currentDateTime.year,
      isRecurring: false,
      recurrence: {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        endType: "never",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        count: 10,
      },
    })
    setShowCreateModal(true)
  }

  const toggleCalendarVisibility = async (calendarId: string) => {
    setGoogleCalendars(
      googleCalendars.map((cal: GoogleCalendar) =>
        cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal,
      ),
    )

    // Trigger a sync to update events based on calendar visibility
    if (user?.accessToken) {
      await fetchGoogleCalendars(user.accessToken, true)
    }
  }

  const handleTodayClick = () => {
    setCurrentDate(new Date())
  }

  const handlePrevNavigation = () => {
    if (currentView === "month") {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      setCurrentDate(newDate)
    } else if (currentView === "week") {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const handleNextNavigation = () => {
    if (currentView === "month") {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      setCurrentDate(newDate)
    } else if (currentView === "week") {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const handleCustomUrlSubmit = () => {
    setBackgroundImage("custom")
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCustomBackgroundUrl(reader.result)
        setBackgroundImage("custom")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLocationChange = (value) => {
    setNewEvent({ ...newEvent, location: value })

    // Basic location suggestion - replace with API call for real data
    if (value.length > 2) {
      const suggestions = sampleLocations.filter((loc) => loc.toLowerCase().includes(value.toLowerCase()))
      setLocationSuggestions(suggestions)
      setShowLocationSuggestions(true)
    } else {
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
    }
  }

  const handleLocationSelect = (location) => {
    setNewEvent({ ...newEvent, location })
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const getGoogleMapsUrl = (location) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  }

  const handleEditEvent = () => {
    setIsEditMode(true)
    setEditingEventId(selectedEvent.id) // Make sure this is the correct ID
    setNewEvent({
      title: selectedEvent.title,
      startTime: selectedEvent.startTime,
      endTime: selectedEvent.endTime,
      description: selectedEvent.description,
      location: selectedEvent.location,
      color: selectedEvent.color,
      day: selectedEvent.day,
      month: selectedEvent.month,
      year: selectedEvent.year,
      isAllDay: selectedEvent.isAllDay || false,
      isMultiDay: selectedEvent.isMultiDay || false,
      endDay: selectedEvent.endDay || selectedEvent.day,
      endMonth: selectedEvent.endMonth || selectedEvent.month,
      endYear: selectedEvent.endYear || selectedEvent.year,
      isRecurring: selectedEvent.isRecurring || false,
      recurrence: selectedEvent.recurrence || {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        endType: "never",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        count: 10,
      },
    })

    // Close the event details modal when opening edit form
    setSelectedEvent(null)
    setShowCreateModal(true)
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    setIsLoaded(true)

    // Load Google API script
    const loadGoogleScript = () => {
      if (typeof window === "undefined") return;
      
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setGoogleScriptLoaded(true);
        // Initialize auth immediately after script loads
        initializeGoogleAuth();
      };
      
      script.onerror = () => {
        console.error("Failed to load Google API script.");
        setAuthError("Failed to load Google API. Please check your internet connection.");
        setIsAuthLoading(false);
      };
      
      document.body.appendChild(script);
    };

    if (isGoogleAuthEnabled && !googleScriptLoaded) {
      loadGoogleScript();
    } else if (isGoogleAuthEnabled && googleScriptLoaded) {
      initializeGoogleAuth();
    }

    // Set initial timeline time
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
      setTimelineCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [googleScriptLoaded])

  // Separate useEffect for Google Auth initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (googleScriptLoaded) {
      initializeGoogleAuth()
    }
  }, [googleScriptLoaded, user])

  const handleRefreshCalendar = async () => {
    if (user?.accessToken) {
      await fetchGoogleCalendars(user.accessToken, true)
    }
  }

  // At the top of the component
  const startTimeDropdownRef = useRef<HTMLDivElement>(null);
  const endTimeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        startTimeDropdownRef.current &&
        !startTimeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStartTimeDropdown(false);
      }
      if (
        endTimeDropdownRef.current &&
        !endTimeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEndTimeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setClientTimeLinePosition(getCurrentTimeLinePosition());
    const interval = setInterval(() => {
      setClientTimeLinePosition(getCurrentTimeLinePosition());
    }, 60000);
    return () => clearInterval(interval);
  }, [isClient, /* add dependencies for getCurrentTimeLinePosition if needed */]);

  // When opening the create event modal, reset hasSetStartTime
  const openCreateEventModal = () => {
    setShowCreateModal(true);
    setIsEditMode(false);
    setSelectedEvent(null);
    setHasSetStartTime(false);
    setTitleError("");
    setTriedSubmit(false);
  };

  // Add refs for the dropdown menus
  const startTimeDropdownMenuRef = useRef<HTMLUListElement>(null);
  const endTimeDropdownMenuRef = useRef<HTMLUListElement>(null);

  // Scroll selected item into view when dropdown opens
  useEffect(() => {
    if (showStartTimeDropdown && startTimeDropdownMenuRef.current) {
      const selected = startTimeDropdownMenuRef.current.querySelector('li[aria-selected="true"]');
      if (selected) {
        (selected as HTMLElement).scrollIntoView({ block: 'center' });
      }
    }
  }, [showStartTimeDropdown]);

  useEffect(() => {
    if (showEndTimeDropdown && endTimeDropdownMenuRef.current) {
      const selected = endTimeDropdownMenuRef.current.querySelector('li[aria-selected="true"]');
      if (selected) {
        (selected as HTMLElement).scrollIntoView({ block: 'center' });
      }
    }
  }, [showEndTimeDropdown]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image with dynamic blur effect */}
      <div className="fixed inset-0 z-0" style={{ pointerEvents: "none" }}>
        <Image
          src={getCurrentBackgroundUrl() || "/placeholder.svg"}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div 
          className="absolute inset-0 bg-black/5" 
          style={{
            backdropFilter: `blur(${backgroundBlur}px)`,
            WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
            transition: 'all 0.3s ease-in-out'
          }}
        />
      </div>

      {/* Auth Error Notification */}
      {authError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Authentication Error</div>
              <div className="text-xs mt-1 opacity-90">{authError}</div>
              <button onClick={() => setAuthError(null)} className="text-xs underline mt-2 hover:no-underline">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Error Notification */}
      {syncError && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Calendar Sync Issue</div>
              <div className="text-xs mt-1 opacity-90">{syncError}</div>
              <button onClick={() => setSyncError(null)} className="text-xs underline mt-2 hover:no-underline">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-6 opacity-0 pointer-events-auto ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-semibold text-white drop-shadow-lg relative z-0">Calendar Interface</span>

          {/* Google Calendar Sync Status */}
          {user && (
            <div className="flex items-center gap-2 z-30 relative">
              <button
                onClick={handleRefreshCalendar}
                disabled={syncStatus === "syncing"}
                className={`flex items-center gap-1 text-xs ${
                  syncStatus === "error"
                    ? "bg-red-500/70 hover:bg-red-500"
                    : syncStatus === "synced"
                      ? "bg-green-500/70 hover:bg-green-500"
                      : syncStatus === "syncing"
                        ? "bg-blue-500/70"
                        : "bg-white/10 hover:bg-white/20"
                } text-white px-3 py-1.5 rounded-full transition-all shadow-sm`}
                title={
                  syncStatus === "syncing"
                    ? "Syncing with Google Calendar..."
                    : syncStatus === "synced"
                      ? "Calendar synced successfully"
                      : syncStatus === "error"
                        ? "Error syncing calendar - click to retry"
                        : "Refresh Google Calendar events"
                }
              >
                <RefreshCw className={`h-3 w-3 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                <span>
                  {syncStatus === "syncing"
                    ? "Syncing..."
                    : syncStatus === "synced"
                      ? "Synced"
                      : syncStatus === "error"
                        ? "Retry"
                        : "Sync"}
                </span>
                {syncStatus === "synced" && <CheckCircle className="h-3 w-3" />}
              </button>
              {lastSyncTime && (
                <span className="text-xs text-white/70">
                  Last sync: {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-20 flex z-10" ref={calendarRef}>
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-0" : "w-64"
          } h-full bg-white/10 backdrop-blur-lg shadow-xl border-r border-white/20 rounded-tr-3xl transition-all duration-300 ease-in-out overflow-hidden opacity-0 ${
            isLoaded ? "animate-fade-in" : ""
          } flex flex-col justify-between relative`}
          style={{ animationDelay: "0.4s" }}
        >
          {!sidebarCollapsed && (
            <>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={openCreateEventModal}
                    className="flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white hover:bg-blue-600 transition-colors flex-1"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create</span>
                  </button>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="ml-3 p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <PanelLeftClose className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex mb-4 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setSidebarTab("calendar")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                      sidebarTab === "calendar"
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setSidebarTab("calendars")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                      sidebarTab === "calendars"
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Calendars
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {sidebarTab === "calendar" && (
                    <div>
                      {/* Mini Calendar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-medium">
                            {monthNames[sidebarCurrentDateInfo.month]} {sidebarCurrentDateInfo.year}
                          </h3>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const newDate = new Date(currentDate)
                                newDate.setMonth(newDate.getMonth() - 1)
                                setCurrentDate(newDate)
                              }}
                              className="p-1 rounded-full hover:bg-white/20"
                            >
                              <ChevronLeft className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={() => {
                                const newDate = new Date(currentDate)
                                newDate.setMonth(newDate.getMonth() + 1)
                                setCurrentDate(newDate)
                              }}
                              className="p-1 rounded-full hover:bg-white/20"
                            >
                              <ChevronRight className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                            <div key={i} className="text-xs text-white/70 font-medium py-1">
                              {day}
                            </div>
                          ))}

                          {miniCalendarDays.map((day, i) => (
                            <div
                              key={i}
                              className={`text-xs rounded-full w-7 h-7 flex items-center justify-center cursor-pointer ${
                                isCurrentDay(day)
                                  ? "bg-orange-500 text-white font-bold ring-2 ring-orange-300"
                                  : "text-white hover:bg-white/20"
                              } ${!day ? "invisible" : ""}`}
                              onClick={() => {
                                if (day) {
                                  const newDate = new Date(
                                    sidebarCurrentDateInfo.year,
                                    sidebarCurrentDateInfo.month,
                                    day,
                                  )
                                  setCurrentDate(newDate)
                                }
                              }}
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {sidebarTab === "calendars" && (
                    <div className="space-y-4">
                      {/* Local Calendar */}
                      <div>
                        <h4 className="text-white font-medium text-sm mb-2">Local Calendar</h4>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-white text-sm">My Events</span>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                      </div>

                      {/* Google Calendars */}
                      {user && googleCalendars.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium text-sm">Google Calendars</h4>
                            <button
                              onClick={handleRefreshCalendar}
                              disabled={isLoadingEvents}
                              className="p-1 rounded-full hover:bg-white/20 transition-colors"
                              title="Refresh calendars"
                            >
                              <RefreshCw className={`h-3 w-3 text-white/70 ${isLoadingEvents ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar-thin">
                            {googleCalendars.map((calendar) => (
                              <div
                                key={calendar.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: calendar.backgroundColor || "#3b82f6",
                                    }}
                                  ></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-white text-sm truncate">{calendar.summary}</div>
                                    {calendar.primary && <div className="text-xs text-white/60">Primary</div>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleCalendarVisibility(calendar.id)}
                                  className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                                  title={calendar.visible ? "Hide calendar" : "Show calendar"}
                                >
                                  {calendar.visible ? (
                                    <Eye className="h-4 w-4 text-white/70" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-white/40" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sign in prompt if not authenticated */}
                      {!user && (
                        <div className="text-center py-4">
                          <div className="text-white/70 text-sm mb-3">Sign in with Google to sync your calendars</div>
                          <button
                            onClick={promptGoogleSignIn}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                          >
                            Sign In
                          </button>
                        </div>
                      )}

                      {/* No calendars message */}
                      {user && googleCalendars.length === 0 && !isLoadingEvents && (
                        <div className="text-center py-4">
                          <div className="text-white/70 text-sm mb-3">No Google Calendars found</div>
                          <button
                            onClick={handleRefreshCalendar}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                          >
                            Refresh
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Create Button */}
              <div className="p-4">
                <button
                  onClick={openCreateEventModal}
                  className="flex items-center justify-center gap-2 rounded-full bg-blue-500 p-4 text-white w-14 h-14 hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Handle (when collapsed) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-r-lg p-2 hover:bg-white/20 transition-all duration-300"
          >
            <PanelLeftOpen className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""} transition-all duration-300`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={handleTodayClick}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
              >
                Today
              </button>
              <div className="flex">
                <button onClick={handlePrevNavigation} className="p-2 text-white hover:bg-white/10 rounded-l-md">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleNextNavigation} className="p-2 text-white hover:bg-white/10 rounded-r-md">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-white">{getDisplayTitle()}</h2>
            </div>

            <div className="flex items-center gap-2 rounded-md p-1">
              <button
                onClick={() => setCurrentView("day")}
                className={`px-3 py-1 rounded ${currentView === "day" ? "bg-white/20" : ""} text-white text-sm hover:bg-white/10 transition-colors`}
              >
                Day
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`px-3 py-1 rounded ${currentView === "week" ? "bg-white/20" : ""} text-white text-sm hover:bg-white/10 transition-colors`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView("month")}
                className={`px-3 py-1 rounded ${currentView === "month" ? "bg-white/20" : ""} text-white text-sm hover:bg-white/10 transition-colors`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Calendar Views */}
          <div className="flex-1 overflow-hidden">
            {currentView === "day" && renderDayView()}
            {currentView === "week" && renderWeekView()}
            {currentView === "month" && renderMonthView()}
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className={`${selectedEvent.color} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}
              style={selectedEvent.exactColor ? { backgroundColor: selectedEvent.exactColor } : {}}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="text-2xl font-bold text-white">{selectedEvent.title}</h3>
                  {selectedEvent.isRecurring && <Repeat className="h-5 w-5 text-white" />}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {selectedEvent.source === "google" && (
                <div className="mb-3">
                  <span className="inline-block text-sm bg-white/20 px-2 py-1 rounded">
                    📅 {selectedEvent.calendarName || "Google Calendar"}
                  </span>
                </div>
              )}

              <div className="space-y-3 text-white">
                <div className="flex items-center">
                  <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {selectedEvent.isAllDay ? "All Day" : `${selectedEvent.startTime} - ${selectedEvent.endTime}`}
                  </span>
                </div>

                <div className="flex items-center">
                  <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {monthNames[selectedEvent.month]} {selectedEvent.day}, {selectedEvent.year}
                    {selectedEvent.isMultiDay &&
                      ` - ${monthNames[selectedEvent.endMonth]} ${selectedEvent.endDay}, ${selectedEvent.endYear}`}
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <div>{selectedEvent.location}</div>
                      <a
                        href={getGoogleMapsUrl(selectedEvent.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline hover:no-underline"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>{selectedEvent.description}</span>
                  </div>
                )}

                {selectedEvent.organizer && (
                  <div className="flex items-center">
                    <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Organizer: {selectedEvent.organizer}</span>
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <div>
                      <div>Attendees ({selectedEvent.attendees.length}):</div>
                      <div className="text-sm opacity-90">{selectedEvent.attendees.join(", ")}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditEvent}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Event Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseCreateModal}
          >
            <div
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">{isEditMode ? "Edit Event" : "Create New Event"}</h2>
                  <button
                    onClick={handleCloseCreateModal}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors focus:outline-none"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Event Title */}
                  <div className="mb-4">
                    <label className="block text-white text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={e => {
                        setNewEvent({ ...newEvent, title: e.target.value });
                        if (triedSubmit && titleError) setTitleError("");
                      }}
                      className={`w-full px-3 py-2 rounded-md text-white bg-white/10 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${titleError && triedSubmit ? 'border-red-500' : 'border-white/20'}`}
                      placeholder="Event title"
                    />
                    {titleError && triedSubmit && <div className="text-red-500 text-xs mt-1">{titleError}</div>}
                  </div>

                  {/* Calendar Selection for New Events */}
                  {!isEditMode && user && googleCalendars.length > 0 && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Calendar</label>
                      <select
                        value={selectedCalendarForNewEvents}
                        onChange={(e) => setSelectedCalendarForNewEvents(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="local" className="bg-gray-800">
                          Local Calendar
                        </option>
                        {googleCalendars.map((calendar) => (
                          <option key={calendar.id} value={calendar.id} className="bg-gray-800">
                            {calendar.summary}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* All Day Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvent.isAllDay}
                        onChange={handleAllDayToggle}
                        className="sr-only"
                      />
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          newEvent.isAllDay ? "bg-blue-500" : "bg-white/20"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            newEvent.isAllDay ? "translate-x-5" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-3 text-white text-sm">All Day</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvent.isMultiDay}
                        onChange={handleMultiDayToggle}
                        className="sr-only"
                      />
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          newEvent.isMultiDay ? "bg-blue-500" : "bg-white/20"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            newEvent.isMultiDay ? "translate-x-5" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-3 text-white text-sm">Multi-Day</span>
                    </label>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Start Date</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {`${monthNames[newEvent.month]} ${newEvent.day}, ${newEvent.year}`}
                        </button>

                        {showDatePicker && (
                          <div className="absolute top-full left-0 mt-1 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl p-4 z-50">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-white font-medium">
                                {monthNames[newEvent.month]} {newEvent.year}
                              </h3>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const newMonth = newEvent.month - 1
                                    const newYear = newEvent.year
                                    setNewEvent({
                                      ...newEvent,
                                      month: newMonth < 0 ? 11 : newMonth,
                                      year: newMonth < 0 ? newYear - 1 : newYear,
                                    })
                                  }}
                                  className="p-1 rounded-full hover:bg-white/20"
                                >
                                  <ChevronLeft className="h-4 w-4 text-white" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newMonth = newEvent.month + 1
                                    const newYear = newEvent.year
                                    setNewEvent({
                                      ...newEvent,
                                      month: newMonth > 11 ? 0 : newMonth,
                                      year: newMonth > 11 ? newYear + 1 : newYear,
                                    })
                                  }}
                                  className="p-1 rounded-full hover:bg-white/20"
                                >
                                  <ChevronRight className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center">
                              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                <div key={i} className="text-xs text-white/70 font-medium py-1">
                                  {day}
                                </div>
                              ))}

                              {generateDatePickerDays(newEvent.month, newEvent.year).map((day, i) => (
                                <button
                                  key={i}
                                  onClick={() => day && handleDateSelect(day, newEvent.month, newEvent.year)}
                                  className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${
                                    day === newEvent.day
                                      ? "bg-blue-500 text-white font-bold"
                                      : "text-white hover:bg-white/20"
                                  } ${!day ? "invisible" : ""}`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* End Date (only for multi-day events) */}
                    {newEvent.isMultiDay && (
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">End Date</label>
                        <div className="relative">
                          <button
                            onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {`${monthNames[newEvent.endMonth]} ${newEvent.endDay}, ${newEvent.endYear}`}
                          </button>

                          {showEndDatePicker && (
                            <div className="absolute top-full left-0 mt-1 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl p-4 z-50">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-medium">
                                  {monthNames[newEvent.endMonth]} {newEvent.endYear}
                                </h3>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      const newMonth = newEvent.endMonth - 1
                                      const newYear = newEvent.endYear
                                      setNewEvent({
                                        ...newEvent,
                                        endMonth: newMonth < 0 ? 11 : newMonth,
                                        endYear: newMonth < 0 ? newYear - 1 : newYear,
                                      })
                                    }}
                                    className="p-1 rounded-full hover:bg-white/20"
                                  >
                                    <ChevronLeft className="h-4 w-4 text-white" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newMonth = newEvent.endMonth + 1
                                      const newYear = newEvent.endYear
                                      setNewEvent({
                                        ...newEvent,
                                        endMonth: newMonth > 11 ? 0 : newMonth,
                                        endYear: newMonth > 11 ? newYear + 1 : newYear,
                                      })
                                    }}
                                    className="p-1 rounded-full hover:bg-white/20"
                                  >
                                    <ChevronRight className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-7 gap-1 text-center">
                                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                  <div key={i} className="text-xs text-white/70 font-medium py-1">
                                    {day}
                                  </div>
                                ))}

                                {generateDatePickerDays(newEvent.endMonth, newEvent.endYear).map((day, i) => (
                                  <button
                                    key={i}
                                    onClick={() => day && handleEndDateSelect(day, newEvent.endMonth, newEvent.endYear)}
                                    className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${
                                      day === newEvent.endDay
                                        ? "bg-blue-500 text-white font-bold"
                                        : "text-white hover:bg-white/20"
                                    } ${!day ? "invisible" : ""}`}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Selection (only if not all day) */}
                  {!newEvent.isAllDay && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Time */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Start Time</label>
                        <div className="relative" ref={startTimeDropdownRef}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => setShowStartTimeDropdown(!showStartTimeDropdown)}
                            aria-haspopup="listbox"
                            aria-expanded={showStartTimeDropdown}
                          >
                            {timeOptions.find((t) => t.value === newEvent.startTime)?.label}
                          </button>
                          {showStartTimeDropdown && (
                            <ul
                              ref={startTimeDropdownMenuRef}
                              tabIndex={-1}
                              className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-gray-900/95 border border-white/20 rounded-lg shadow-xl p-4 pointer-events-auto"
                              role="listbox"
                              onBlur={() => setShowStartTimeDropdown(false)}
                            >
                              {timeOptions.map((time) => (
                                <li
                                  key={time.value}
                                  role="option"
                                  aria-selected={newEvent.startTime === time.value}
                                  className={`px-4 py-2 cursor-pointer text-white hover:bg-white/30 transition-colors ${newEvent.startTime === time.value ? "bg-blue-500/70" : ""}`}
                                  onClick={() => {
                                    handleTimeChange(time.value, true)
                                    setShowStartTimeDropdown(false)
                                  }}
                                >
                                  {time.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">End Time</label>
                        <div className="relative" ref={endTimeDropdownRef}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => setShowEndTimeDropdown(!showEndTimeDropdown)}
                            aria-haspopup="listbox"
                            aria-expanded={showEndTimeDropdown}
                          >
                            {timeOptions.find((t) => t.value === newEvent.endTime)?.label}
                          </button>
                          {showEndTimeDropdown && (
                            <ul
                              ref={endTimeDropdownMenuRef}
                              tabIndex={-1}
                              className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-gray-900/95 border border-white/20 rounded-lg shadow-xl p-4 pointer-events-auto"
                              role="listbox"
                              onBlur={() => setShowEndTimeDropdown(false)}
                            >
                              {timeOptions.map((time) => (
                                <li
                                  key={time.value}
                                  role="option"
                                  aria-selected={newEvent.endTime === time.value}
                                  className={`px-4 py-2 cursor-pointer text-white hover:bg-white/30 transition-colors ${newEvent.endTime === time.value ? "bg-blue-500/70" : ""}`}
                                  onClick={() => {
                                    handleTimeChange(time.value, false)
                                    setShowEndTimeDropdown(false)
                                  }}
                                >
                                  {time.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recurring Event Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvent.isRecurring}
                        onChange={handleRecurringToggle}
                        className="sr-only"
                      />
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          newEvent.isRecurring ? "bg-blue-500" : "bg-white/20"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            newEvent.isRecurring ? "translate-x-5" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-3 text-white text-sm flex items-center gap-1">
                        <Repeat className="h-4 w-4" />
                        Recurring Event
                      </span>
                    </label>
                  </div>

                  {/* Recurrence Options */}
                  {newEvent.isRecurring && (
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium text-sm">Recurrence Settings</h4>

                      {/* Frequency */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Frequency</label>
                          <select
                            value={newEvent.recurrence.frequency}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                recurrence: {
                                  ...newEvent.recurrence,
                                  frequency: e.target.value as "daily" | "weekly" | "monthly" | "yearly",
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="daily" className="bg-gray-800">Daily</option>
                            <option value="weekly" className="bg-gray-800">Weekly</option>
                            <option value="monthly" className="bg-gray-800">Monthly</option>
                            <option value="yearly" className="bg-gray-800">Yearly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Interval</label>
                          <select
                            value={newEvent.recurrence.interval}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                recurrence: {
                                  ...newEvent.recurrence,
                                  interval: Number.parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num} className="bg-gray-800">
                                Every {num} {newEvent.recurrence.frequency.slice(0, -2)}
                                {num > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Days of Week (for weekly recurrence) */}
                      {newEvent.recurrence.frequency === "weekly" && (
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Days of Week</label>
                          <div className="flex gap-2 flex-wrap">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  const currentDays = newEvent.recurrence.daysOfWeek || []
                                  const newDays = currentDays.includes(index)
                                    ? currentDays.filter((d) => d !== index)
                                    : [...currentDays, index]
                                  setNewEvent({
                                    ...newEvent,
                                    recurrence: {
                                      ...newEvent.recurrence,
                                      daysOfWeek: newDays,
                                    },
                                  })
                                }}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                  newEvent.recurrence.daysOfWeek?.includes(index)
                                    ? "bg-blue-500 text-white"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* End Condition */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">End Condition</label>
                        <div className="space-y-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="endType"
                              value="never"
                              checked={newEvent.recurrence.endType === "never"}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  recurrence: {
                                    ...newEvent.recurrence,
                                    endType: e.target.value as "never" | "date" | "count",
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-white text-sm">Never</span>
                          </label>

                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="endType"
                              value="date"
                              checked={newEvent.recurrence.endType === "date"}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  recurrence: {
                                    ...newEvent.recurrence,
                                    endType: e.target.value as "never" | "date" | "count",
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-white text-sm">End by date</span>
                          </label>

                          {newEvent.recurrence.endType === "date" && (
                            <div className="ml-6 relative">
                              <button
                                onClick={() => setShowRecurrenceEndDatePicker(!showRecurrenceEndDatePicker)}
                                className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {newEvent.recurrence.endDate
                                  ? `${monthNames[newEvent.recurrence.endDate.getMonth()]} ${newEvent.recurrence.endDate.getDate()}, ${newEvent.recurrence.endDate.getFullYear()}`
                                  : "Select end date"}
                              </button>

                              {showRecurrenceEndDatePicker && (
                                <div className="absolute top-full left-0 mt-1 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl p-4 z-50">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-medium">
                                      {monthNames[newEvent.recurrence.endDate?.getMonth() || new Date().getMonth()]}{" "}
                                      {newEvent.recurrence.endDate?.getFullYear() || new Date().getFullYear()}
                                    </h3>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          const currentDate = newEvent.recurrence.endDate || new Date()
                                          const newDate = new Date(currentDate)
                                          newDate.setMonth(newDate.getMonth() - 1)
                                          setNewEvent({
                                            ...newEvent,
                                            recurrence: {
                                              ...newEvent.recurrence,
                                              endDate: newDate,
                                            },
                                          })
                                        }}
                                        className="p-1 rounded-full hover:bg-white/20"
                                      >
                                        <ChevronLeft className="h-4 w-4 text-white" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const currentDate = newEvent.recurrence.endDate || new Date()
                                          const newDate = new Date(currentDate)
                                          newDate.setMonth(newDate.getMonth() + 1)
                                          setNewEvent({
                                            ...newEvent,
                                            recurrence: {
                                              ...newEvent.recurrence,
                                              endDate: newDate,
                                            },
                                          })
                                        }}
                                        className="p-1 rounded-full hover:bg-white/20"
                                      >
                                        <ChevronRight className="h-4 w-4 text-white" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-7 gap-1 text-center">
                                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                      <div key={i} className="text-xs text-white/70 font-medium py-1">
                                        {day}
                                      </div>
                                    ))}

                                    {generateDatePickerDays(
                                      newEvent.recurrence.endDate?.getMonth() || new Date().getMonth(),
                                      newEvent.recurrence.endDate?.getFullYear() || new Date().getFullYear(),
                                    ).map((day, i) => (
                                      <button
                                        key={i}
                                        onClick={() =>
                                          day &&
                                          handleRecurrenceEndDateSelect(
                                            day,
                                            newEvent.recurrence.endDate?.getMonth() || new Date().getMonth(),
                                            newEvent.recurrence.endDate?.getFullYear() || new Date().getFullYear(),
                                          )
                                        }
                                        className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${
                                          day === newEvent.recurrence.endDate?.getDate()
                                            ? "bg-blue-500 text-white font-bold"
                                            : "text-white hover:bg-white/20"
                                        } ${!day ? "invisible" : ""}`}
                                      >
                                        {day}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="endType"
                              value="count"
                              checked={newEvent.recurrence.endType === "count"}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  recurrence: {
                                    ...newEvent.recurrence,
                                    endType: e.target.value as "never" | "date" | "count",
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-white text-sm">End after</span>
                          </label>

                          {newEvent.recurrence.endType === "count" && (
                            <div className="ml-6 flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={newEvent.recurrence.count}
                                onChange={(e) =>
                                  setNewEvent({
                                    ...newEvent,
                                    recurrence: {
                                      ...newEvent.recurrence,
                                      count: Number.parseInt(e.target.value) || 1,
                                    },
                                  })
                                }
                                className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-white text-sm">occurrences</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="relative">
                    <label className="block text-white text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location"
                    />

                    {/* Location Suggestions */}
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl max-h-40 overflow-y-auto z-50">
                        {locationSuggestions.map((location, i) => (
                          <button
                            key={i}
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left px-3 py-2 text-white hover:bg-white/20 transition-colors text-sm"
                          >
                            {location}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                      placeholder="Enter event description"
                    />
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Color</label>
                    <div className="grid grid-cols-11 gap-2">
                      {eventColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                          className={`w-8 h-8 rounded-full ${color.preview} border-2 ${
                            newEvent.color === color.value ? "border-white" : "border-transparent"
                          } hover:scale-110 transition-transform`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCloseCreateModal}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEvent}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      {isEditMode ? "Update Event" : "Create Event"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Event Confirmation Dialog */}
        {showRecurringDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Repeat className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Edit Recurring Event</h3>
              </div>

              <p className="text-white/80 mb-6">This is a recurring event. How would you like to apply your changes?</p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="recurringAction"
                    value="this"
                    checked={recurringEventAction === "this"}
                    onChange={(e) => setRecurringEventAction(e.target.value as "this" | "future" | "all")}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-white font-medium">This event only</div>
                    <div className="text-white/60 text-sm">Only this occurrence will be changed</div>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="recurringAction"
                    value="future"
                    checked={recurringEventAction === "future"}
                    onChange={(e) => setRecurringEventAction(e.target.value as "this" | "future" | "all")}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-white font-medium">This and future events</div>
                    <div className="text-white/60 text-sm">This and all future occurrences will be changed</div>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="recurringAction"
                    value="all"
                    checked={recurringEventAction === "all"}
                    onChange={(e) => setRecurringEventAction(e.target.value as "this" | "future" | "all")}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-white font-medium">All events</div>
                    <div className="text-white/60 text-sm">All occurrences of this event will be changed</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRecurringDialog(false)
                    setPendingEventUpdate(null)
                    setRecurringEventAction("this")
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecurringEventConfirm}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseSettingsModal}
          >
            <div
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Settings</h2>
                  <button
                    onClick={handleCloseSettingsModal}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Time Zone */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Time Zone</label>
                    <select
                      value={selectedTimeZone}
                      onChange={(e) => setSelectedTimeZone(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeZones.map((tz) => (
                        <option key={tz.value} value={tz.value} className="bg-gray-800">
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Formatting Section */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setFormattingSectionCollapsed(!formattingSectionCollapsed)}
                      className="flex items-center justify-between w-full text-white text-sm font-medium hover:text-white/90 transition-colors"
                    >
                      <span>Formatting</span>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          formattingSectionCollapsed ? "" : "rotate-180"
                        }`}
                      />
                    </button>
                    <div
                      className={`space-y-4 pl-4 border-l-2 border-white/10 overflow-hidden transition-all duration-200 ${
                        formattingSectionCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                      }`}
                    >
                      {/* Calendar Compactness */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Calendar Compactness: {compactness}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={compactness}
                          onChange={(e) => setCompactness(Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-white/70 mt-1">
                          <span>Compact</span>
                          <span>Spacious</span>
                        </div>
                      </div>

                      {/* Calendar Background Opacity */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Calendar Background Opacity: {backgroundOpacity}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={backgroundOpacity}
                          onChange={(e) => setBackgroundOpacity(Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-white/70 mt-1">
                          <span>Transparent</span>
                          <span>Opaque</span>
                        </div>
                      </div>

                      {/* Calendar Background Blur */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Background Blur: {backgroundBlur}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={backgroundBlur}
                          onChange={(e) => setBackgroundBlur(Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-white/70 mt-1">
                          <span>Clear</span>
                          <span>Blurred</span>
                        </div>
                      </div>

                      {/* All-Day Event Display */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">All-Day Event Display</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAllDayEventDisplay("full")}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${
                              allDayEventDisplay === "full"
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                          >
                            Full Details
                          </button>
                          <button
                            onClick={() => setAllDayEventDisplay("compact")}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${
                              allDayEventDisplay === "compact"
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                          >
                            Compact Dots
                          </button>
                        </div>
                      </div>

                      {/* Show Current Timeline Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">Show Current Time Line</div>
                          <div className="text-white/70 text-xs">Display a line showing the current time</div>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showTimeline}
                            onChange={(e) => setShowTimeline(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              showTimeline ? "bg-blue-500" : "bg-white/20"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                showTimeline ? "translate-x-5" : ""
                              }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Background Image Selection */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Background Image</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {backgroundImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setBackgroundImage(img.id)}
                          className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                            backgroundImage === img.id ? "border-blue-500" : "border-white/20"
                          } hover:border-white/40 transition-colors`}
                        >
                          <Image src={img.url || "/placeholder.svg"} alt={img.name} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-end">
                            <div className="p-2 text-white text-xs font-medium">{img.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Background Options */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white text-xs font-medium mb-1">Custom URL</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={customBackgroundUrl}
                            onChange={(e) => setCustomBackgroundUrl(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter image URL"
                          />
                          <button
                            onClick={handleCustomUrlSubmit}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                          >
                            <Link className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white text-xs font-medium mb-1">Upload Image</label>
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            Choose File
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.5);
        }

        .custom-scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .custom-scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .calendar-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      {/* Settings and Login/Profile Buttons - Always on Top */}
      <div className="fixed top-6 right-8 flex items-center gap-4 z-[100]">
        <button
          onClick={handleSettingsClick}
          className="group relative p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl z-[100] pointer-events-auto"
          style={{ pointerEvents: "auto" }}
        >
          <Settings className="h-6 w-6 text-white drop-shadow-md group-hover:rotate-90 transition-transform duration-300 ease-in-out" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* User Profile / Login */}
        <div className="relative z-[100]" ref={userMenuRef}>
          {isAuthLoading ? (
            <div className="h-10 w-10 rounded-full bg-gray-400 animate-pulse"></div>
          ) : user ? (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-colors"
            >
              <Image
                src={user.picture || "/placeholder.svg"}
                alt={user.name}
                width={40}
                height={40}
                className="object-cover"
              />
            </button>
          ) : (
            <button
              onClick={promptGoogleSignIn}
              className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md hover:bg-blue-600 transition-colors"
              title={
                authError
                  ? "Google Sign-In not available"
                  : isGoogleAuthEnabled
                    ? "Sign in with Google"
                    : "Google Sign-In not configured"
              }
            >
              <User className="h-5 w-5" />
            </button>
          )}

          {/* User Menu Dropdown */}
          {showUserMenu && user && (
            <div className="absolute right-0 top-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-4 min-w-[200px] z-[100]">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
                <Image
                  src={user.picture || "/placeholder.svg"}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <div className="text-white font-medium text-sm">{user.name}</div>
                  <div className="text-white/70 text-xs">{user.email}</div>
                </div>
              </div>

              {/* Calendar sync status */}
              <div className="mb-3 pb-3 border-b border-white/20">
                <div className="text-xs text-white/70 mb-1">Google Calendar</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.accessToken ? "bg-green-400" : "bg-red-400"}`}></div>
                  <span className="text-xs text-white">{user.accessToken ? "Connected" : "Not connected"}</span>
                </div>
                {googleCalendars.length > 0 && (
                  <div className="text-xs text-white/60 mt-1">
                    {googleCalendars.filter((cal) => cal.visible).length} of {googleCalendars.length} calendars
                    visible
                  </div>
                )}
              </div>

              <button
                onClick={handleGoogleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}

          {/* Google Sign In Button Container - Only show if Google Auth is enabled and no error */}
          {!user && !isAuthLoading && isGoogleAuthEnabled && !authError && (
            <div id="google-signin-button" className="absolute right-0 top-12 z-[100]"></div>
          )}
        </div>
      </div>
    </div>
  )
}
