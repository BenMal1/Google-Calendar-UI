"use client"

import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

interface AdvancedColorPickerProps {
  currentColor: string
  onChange: (color: string) => void
  onRecentColorAdd?: (color: string) => void
  recentColors?: string[]
}

// Standard colors array
const standardColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Yellow
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
]

export const AdvancedColorPicker = ({ 
  currentColor, 
  onChange, 
  onRecentColorAdd,
  recentColors = [] 
}: AdvancedColorPickerProps) => {
  const [showColorWheel, setShowColorWheel] = useState(false)
  const [customColor, setCustomColor] = useState(currentColor)

  // Update custom color when current color changes
  useEffect(() => {
    setCustomColor(currentColor)
  }, [currentColor])

  const handleColorSelect = (color: string) => {
    onChange(color)
    if (onRecentColorAdd) {
      onRecentColorAdd(color)
    }
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
  }

  const handleCustomColorConfirm = () => {
    handleColorSelect(customColor)
    setShowColorWheel(false)
  }

  const handleCustomColorCancel = () => {
    setCustomColor(currentColor)
    setShowColorWheel(false)
  }

  return (
    <div className="space-y-4">
      {/* Standard Colors */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">Standard Colors</label>
        <div className="grid grid-cols-5 gap-2">
          {standardColors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                currentColor === color ? 'border-white shadow-lg' : 'border-white/20 hover:border-white/40'
              }`}
              style={{ backgroundColor: color }}
              title={`Color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">Custom Color</label>
        <div className="space-y-3">
          {/* Color Preview and Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowColorWheel(!showColorWheel)}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                showColorWheel ? 'border-white shadow-lg' : 'border-white/20 hover:border-white/40'
              }`}
              style={{ backgroundColor: customColor }}
              title="Click to open color picker"
            />
            <button
              onClick={() => setShowColorWheel(!showColorWheel)}
              className="text-white text-sm hover:text-white/80 transition-colors"
            >
              {showColorWheel ? 'Close Color Picker' : 'Open Color Picker'}
            </button>
          </div>

          {/* Color Wheel */}
          {showColorWheel && (
            <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <HexColorPicker
                color={customColor}
                onChange={handleCustomColorChange}
                className="w-full max-w-[200px]"
              />
              
              {/* Color Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#000000"
                />
                <button
                  onClick={handleCustomColorConfirm}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleCustomColorCancel}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recently Used Colors */}
      {recentColors.length > 0 && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">Recently Used</label>
          <div className="grid grid-cols-8 gap-2">
            {recentColors.slice(0, 8).map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => handleColorSelect(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                  currentColor === color ? 'border-white shadow-lg' : 'border-white/20 hover:border-white/40'
                }`}
                style={{ backgroundColor: color }}
                title={`Recently used: ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 