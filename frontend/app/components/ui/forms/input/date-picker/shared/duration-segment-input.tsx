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

import { DURATION_SEGMENT_CONFIG, type DurationSegment } from './core/segment-config'
import { createHandleClick, selectSegment as selectSegmentHelper } from './core/segment-selection'
import { formatDuration, parseDuration } from './duration-utilities'
import { createInputChangeHandler } from './input/input-change-handler'
import { handleSegmentKeyDown } from './input/segment-key-down'
import { SegmentedInputWrapper } from './segmented-input-wrapper'
import { useRestoreCursorPosition } from './use-restore-cursor-position'

type DurationSegmentInputProperties = {
  durationMinutes: number
  id?: string
  isInvalid: boolean
  // Receives only a duration of 0 or more minutes.
  onDurationChange: (minutes: number) => void
}

/**
 * HH:MM duration input with segment selection, keyboard navigation and arrow controls.
 * The caller converts the minutes to its own value format.
 */
export const DurationSegmentInput = ({
  durationMinutes,
  id,
  isInvalid,
  onDurationChange,
}: DurationSegmentInputProperties) => {
  const { t } = useTranslation('common')
  const inputReference = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] = useState<DurationSegment | null>(null)
  const focusFromArrowReference = useRef<boolean>(false)
  const focusFromMouseReference = useRef<boolean>(false)
  const initialDurationReference = useRef<number>(0)

  const config = DURATION_SEGMENT_CONFIG

  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)
  const setCursorPosition = useRestoreCursorPosition(inputReference, inputValue)

  // Store initial duration when component mounts or value changes externally
  useEffect(() => {
    if (!inputReference.current?.matches(':focus')) {
      initialDurationReference.current = durationMinutes
    }
  }, [durationMinutes])

  // Sync with external value
  useEffect(() => {
    if (!inputReference.current?.matches(':focus')) {
      setInputValue(durationString)
    }
  }, [durationString])

  const selectSegment = (segment: DurationSegment): void => {
    selectSegmentHelper(
      segment,
      inputValue,
      config.delimiter,
      config.segments,
      inputReference,
      setSelectedSegment,
    )
  }

  // Handle mouse down to set flag before focus
  const handleMouseDown = () => {
    focusFromMouseReference.current = true
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    createHandleClick(
      inputReference,
      inputValue,
      config.placeholder,
      config.delimiter,
      config.segments,
      selectSegment,
    )(event)
  }

  const updateDuration = (newDurationMinutes: number) => {
    if (newDurationMinutes >= 0) {
      onDurationChange(newDurationMinutes)
    }
  }

  const updateDurationFromString = (value: string) => {
    const minutes = parseDuration(value)
    if (minutes !== null) {
      updateDuration(minutes)
    }
  }

  const resetToInitial = () => {
    updateDuration(initialDurationReference.current)
    setInputValue(formatDuration(initialDurationReference.current))
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    createInputChangeHandler({
      config,
      inputRef: inputReference,
      inputValue,
      selectedSegment,
      selectSegmentFn: selectSegment,
      setCursorPosition,
      setInputValue,
      updateStore: updateDurationFromString,
    })(event)
  }

  const stepSegment = (segment: DurationSegment | null, direction: -1 | 1): void => {
    if (!segment) return
    const newMinutes = durationMinutes + direction * (segment === 'hour' ? 60 : 5)
    if (newMinutes < 0) return
    updateDuration(newMinutes)
    setInputValue(formatDuration(newMinutes))
    setTimeout(() => selectSegment(segment), 0)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    handleSegmentKeyDown(event, {
      config,
      inputRef: inputReference,
      inputValue,
      resetToInitial,
      selectSegment,
      setInputValue,
      stepSegment,
      updateFromString: updateDurationFromString,
    })
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    const relatedTarget = event.relatedTarget as HTMLElement
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
    } else if (inputValue && !focusFromArrowReference.current && !focusFromMouseReference.current) {
      setTimeout(() => selectSegment('hour'), 0)
    }
    focusFromArrowReference.current = false
    focusFromMouseReference.current = false
  }

  const handleArrowClick = (direction: 'down' | 'up') => {
    const targetSegment: DurationSegment = selectedSegment === 'hour' ? 'hour' : 'minute'
    const incrementAmount = targetSegment === 'hour' ? 60 : 5
    const baseIncrement = direction === 'up' ? 1 : -1
    const newMinutes = durationMinutes + baseIncrement * incrementAmount

    if (newMinutes >= 0) {
      updateDuration(newMinutes)
      setInputValue(formatDuration(newMinutes))

      focusFromArrowReference.current = true

      setTimeout(() => {
        if (inputReference.current && !inputReference.current.matches(':focus')) {
          inputReference.current.focus()
        }
        selectSegment(targetSegment)
      }, 10)
    }
  }

  return (
    <SegmentedInputWrapper
      hasSelection={!!selectedSegment}
      label={t('formats.durationFormat', 'HH:MM')}
      onArrowClick={handleArrowClick}>
      <Input
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${isInvalid ? 'text-error' : ''}`}
        fullWidth={false}
        id={id}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        placeholder={t('formats.durationFormat', 'HH:MM')}
        ref={inputReference}
        size="md"
        style={{ fontSize: '0.95rem', width: 'calc(5ch + 1.6rem)' }}
        type="text"
        value={inputValue}
        variant={isInvalid ? 'error' : 'default'}
      />
    </SegmentedInputWrapper>
  )
}
