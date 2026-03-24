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
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'

import {
  getSegmentBounds,
  getSegmentFromPosition,
} from './date-picker/shared/core/segment-bounds'
import {
  DURATION_SEGMENT_CONFIG,
  type DurationSegment,
} from './date-picker/shared/core/segment-config'
import { selectSegment as selectSegmentHelper } from './date-picker/shared/core/segment-selection'
import {
  formatDuration,
  parseDuration,
} from './date-picker/shared/duration-utils'
import { createInputChangeHandler } from './date-picker/shared/input/input-change-handler'
import { validateInputChar } from './date-picker/shared/input/input-validation'
import {
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
} from './date-picker/shared/input/keyboard-handlers'
import { SegmentedInputWrapper } from './date-picker/shared/segmented-input-wrapper'

type DurationInputProps = {
  error?: boolean
  id?: string
  onChange: (milliseconds: number) => void
  value: number // value in milliseconds
}

/**
 * Interactive duration input component with HH:MM format and arrow controls.
 * Works with milliseconds internally but displays as hours:minutes.
 */
export const DurationInput = ({
  error,
  id,
  onChange,
  value,
}: DurationInputProps) => {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] =
    useState<DurationSegment | null>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const focusFromMouseRef = useRef<boolean>(false)
  const initialDurationRef = useRef<number>(0)
  const pendingCursorPosRef = useRef<null | number>(null)

  const config = DURATION_SEGMENT_CONFIG

  // Convert milliseconds to minutes for display
  const durationMinutes = Math.round(value / 60000)
  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)

  // Store initial duration when component mounts or value changes externally
  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      initialDurationRef.current = durationMinutes
    }
  }, [durationMinutes])

  // Sync with external value
  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      setInputValue(durationString)
    }
  }, [durationString])

  // Restore cursor position after inputValue changes
  React.useLayoutEffect(() => {
    if (
      pendingCursorPosRef.current !== null &&
      inputRef.current?.matches(':focus')
    ) {
      const pos = pendingCursorPosRef.current
      pendingCursorPosRef.current = null
      inputRef.current.setSelectionRange(pos, pos)
    }
  }, [inputValue])

  // Select a segment
  const selectSegment = (segment: DurationSegment): void => {
    selectSegmentHelper(
      segment,
      inputValue,
      config.delimiter,
      config.segments,
      inputRef,
      setSelectedSegment,
    )
  }

  // Handle mouse down to set flag before focus
  const handleMouseDown = () => {
    focusFromMouseRef.current = true
  }

  // Handle click
  const handleClick = () => {
    setTimeout(() => {
      const position = inputRef.current?.selectionStart
      if (
        typeof position === 'number' &&
        inputValue &&
        inputValue !== config.placeholder
      ) {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment) {
          selectSegment(segment)
        }
      }
    }, 0)
  }

  // Update duration
  const updateDuration = (newDurationMinutes: number) => {
    if (newDurationMinutes >= 0) {
      onChange(newDurationMinutes * 60000)
    }
  }

  // Reset to initial duration
  const resetToInitial = () => {
    updateDuration(initialDurationRef.current)
    setInputValue(formatDuration(initialDurationRef.current))
  }

  // Handle input change
  const handleInputChange = createInputChangeHandler({
    config,
    inputRef,
    inputValue,
    selectedSegment,
    selectSegmentFn: selectSegment,
    setCursorPosition: (pos) => {
      pendingCursorPosRef.current = pos
    },
    setInputValue,
    updateStore: (val: string) => {
      const minutes = parseDuration(val)
      if (minutes !== null) {
        updateDuration(minutes)
      }
    },
  })

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(
      inputValue,
      config.delimiter,
      config.segments,
    )
    if (!bounds) return

    // Block invalid characters
    if (!validateInputChar(e.key, config.allowedCharsPattern)) {
      e.preventDefault()
      return
    }

    // Escape key - reset to initial value
    if (handleEscapeKey(e, inputRef, resetToInitial)) {
      return
    }

    // Backspace/Delete handling
    if (
      handleBackspaceDelete(
        e,
        inputRef,
        inputValue,
        config.delimiter,
        config.segments,
        bounds,
        config.segmentPlaceholders,
        setInputValue,
        (val) => {
          const minutes = parseDuration(val)
          if (minutes !== null) {
            updateDuration(minutes)
          }
        },
        selectSegment,
      )
    ) {
      return
    }

    // Separator key to move to next segment
    if (
      handleSeparatorKey(
        e,
        config.separatorKeys,
        inputRef,
        inputValue,
        config.delimiter,
        config.segments,
        selectSegment,
      )
    ) {
      return
    }

    // Arrow keys for increment/decrement
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (!segment) return

        const baseIncrement = e.key === 'ArrowUp' ? 1 : -1
        let newMinutes = durationMinutes

        if (segment === 'hour') {
          newMinutes += baseIncrement * 60
        } else {
          newMinutes += baseIncrement * 5
        }

        if (newMinutes >= 0) {
          updateDuration(newMinutes)
          const formatted = formatDuration(newMinutes)
          setInputValue(formatted)
          setTimeout(() => selectSegment(segment), 0)
        }
      }
    }

    // Tab navigation
    if (e.key === 'Tab' && !e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'hour') {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }

    if (e.key === 'Tab' && e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'minute') {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    // Arrow key navigation between segments
    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (
          segment === 'minute' &&
          bounds['minute'] &&
          position === bounds['minute'].start
        ) {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (
          segment === 'hour' &&
          bounds['hour'] &&
          position === bounds['hour'].end
        ) {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }
  }

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
      return
    }
    setSelectedSegment(null)

    const minutes = parseDuration(inputValue)
    if (minutes === null) {
      setInputValue(durationString)
    } else {
      setInputValue(formatDuration(minutes))
    }
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === config.placeholder) {
      setInputValue('')
    } else if (
      inputValue &&
      !focusFromArrowRef.current &&
      !focusFromMouseRef.current
    ) {
      setTimeout(() => selectSegment('hour'), 0)
    }
    focusFromArrowRef.current = false
    focusFromMouseRef.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'down' | 'up') => {
    let targetSegment: DurationSegment
    let incrementAmount: number

    if (selectedSegment === 'hour') {
      targetSegment = 'hour'
      incrementAmount = 60
    } else {
      targetSegment = 'minute'
      incrementAmount = 5
    }

    const baseIncrement = direction === 'up' ? 1 : -1
    const newMinutes = durationMinutes + baseIncrement * incrementAmount

    if (newMinutes >= 0) {
      updateDuration(newMinutes)
      const formatted = formatDuration(newMinutes)
      setInputValue(formatted)

      focusFromArrowRef.current = true

      setTimeout(() => {
        if (inputRef.current && !inputRef.current.matches(':focus')) {
          inputRef.current.focus()
        }
        selectSegment(targetSegment)
      }, 10)
    }
  }

  return (
    <SegmentedInputWrapper
      hasSelection={!!selectedSegment}
      label={t('formats.durationFormat', { defaultValue: 'HH:MM' })}
      onArrowClick={handleArrowClick}
    >
      <Input
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${error ? 'text-error' : ''}`}
        fullWidth={false}
        id={id}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        placeholder={t('formats.durationFormat', {
          defaultValue: 'HH:MM',
        })}
        ref={inputRef}
        size="md"
        style={{ fontSize: '0.95rem', width: 'calc(5ch + 1.6rem)' }}
        type="text"
        value={inputValue}
        variant={error ? 'error' : 'default'}
      />
    </SegmentedInputWrapper>
  )
}
