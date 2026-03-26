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

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { formatISOLocale } from '~/lib/utils/dates'

import {
  getSegmentBounds,
  getSegmentFromPosition,
} from './shared/core/segment-bounds'
import {
  DURATION_SEGMENT_CONFIG,
  type DurationSegment,
} from './shared/core/segment-config'
import {
  createHandleClick,
  selectSegment as selectSegmentHelper,
} from './shared/core/segment-selection'
import {
  addMinutesToDate,
  calculateDurationMinutes,
  formatDuration,
  parseDuration,
} from './shared/duration-utils'
import { createInputChangeHandler } from './shared/input/input-change-handler'
import { validateInputChar } from './shared/input/input-validation'
import {
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
} from './shared/input/keyboard-handlers'
import { SegmentedInputWrapper } from './shared/segmented-input-wrapper'
import { useRestoreCursorPosition } from './shared/use-restore-cursor-position'

export type SegmentedDurationInputConnectedProps = {
  endValue: string
  onEndChange: (isoString: string) => void
  startValue: string
}

export const SegmentedDurationInputConnected = ({
  endValue,
  onEndChange,
  startValue,
}: SegmentedDurationInputConnectedProps) => {
  return (
    <DurationInputCore
      endValue={endValue}
      getStartEndValues={() => ({ end: endValue, start: startValue })}
      onEndChange={onEndChange}
      startValue={startValue}
    />
  )
}

/** Shared core logic — receives reactive values and callbacks */
const DurationInputCore = ({
  endValue,
  getStartEndValues,
  onEndChange,
  startValue,
}: {
  endValue: string
  getStartEndValues: () => { end: string; start: string }
  onEndChange: (isoString: string) => void
  startValue: string
}) => {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] =
    useState<DurationSegment | null>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const focusFromMouseRef = useRef<boolean>(false)
  const initialDurationRef = useRef<number>(0)

  const config = DURATION_SEGMENT_CONFIG

  const durationMinutes = calculateDurationMinutes(
    startValue ? new Date(startValue) : null,
    endValue ? new Date(endValue) : null,
  )
  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)
  const setCursorPosition = useRestoreCursorPosition(inputRef, inputValue)

  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      initialDurationRef.current = durationMinutes
    }
  }, [durationMinutes])

  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      setInputValue(durationString)
    }
  }, [durationString])

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

  const handleMouseDown = () => {
    focusFromMouseRef.current = true
  }

  const handleClick = createHandleClick(
    inputRef,
    inputValue,
    config.placeholder,
    config.delimiter,
    config.segments,
    (segment) => {
      selectSegment(segment)
    },
  )

  const updateEndTime = (newDurationMinutes: number) => {
    if (startValue && newDurationMinutes >= 0) {
      const startDate = new Date(startValue)
      const newEndDate = addMinutesToDate(startDate, newDurationMinutes)
      onEndChange(formatISOLocale(newEndDate))
    }
  }

  const resetToInitial = () => {
    updateEndTime(initialDurationRef.current)
    setInputValue(formatDuration(initialDurationRef.current))
  }

  const handleInputChange = createInputChangeHandler({
    config,
    inputRef,
    inputValue,
    selectedSegment,
    selectSegmentFn: selectSegment,
    setCursorPosition,
    setInputValue,
    updateStore: (val: string) => {
      const minutes = parseDuration(val)
      if (minutes !== null) {
        updateEndTime(minutes)
      }
    },
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(
      inputValue,
      config.delimiter,
      config.segments,
    )
    if (!bounds) return

    if (!validateInputChar(e.key, config.allowedCharsPattern)) {
      e.preventDefault()
      return
    }

    if (handleEscapeKey(e, inputRef, resetToInitial)) {
      return
    }

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
            updateEndTime(minutes)
          }
        },
        selectSegment,
      )
    ) {
      return
    }

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

        newMinutes +=
          segment === 'hour' ? baseIncrement * 60 : baseIncrement * 5

        if (newMinutes >= 0) {
          updateEndTime(newMinutes)
          const formatted = formatDuration(newMinutes)
          setInputValue(formatted)
          setTimeout(() => selectSegment(segment), 0)
        }
      }
    }

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

    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'minute' && position === bounds.minute.start) {
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
        if (segment === 'hour' && position === bounds.hour.end) {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }
  }

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

  const handleArrowClick = (direction: 'down' | 'up') => {
    const { end, start } = getStartEndValues()

    const currentDurationMinutes = calculateDurationMinutes(
      start ? new Date(start) : null,
      end ? new Date(end) : null,
    )

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
    const newMinutes = currentDurationMinutes + baseIncrement * incrementAmount

    if (newMinutes >= 0) {
      updateEndTime(newMinutes)
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

  const isInvalid = durationMinutes < 0

  return (
    <SegmentedInputWrapper
      hasSelection={!!selectedSegment}
      label={t('formats.durationFormat', 'HH:MM')}
      onArrowClick={handleArrowClick}
    >
      <Input
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${isInvalid ? 'text-error' : ''}`}
        fullWidth={false}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        placeholder={t('formats.durationFormat', 'HH:MM')}
        ref={inputRef}
        size="md"
        style={{ fontSize: '0.95rem', width: 'calc(5ch + 1.6rem)' }}
        type="text"
        value={inputValue}
        variant={isInvalid ? 'error' : 'default'}
      />
    </SegmentedInputWrapper>
  )
}
