interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: NewEventState) => void;
  isEditMode: boolean;
  initialEventData: Partial<NewEventState>;
  user: { name: string } | null;
  googleCalendars: { id: string; summary: string }[];
  selectedCalendarForNewEvents: string;
  setSelectedCalendarForNewEvents: (value: string) => void;
  timeOptions: { value: string; label: string }[];
  monthNames: string[];
  sampleLocations: string[];
  addRecentColor: (color: string) => void;
  recentColors: string[];
  newEvent: NewEventState;
  setNewEvent: React.Dispatch<React.SetStateAction<NewEventState>>;
  handleAllDayToggle: () => void;
  handleMultiDayToggle: () => void;
  handleRecurringToggle: () => void;
  handleDateSelect: (day: number, month: number, year: number) => void;
  handleEndDateSelect: (day: number, month: number, year: number) => void;
  handleTimeChange: (time: string, isStart: boolean) => void;
  handleLocationChange: (value: string) => void;
  handleLocationSelect: (location: string) => void;
  showDatePicker: boolean;
  setShowDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  showEndDatePicker: boolean;
  setShowEndDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  showStartTimeDropdown: boolean;
  setShowStartTimeDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showEndTimeDropdown: boolean;
  setShowEndTimeDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  startTimeDropdownRef: React.RefObject<HTMLDivElement>;
  endTimeDropdownRef: React.RefObject<HTMLDivElement>;
  startTimeDropdownMenuRef: React.RefObject<HTMLUListElement>;
  endTimeDropdownMenuRef: React.RefObject<HTMLUListElement>;
  showLocationSuggestions: boolean;
  locationSuggestions: string[];
  titleError: string;
  setTitleError: React.Dispatch<React.SetStateAction<string>>;
  triedSubmit: boolean;
}

export const EventModal = ({
  isOpen,
  onClose,
  onSave,
  isEditMode,
  initialEventData,
  user,
  googleCalendars,
  selectedCalendarForNewEvents,
  setSelectedCalendarForNewEvents,
  timeOptions,
  monthNames,
  sampleLocations,
  addRecentColor,
  recentColors,
  newEvent,
  setNewEvent,
  handleAllDayToggle,
  handleMultiDayToggle,
  handleRecurringToggle,
  handleDateSelect,
  handleEndDateSelect,
  handleTimeChange,
  handleLocationChange,
  handleLocationSelect,
  showDatePicker,
  setShowDatePicker,
  showEndDatePicker,
  setShowEndDatePicker,
  showStartTimeDropdown,
  setShowStartTimeDropdown,
  showEndTimeDropdown,
  setShowEndTimeDropdown,
  startTimeDropdownRef,
  endTimeDropdownRef,
  startTimeDropdownMenuRef,
  endTimeDropdownMenuRef,
  showLocationSuggestions,
  locationSuggestions,
  titleError,
  setTitleError,
  triedSubmit,
}: EventModalProps) => {
{/* Create/Edit Event Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseCreateModal}
          >
            <div
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
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
                        Recurring
                      </span>
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

                  

                // ⬇️ THIS IS YOUR NEW, CLEAN CODE
                  {newEvent.isRecurring && (
                    <RecurrenceSettings
                      newEvent={newEvent}
                      setNewEvent={setNewEvent}
                    />
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
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 resize-none"
                      placeholder="Enter event description"
                    />
                  </div>

                  {/* Color Selection - More Compact */}
                  <div className="flex items-center gap-4">
                    <label className="text-white text-sm font-medium">Color:</label>
                    <div className="flex-1 max-w-xs">
                      <Collapsible
                        header={
                          <>
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-white/20"
                              style={{ backgroundColor: newEvent.exactColor || '#3B82F6' }}
                            />
                            <span className="text-white text-sm">Select Color</span>
                          </>
                        }
                      >
                        <AdvancedColorPicker
                          currentColor={newEvent.exactColor || '#3B82F6'} // Always pass hex color
                          onChange={(color) => {
                            // The color picker always returns hex colors
                            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                              // Find the matching Tailwind class for this hex color
                              const colorMap: { [key: string]: string } = {
                                '#3B82F6': 'bg-blue-600',
                                '#10B981': 'bg-green-600',
                                '#8B5CF6': 'bg-purple-600',
                                '#EF4444': 'bg-red-600',
                                '#F59E0B': 'bg-yellow-600',
                                '#EC4899': 'bg-pink-600',
                                '#06B6D4': 'bg-cyan-600',
                                '#84CC16': 'bg-lime-600',
                                '#F97316': 'bg-orange-600',
                                '#6366F1': 'bg-indigo-600',
                              };
                              const tailwindClass = colorMap[color] || 'bg-blue-600';
                              setNewEvent({ ...newEvent, color: tailwindClass, exactColor: color });
                            }
                          }}
                          onRecentColorAdd={addRecentColor}
                          recentColors={settings?.recentColors || []}
                        />
                      </Collapsible>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6" onClick={(e) => e.stopPropagation()}>
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
        

};
