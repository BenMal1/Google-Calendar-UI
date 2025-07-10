"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { NewEventState } from "./CreateEventModal"

// Helper functions moved from the parent component
const getFrequencySingular = (frequency: string): string => {
  switch (frequency) {
    case "daily": return "day"
    case "weekly": return "week"
    case "monthly": return "month"
    case "yearly": return "year"
    default: return frequency
  }
}

const generateDatePickerDays = (month: number, year: number): (number | null)[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOffset = new Date(year, month, 1).getDay()
  return Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1,
  )
}

interface RecurrenceSettingsProps {
  newEvent: NewEventState
  setNewEvent: (value: React.SetStateAction<NewEventState>) => void
  monthNames: string[]
}

export const RecurrenceSettings = ({ newEvent, setNewEvent, monthNames }: RecurrenceSettingsProps) => {
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false)

  const handleRecurrenceEndDateSelect = (day: number, month: number, year: number) => {
    setNewEvent({
      ...newEvent,
      recurrence: { ...newEvent.recurrence, endDate: new Date(year, month, day) },
    })
    setShowRecurrenceEndDatePicker(false)
  }

  return (
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
                Every {num} {getFrequencySingular(newEvent.recurrence.frequency)}
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
                            recurrence: { ...newEvent.recurrence, endDate: newDate },
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
                            recurrence: { ...newEvent.recurrence, endDate: newDate },
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
                      <div key={i} className="text-xs text-white/70 font-medium py-1">{day}</div>
                    ))}
                    {generateDatePickerDays(
                      newEvent.recurrence.endDate?.getMonth() || new Date().getMonth(),
                      newEvent.recurrence.endDate?.getFullYear() || new Date().getFullYear(),
                    ).map((day, i) => (
                      <button
                        key={i}
                        onClick={() => day && handleRecurrenceEndDateSelect(day, newEvent.recurrence.endDate?.getMonth() || new Date().getMonth(), newEvent.recurrence.endDate?.getFullYear() || new Date().getFullYear())}
                        className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${day === newEvent.recurrence.endDate?.getDate() ? "bg-blue-500 text-white font-bold" : "text-white hover:bg-white/20"} ${!day ? "invisible" : ""}`}
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
  )
}