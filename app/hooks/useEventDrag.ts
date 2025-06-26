import { useState, useCallback, useRef } from 'react'

interface DragState {
  isDragging: boolean
  draggedEventId: string | null
  initialMouseY: number
  newStartTime: string | null
  originalEvent: any | null
}

interface UseEventDragProps {
  onEventUpdate: (eventId: string, newStartTime: string, newEndTime: string) => Promise<boolean>
  onError: (message: string) => void
  slotHeight: number
}

export const useEventDrag = ({ onEventUpdate, onError, slotHeight }: UseEventDragProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedEventId: null,
    initialMouseY: 0,
    newStartTime: null,
    originalEvent: null
  })

  const originalEventRef = useRef<any>(null)

  // Convert minutes to time string (HH:MM format)
  const minutesToTimeString = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }, [])

  // Convert time string to minutes
  const timeStringToMinutes = useCallback((timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }, [])

  // Snap time to nearest 15-minute increment
  const snapToQuarterHour = useCallback((minutes: number): number => {
    return Math.round(minutes / 15) * 15
  }, [])

  // Calculate new time based on mouse movement
  const calculateNewTime = useCallback((deltaY: number, originalStartTime: string): string => {
    const pixelsPerMinute = slotHeight / 60 // Assuming 1 hour = slotHeight pixels
    const timeDeltaMinutes = deltaY / pixelsPerMinute
    const originalMinutes = timeStringToMinutes(originalStartTime)
    const newMinutes = originalMinutes + timeDeltaMinutes
    
    // Ensure we don't go below 00:00
    const clampedMinutes = Math.max(0, newMinutes)
    const snappedMinutes = snapToQuarterHour(clampedMinutes)
    
    return minutesToTimeString(snappedMinutes)
  }, [slotHeight, timeStringToMinutes, snapToQuarterHour, minutesToTimeString])

  // Start drag operation
  const startDrag = useCallback((event: any, mouseY: number) => {
    setDragState({
      isDragging: true,
      draggedEventId: event.id,
      initialMouseY: mouseY,
      newStartTime: event.startTime,
      originalEvent: event
    })
    originalEventRef.current = event

    // Add global event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - mouseY
      const newStartTime = calculateNewTime(deltaY, event.startTime)
      
      setDragState(prev => ({
        ...prev,
        newStartTime
      }))
    }

    const handleMouseUp = async (e: MouseEvent) => {
      const deltaY = e.clientY - mouseY
      const newStartTime = calculateNewTime(deltaY, event.startTime)
      
      // Calculate new end time preserving duration
      const startMinutes = timeStringToMinutes(event.startTime)
      const endMinutes = timeStringToMinutes(event.endTime)
      const duration = endMinutes - startMinutes
      const newStartMinutes = timeStringToMinutes(newStartTime)
      const newEndMinutes = newStartMinutes + duration
      const newEndTime = minutesToTimeString(newEndMinutes)

      // Remove global event listeners
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // Reset drag state
      setDragState({
        isDragging: false,
        draggedEventId: null,
        initialMouseY: 0,
        newStartTime: null,
        originalEvent: null
      })

      // Only update if the time actually changed
      if (newStartTime !== event.startTime) {
        try {
          const success = await onEventUpdate(event.id, newStartTime, newEndTime)
          if (!success) {
            onError('Failed to update event time. Please try again.')
          }
        } catch (error) {
          onError('Failed to update event time. Please try again.')
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [calculateNewTime, timeStringToMinutes, minutesToTimeString, onEventUpdate, onError])

  // Cancel drag operation
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedEventId: null,
      initialMouseY: 0,
      newStartTime: null,
      originalEvent: null
    })
  }, [])

  return {
    dragState,
    startDrag,
    cancelDrag
  }
} 