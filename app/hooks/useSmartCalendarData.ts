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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  const fetchAllData = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const savedVisibilityJSON = localStorage.getItem("calendarVisibility");
      const savedVisibility = savedVisibilityJSON ? JSON.parse(savedVisibilityJSON) : {};

      const calResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!calResponse.ok) throw new Error("Failed to fetch calendar list.");
      const calData = await calResponse.json();
      
      const fetchedCalendars: GoogleCalendar[] = calData.items.map((cal: any) => ({
        id: cal.id, summary: cal.summary, backgroundColor: cal.backgroundColor, primary: cal.primary, selected: cal.selected
      }));
      setCalendars(fetchedCalendars);

      const initialVisibility = fetchedCalendars.reduce((acc: Record<string, boolean>, cal: GoogleCalendar) => {
        acc[cal.id] = savedVisibility[cal.id] !== undefined ? savedVisibility[cal.id] : (cal.primary || cal.selected || false);
        return acc;
      }, {});
      setVisibility(initialVisibility);
      
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3);

      const eventPromises = fetchedCalendars.map((calendar: GoogleCalendar) =>
        fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then(res => res.ok ? res.json() : Promise.resolve({ items: [] }))
        .then(data => (data.items || []).map((event: any) => ({ ...event, calendarId: calendar.id })))
      );
      
      const eventsForAllCalendars = (await Promise.all(eventPromises)).flat();
      setAllEvents(eventsForAllCalendars);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.accessToken) {
      fetchAllData(user.accessToken);
    } else {
      setIsLoading(false);
    }
  }, [user?.accessToken, fetchAllData]);

  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, [calendarId]: !prev[calendarId] };
      localStorage.setItem("calendarVisibility", JSON.stringify(newVisibility));
      return newVisibility;
    });
  }, []);

  const visibleEvents = useMemo(() => {
    return allEvents.filter(event => visibility[event.calendarId]);
  }, [allEvents, visibility]);

  return { 
    isLoading, error, calendars, visibility, toggleCalendarVisibility, visibleEvents,
    refreshData: () => user?.accessToken && fetchAllData(user.accessToken)
  };
} 