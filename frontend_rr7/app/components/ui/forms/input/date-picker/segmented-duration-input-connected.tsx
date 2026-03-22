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
import { useRequiredFormContext } from '~/components/ui/forms/with-form-context'

import {
	createHandleClick,
	DURATION_SEGMENT_CONFIG,
	type DurationSegment,
	getSegmentBounds,
	getSegmentFromPosition,
	selectSegment as selectSegmentHelper,
} from './shared/core'
import {
	addMinutesToDate,
	calculateDurationMinutes,
	formatDuration,
	parseDuration,
} from './shared/duration-utils'
import {
	createInputChangeHandler,
	handleBackspaceDelete,
	handleEscapeKey,
	handleSeparatorKey,
	validateInputChar,
} from './shared/input'
import { SegmentedInputWrapper } from './shared/segmented-input-wrapper'

export function SegmentedDurationInputConnected({
	endFieldName,
	startFieldName,
}: {
	endFieldName: string
	startFieldName: string
}) {
	const { t } = useTranslation('common')
	const parentFormContext = useRequiredFormContext()
	const inputRef = useRef<HTMLInputElement>(null)
	const [selectedSegment, setSelectedSegment] =
		useState<DurationSegment | null>(null)
	const focusFromArrowRef = useRef<boolean>(false)
	const focusFromMouseRef = useRef<boolean>(false)
	const initialDurationRef = useRef<number>(0)
	const pendingCursorPosRef = useRef<null | number>(null)

	const config = DURATION_SEGMENT_CONFIG

	const startValue = parentFormContext.watch(startFieldName)
	const endValue = parentFormContext.watch(endFieldName)

	// Calculate duration
	const durationMinutes = calculateDurationMinutes(
		startValue ? new Date(startValue) : null,
		endValue ? new Date(endValue) : null,
	)
	const durationString = formatDuration(durationMinutes)

	const [inputValue, setInputValue] = useState<string>(durationString)

	// Store initial duration when component mounts or start/end change externally
	useEffect(() => {
		if (!inputRef.current?.matches(':focus')) {
			initialDurationRef.current = durationMinutes
		}
	}, [durationMinutes])

	// Sync with calculated duration
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

	// Select a segment using helper
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

	// Handle click using helper
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

	// Update end time based on duration change
	const updateEndTime = (newDurationMinutes: number) => {
		if (startValue && newDurationMinutes >= 0) {
			const startDate = new Date(startValue)
			const newEndDate = addMinutesToDate(startDate, newDurationMinutes)
			parentFormContext.setValue(endFieldName, newEndDate.toISOString(), {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}

	// Reset to initial duration
	const resetToInitial = () => {
		updateEndTime(initialDurationRef.current)
		setInputValue(formatDuration(initialDurationRef.current))
	}

	// Handle input change using shared utility
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
				updateEndTime(minutes)
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
					updateEndTime(newMinutes)
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

		// Arrow key navigation
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
		const currentStartValue = parentFormContext.getValues(startFieldName)
		const currentEndValue = parentFormContext.getValues(endFieldName)

		const currentDurationMinutes = calculateDurationMinutes(
			currentStartValue ? new Date(currentStartValue) : null,
			currentEndValue ? new Date(currentEndValue) : null,
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
			label={t('common.formats.durationFormat', {
				defaultValue: 'HH:MM',
			})}
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
				placeholder={t('common.formats.durationFormat', {
					defaultValue: 'HH:MM',
				})}
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
