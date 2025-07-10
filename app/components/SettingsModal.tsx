"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, ChevronDown, Link, Upload } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  timeZones: { value: string; label: string }[]
  selectedTimeZone: string
  setSelectedTimeZone: (value: string) => void
  compactness: number
  setCompactness: (value: number) => void
  backgroundOpacity: number
  setBackgroundOpacity: (value: number) => void
  backgroundBlur: number
  setBackgroundBlur: (value: number) => void
  allDayEventDisplay: string
  setAllDayEventDisplay: (value: string) => void
  showTimeline: boolean
  setShowTimeline: (value: boolean) => void
  backgroundImages: { id: string; name: string; url: string }[]
  backgroundImage: string
  setBackgroundImage: (id: string) => void
  customBackgroundUrl: string
  setCustomBackgroundUrl: (url: string) => void
  onCustomUrlSubmit: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const SettingsModal = ({
  isOpen,
  onClose,
  timeZones,
  selectedTimeZone,
  setSelectedTimeZone,
  compactness,
  setCompactness,
  backgroundOpacity,
  setBackgroundOpacity,
  backgroundBlur,
  setBackgroundBlur,
  allDayEventDisplay,
  setAllDayEventDisplay,
  showTimeline,
  setShowTimeline,
  backgroundImages,
  backgroundImage,
  setBackgroundImage,
  customBackgroundUrl,
  setCustomBackgroundUrl,
  onCustomUrlSubmit,
  onFileUpload,
}: SettingsModalProps) => {
  const [formattingSectionCollapsed, setFormattingSectionCollapsed] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
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
                        allDayEventDisplay === "full" ? "bg-blue-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      Full Details
                    </button>
                    <button
                      onClick={() => setAllDayEventDisplay("compact")}
                      className={`px-4 py-2 rounded-md text-sm transition-colors ${
                        allDayEventDisplay === "compact" ? "bg-blue-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
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
                      onClick={onCustomUrlSubmit}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                    >
                      <Link className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-xs font-medium mb-1">Upload Image</label>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
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
  )
}

