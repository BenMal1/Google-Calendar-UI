"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleProps {
  header: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
}

export const Collapsible = ({ 
  header, 
  children, 
  defaultExpanded = false,
  className = ""
}: CollapsibleProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={`border border-white/20 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-white"
      >
        <div className="flex items-center gap-3">
          {header}
        </div>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 bg-white/5 border-t border-white/10">
          {children}
        </div>
      </div>
    </div>
  )
} 