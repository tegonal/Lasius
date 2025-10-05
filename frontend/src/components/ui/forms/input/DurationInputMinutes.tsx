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

import { Input } from 'components/primitives/inputs/Input'
import React, { useEffect, useState } from 'react'

interface DurationInputMinutesProps {
  value: number // value in milliseconds
  onChange: (milliseconds: number) => void
  id?: string
  placeholder?: string
  error?: boolean
}

// Convert milliseconds to minutes
const msToMinutes = (ms: number): number => Math.round(ms / 60000)

// Convert minutes to milliseconds
const minutesToMs = (minutes: number): number => minutes * 60000

// Format minutes as HH:MM
const formatMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// Parse HH:MM format to total minutes
const parseHHMM = (value: string): number | null => {
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{1,3}):(\d{2})$/)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)

  if (minutes >= 60) return null

  return hours * 60 + minutes
}

export const DurationInputMinutes: React.FC<DurationInputMinutesProps> = ({
  value,
  onChange,
  id,
  placeholder = '00:05',
  error = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(() => formatMinutes(msToMinutes(value)))

  // Update input when external value changes
  useEffect(() => {
    setInputValue(formatMinutes(msToMinutes(value)))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleBlur = () => {
    const minutes = parseHHMM(inputValue)

    if (minutes !== null && minutes > 0) {
      const ms = minutesToMs(minutes)
      onChange(ms)
      setInputValue(formatMinutes(minutes))
    } else {
      // Reset to current value if invalid
      setInputValue(formatMinutes(msToMinutes(value)))
    }
  }

  return (
    <Input
      id={id}
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      variant={error ? 'error' : 'default'}
      className="font-mono"
    />
  )
}
