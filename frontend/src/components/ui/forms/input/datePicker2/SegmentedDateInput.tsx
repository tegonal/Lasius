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

import React, { useEffect, useRef, useState } from 'react'

type DateSegment = 'day' | 'month' | 'year'

type SegmentBounds = {
  day: { start: number; end: number }
  month: { start: number; end: number }
  year: { start: number; end: number }
}

export const SegmentedDateInput = () => {
  const [date, setDate] = useState<Date | null>(null)
  const [inputValue, setInputValue] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(true)
  const [selectedSegment, setSelectedSegment] = useState<DateSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const getSegmentBounds = (value: string): SegmentBounds | null => {
    const parts = value.split('.')
    if (parts.length !== 3) return null

    const dayEnd = parts[0].length
    const monthEnd = dayEnd + 1 + parts[1].length
    const yearEnd = monthEnd + 1 + parts[2].length

    return {
      day: { start: 0, end: dayEnd },
      month: { start: dayEnd + 1, end: monthEnd },
      year: { start: monthEnd + 1, end: yearEnd },
    }
  }

  const getSegmentFromPosition = (position: number, value: string): DateSegment | null => {
    const bounds = getSegmentBounds(value)
    if (!bounds) return null

    if (position <= bounds.day.end) return 'day'
    if (position <= bounds.month.end) return 'month'
    return 'year'
  }

  const parseDate = (value: string): Date | null => {
    const cleaned = value.replace(/[^\d.]/g, '')
    const parts = cleaned.split('.')

    if (parts.length !== 3) return null

    const [day, month, year] = parts
    const d = parseInt(day, 10)
    const m = parseInt(month, 10)
    const y = parseInt(year, 10)

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null
    if (d < 1 || d > 31) return null
    if (m < 1 || m > 12) return null
    if (y < 1900 || y > 2100) return null

    const dateObj = new Date(y, m - 1, d)

    if (dateObj.getDate() !== d || dateObj.getMonth() !== m - 1 || dateObj.getFullYear() !== y) {
      return null
    }

    return dateObj
  }

  const formatDate = (dateObj: Date | null): string => {
    if (!dateObj) return ''
    const d = dateObj.getDate().toString().padStart(2, '0')
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0')
    const y = dateObj.getFullYear()
    return `${d}.${m}.${y}`
  }

  const selectSegment = (segment: DateSegment): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds || !inputRef.current) return

    const segmentBounds = bounds[segment]
    if (!segmentBounds) return

    inputRef.current.focus()
    inputRef.current.setSelectionRange(segmentBounds.start, segmentBounds.end)
    setSelectedSegment(segment)
  }

  const handleClick = (_e: React.MouseEvent<HTMLInputElement>): void => {
    setTimeout(() => {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number' && inputValue) {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          selectSegment(segment)
        }
      }
    }, 0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    const prevValue = inputValue

    // Check if we're replacing a segment
    if (selectedSegment && inputRef.current) {
      const bounds = getSegmentBounds(prevValue)
      if (bounds) {
        const segmentBounds = bounds[selectedSegment]
        const selStart = inputRef.current.selectionStart
        const selEnd = inputRef.current.selectionEnd

        if (selStart === segmentBounds.start && selEnd === segmentBounds.end) {
          const parts = prevValue.split('.')
          const typedChar = value.slice(selStart, selStart + 1)

          if (/\d/.test(typedChar)) {
            if (selectedSegment === 'day') {
              parts[0] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'month') {
              parts[1] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'year') {
              // For year, just start with the typed digit
              parts[2] = typedChar
            }

            const newValue = parts.join('.')
            setInputValue(newValue)

            const parsed = parseDate(newValue)
            if (parsed) {
              setDate(parsed)
              setIsValid(true)
            } else {
              setIsValid(false)
            }

            setTimeout(() => {
              if (selectedSegment === 'day') selectSegment('month')
              else if (selectedSegment === 'month') selectSegment('year')
              // Stay in year for multi-digit input
            }, 0)

            return
          }
        }

        if (/^\d$/.test(value.slice(-1)) && value.length > prevValue.length) {
          const parts = prevValue.split('.')
          const newDigit = value.slice(-1)

          if (selectedSegment === 'day' && /^\d$/.test(parts[0])) {
            parts[0] = parts[0] + newDigit
            const newValue = parts.join('.')
            setInputValue(newValue)

            setTimeout(() => selectSegment('month'), 0)

            const parsed = parseDate(newValue)
            if (parsed) {
              setDate(parsed)
              setIsValid(true)
            } else {
              setIsValid(false)
            }
            return
          } else if (selectedSegment === 'month' && /^\d$/.test(parts[1])) {
            parts[1] = parts[1] + newDigit
            const newValue = parts.join('.')
            setInputValue(newValue)

            setTimeout(() => selectSegment('year'), 0)

            const parsed = parseDate(newValue)
            if (parsed) {
              setDate(parsed)
              setIsValid(true)
            } else {
              setIsValid(false)
            }
            return
          } else if (selectedSegment === 'year') {
            // For year, allow continued typing
            parts[2] = parts[2] + newDigit
            const newValue = parts.join('.')
            setInputValue(newValue)

            const parsed = parseDate(newValue)
            if (parsed) {
              setDate(parsed)
              setIsValid(true)
            } else {
              setIsValid(false)
            }
            return
          }
        }
      }
    }

    setInputValue(value)
    setSelectedSegment(null)

    if (value === '') {
      setDate(null)
      setIsValid(true)
      return
    }

    const parsed = parseDate(value)
    if (parsed) {
      setDate(parsed)
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds) return

    if (e.key === '.' || e.key === ',') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'day') {
          selectSegment('month')
        } else if (segment === 'month') {
          selectSegment('year')
        }
      }
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()

      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (!segment || !date) return

        const newDate = new Date(date)
        const increment = e.key === 'ArrowUp' ? 1 : -1

        if (segment === 'day') {
          newDate.setDate(newDate.getDate() + increment)
        } else if (segment === 'month') {
          newDate.setMonth(newDate.getMonth() + increment)
        } else if (segment === 'year') {
          newDate.setFullYear(newDate.getFullYear() + increment)
        }

        setDate(newDate)
        const formatted = formatDate(newDate)
        setInputValue(formatted)

        setTimeout(() => selectSegment(segment), 0)
      }
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'day') {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month') {
          e.preventDefault()
          selectSegment('year')
        }
      }
    }

    if (e.key === 'Tab' && e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'year') {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month') {
          e.preventDefault()
          selectSegment('day')
        }
      }
    }

    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'year' && position === bounds.year.start) {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month' && position === bounds.month.start) {
          e.preventDefault()
          selectSegment('day')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'day' && position === bounds.day.end) {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month' && position === bounds.month.end) {
          e.preventDefault()
          selectSegment('year')
        }
      }
    }
  }

  const handleBlur = (): void => {
    setSelectedSegment(null)

    if (date) {
      setInputValue(formatDate(date))
      setIsValid(true)
    } else if (inputValue) {
      const parsed = parseDate(inputValue)
      if (parsed) {
        setDate(parsed)
        setInputValue(formatDate(parsed))
        setIsValid(true)
      } else {
        setIsValid(false)
      }
    }
  }

  useEffect(() => {
    if (!inputValue && !date) {
      setInputValue('__.__.____')
    }
  }, [inputValue, date])

  const handleFocus = (): void => {
    if (inputValue === '__.__.____') {
      setInputValue('')
    } else if (inputValue) {
      setTimeout(() => selectSegment('day'), 0)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      placeholder="DD.MM.YYYY"
      className={`w-full rounded-lg border-2 px-4 py-3 font-mono text-lg transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
        !isValid ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{ letterSpacing: '0.1em' }}
    />
  )
}
