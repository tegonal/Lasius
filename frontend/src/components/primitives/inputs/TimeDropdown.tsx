/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { cn } from 'lib/utils/cn'
import { ChevronDown, ChevronLeft, Clock } from 'lucide-react'
import React, { useState } from 'react'

type Props = {
  value: number // decimal hours
  onChange: (hours: number) => void
  disabled?: boolean
  isWeekend?: boolean
}

const PRESET_HOURS = [
  { label: 'Not set', value: 0 },
  { label: '2 hours', value: 2 },
  { label: '4 hours', value: 4 },
  { label: '6 hours', value: 6 },
  { label: '8 hours', value: 8 },
]

const generateTimeOptions = () => {
  const options = []
  for (let h = 0; h <= 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      const decimal = h + m / 60
      const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      options.push({ label, value: decimal })
    }
  }
  return options
}

export const TimeDropdown: React.FC<Props> = ({ value, onChange, disabled, isWeekend }) => {
  const [showCustom, setShowCustom] = useState(false)
  const timeOptions = generateTimeOptions()

  const formatHours = (decimal: number) => {
    if (decimal === 0) return '—'
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const currentDisplay = formatHours(value)

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn(
          'group hover:bg-base-300 flex items-center justify-between gap-1 px-2 py-1',
          isWeekend && 'opacity-60',
          value === 0 && 'text-base-content/50',
        )}>
        <span className="text-sm">{currentDisplay}</span>
        <LucideIcon icon={ChevronDown} className="opacity-50 group-hover:opacity-100" size={12} />
      </MenuButton>

      <MenuItems className="bg-base-100 border-base-300 absolute left-0 z-[9999] mt-2 max-h-80 w-36 overflow-y-auto rounded-lg border shadow-lg">
        <div className="p-1">
          {!showCustom ? (
            <>
              {/* Preset options */}
              <div className="border-base-300 mb-1 border-b pb-1">
                {PRESET_HOURS.map((preset) => (
                  <MenuItem key={preset.value}>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          onChange(preset.value)
                        }}
                        className={cn(
                          'flex w-full items-center rounded px-2 py-1.5 text-left text-sm',
                          active && 'bg-base-200',
                          value === preset.value && 'bg-primary/10 font-medium',
                        )}>
                        {preset.label}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </div>

              {/* Custom button */}
              <MenuItem>
                {({ active }) => (
                  <button
                    onClick={() => setShowCustom(true)}
                    className={cn(
                      'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm',
                      active && 'bg-base-200',
                      showCustom && 'bg-primary/10',
                    )}>
                    <span>Custom time...</span>
                    <LucideIcon icon={Clock} size={12} />
                  </button>
                )}
              </MenuItem>
            </>
          ) : (
            <>
              {/* Back button */}
              <div className="border-base-300 mb-1 border-b pb-1">
                <button
                  onClick={() => setShowCustom(false)}
                  className="hover:bg-base-200 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm">
                  <LucideIcon icon={ChevronLeft} size={12} />
                  <span>Back to presets</span>
                </button>
              </div>

              {/* Custom time options */}
              <div className="max-h-60 overflow-y-auto">
                {timeOptions.map((option) => (
                  <MenuItem key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          onChange(option.value)
                          setShowCustom(false)
                        }}
                        className={cn(
                          'flex w-full items-center rounded px-2 py-1 text-left text-sm',
                          active && 'bg-base-200',
                          value === option.value && 'bg-primary/10 font-medium',
                        )}>
                        {option.label}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </div>
            </>
          )}
        </div>
      </MenuItems>
    </Menu>
  )
}
