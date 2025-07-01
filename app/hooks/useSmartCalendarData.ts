import { useState, useEffect, useMemo, useCallback } from "react";

// Types (copy from page.tsx)
export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  given_name: string;
  family_name: string;
  accessToken?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole: string;
  selected?: boolean;
  visible: boolean;
  colorId?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  calendarId: string;
  calendarColor?: string;
  recurringEventId?: string;
  recurrence?: string[];
}

export function useSmartCalendarData(user: GoogleUser | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [allEvents, setAllEvents] = useState<GoogleCalendarEvent[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch all calendars and all events for all calendars
  const fetchAllData = useCallback(async () => {
    if (!user?.accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch all calendars
      const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (!calRes.ok) throw new Error("Failed to fetch calendars");
      const calData = await calRes.json();
      const userCalendars: GoogleCalendar[] = calData.items.map((cal: any) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        primary: cal.primary,
        accessRole: cal.accessRole,
        selected: cal.selected,
        visible: true, // default to visible
        colorId: cal.colorId,
      }));
      setCalendars(userCalendars);
      // 2. Set initial visibility for all calendars to true
      const initialVisibility = userCalendars.reduce((acc, cal) => {
        acc[cal.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibility(initialVisibility);
      // 3. Fetch events for ALL calendars concurrently
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      const eventPromises = userCalendars.map((cal) =>
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        )
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .then((data) => (data.items || []).map((event: any) => ({ ...event, calendarId: cal.id })))
      );
      const allEventsArr = (await Promise.all(eventPromises)).flat();
      setAllEvents(allEventsArr);
    } catch (err) {
      setError("Could not load calendar data. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.accessToken) fetchAllData();
  }, [user, fetchAllData]);

  // Only update visibility state, no network
  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setVisibility((prev) => ({ ...prev, [calendarId]: !prev[calendarId] }));
  }, []);

  // Memoized visible events
  const visibleEvents = useMemo(() => {
    return allEvents.filter((event) => visibility[event.calendarId]);
  }, [allEvents, visibility]);

  // Manual refresh
  const refreshCalendarData = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    isLoading,
    calendars,
    visibility,
    toggleCalendarVisibility,
    visibleEvents,
    refreshCalendarData,
    error,
    setError,
  };
} 