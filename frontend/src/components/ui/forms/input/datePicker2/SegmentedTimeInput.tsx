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

type TimeSegment = 'hour' | 'minute'

type SegmentBounds = {
  hour: { start: number; end: number }
  minute: { start: number; end: number }
}

type Time = {
  hours: number
  minutes: number
}

export const SegmentedTimeInput = () => {
  const [time, setTime] = useState<Time | null>(null)
  const [inputValue, setInputValue] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(true)
  const [selectedSegment, setSelectedSegment] = useState<TimeSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const getSegmentBounds = (value: string): SegmentBounds | null => {
    const parts = value.split(':')
    if (parts.length !== 2) return null

    const hourEnd = parts[0].length
    const minuteEnd = hourEnd + 1 + parts[1].length

    return {
      hour: { start: 0, end: hourEnd },
      minute: { start: hourEnd + 1, end: minuteEnd },
    }
  }

  const getSegmentFromPosition = (position: number, value: string): TimeSegment | null => {
    const bounds = getSegmentBounds(value)
    if (!bounds) return null

    if (position <= bounds.hour.end) return 'hour'
    return 'minute'
  }

  const parseTime = (value: string): Time | null => {
    const cleaned = value.replace(/[^\d:]/g, '')
    const parts = cleaned.split(':')

    if (parts.length !== 2) return null

    const [hour, minute] = parts
    const h = parseInt(hour, 10)
    const m = parseInt(minute, 10)

    if (isNaN(h) || isNaN(m)) return null
    if (h < 0 || h > 23) return null
    if (m < 0 || m > 59) return null

    return { hours: h, minutes: m }
  }

  const formatTime = (timeObj: Time | null): string => {
    if (!timeObj) return ''
    const h = timeObj.hours.toString().padStart(2, '0')
    const m = timeObj.minutes.toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const selectSegment = (segment: TimeSegment): void => {
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
          const parts = prevValue.split(':')
          const typedChar = value.slice(selStart, selStart + 1)

          if (/\d/.test(typedChar)) {
            if (selectedSegment === 'hour') {
              parts[0] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'minute') {
              parts[1] = typedChar.padStart(2, '0')
            }

            const newValue = parts.join(':')
            setInputValue(newValue)

            const parsed = parseTime(newValue)
            if (parsed) {
              setTime(parsed)
              setIsValid(true)
            } else {
              setIsValid(false)
            }

            setTimeout(() => {
              if (selectedSegment === 'hour') selectSegment('minute')
            }, 0)

            return
          }
        }

        if (/^\d$/.test(value.slice(-1)) && value.length > prevValue.length) {
          const parts = prevValue.split(':')
          const newDigit = value.slice(-1)

          if (selectedSegment === 'hour' && /^\d$/.test(parts[0])) {
            parts[0] = parts[0] + newDigit
            const newValue = parts.join(':')
            setInputValue(newValue)

            setTimeout(() => selectSegment('minute'), 0)

            const parsed = parseTime(newValue)
            if (parsed) {
              setTime(parsed)
              setIsValid(true)
            } else {
              setIsValid(false)
            }
            return
          } else if (selectedSegment === 'minute' && /^\d$/.test(parts[1])) {
            parts[1] = parts[1] + newDigit
            const newValue = parts.join(':')
            setInputValue(newValue)

            const parsed = parseTime(newValue)
            if (parsed) {
              setTime(parsed)
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
      setTime(null)
      setIsValid(true)
      return
    }

    const parsed = parseTime(value)
    if (parsed) {
      setTime(parsed)
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds) return

    if (e.key === ':') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'hour') {
          selectSegment('minute')
        }
      }
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()

      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (!segment || !time) return

        const newTime = { ...time }
        const increment = e.key === 'ArrowUp' ? 1 : -1

        if (segment === 'hour') {
          newTime.hours = (newTime.hours + increment + 24) % 24
        } else if (segment === 'minute') {
          newTime.minutes = (newTime.minutes + increment + 60) % 60
        }

        setTime(newTime)
        const formatted = formatTime(newTime)
        setInputValue(formatted)

        setTimeout(() => selectSegment(segment), 0)
      }
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'hour') {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }

    if (e.key === 'Tab' && e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'minute') {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'minute' && position === bounds.minute.start) {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)

        if (segment === 'hour' && position === bounds.hour.end) {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }
  }

  const handleBlur = (): void => {
    setSelectedSegment(null)

    if (time) {
      setInputValue(formatTime(time))
      setIsValid(true)
    } else if (inputValue) {
      const parsed = parseTime(inputValue)
      if (parsed) {
        setTime(parsed)
        setInputValue(formatTime(parsed))
        setIsValid(true)
      } else {
        setIsValid(false)
      }
    }
  }

  useEffect(() => {
    if (!inputValue && !time) {
      setInputValue('__:__')
    }
  }, [inputValue, time])

  const handleFocus = (): void => {
    if (inputValue === '__:__') {
      setInputValue('')
    } else if (inputValue) {
      setTimeout(() => selectSegment('hour'), 0)
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
      placeholder="HH:MM"
      className={`w-full rounded-lg border-2 px-4 py-3 font-mono text-lg transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
        !isValid ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{ letterSpacing: '0.1em' }}
    />
  )
}
