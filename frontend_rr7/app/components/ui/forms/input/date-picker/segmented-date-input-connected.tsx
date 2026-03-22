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

import React, { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'

import {
	createHandleClick,
	DATE_SEGMENT_CONFIG,
	type DateSegment,
	getSegmentBounds,
	getSegmentFromPosition,
	selectSegment as selectSegmentHelper,
} from './shared/core'
import { formatDate } from './shared/date-time-helpers'
import {
	createInputChangeHandler,
	handleBackspaceDelete,
	handleEscapeKey,
	handleSeparatorKey,
	validateInputChar,
} from './shared/input'
import { SegmentedInputWrapper } from './shared/segmented-input-wrapper'
import {
	DatePickerStoreContext,
	useDatePickerStore,
} from './store/use-date-picker-store'

export const SegmentedDateInputConnected = ({
	afterSlot,
}: {
	afterSlot?: React.ReactNode
}) => {
	const { t } = useTranslation('common')
	const store = useContext(DatePickerStoreContext)
	const {
		incrementDays,
		incrementMonths,
		incrementYears,
		resetToInitial,
		setDateFromString,
		value,
	} = useDatePickerStore()
	const [inputValue, setInputValue] = useState<string>(value.dateString)
	const [selectedSegment, setSelectedSegment] = useState<DateSegment | null>(
		null,
	)
	const inputRef = useRef<HTMLInputElement>(null)
	const focusFromMouseRef = useRef<boolean>(false)
	const pendingCursorPosRef = useRef<null | number>(null)

	const config = DATE_SEGMENT_CONFIG

	// Sync with store
	useEffect(() => {
		if (
			value.dateString !== inputValue &&
			!inputRef.current?.matches(':focus')
		) {
			setInputValue(value.dateString || config.placeholder)
		}
	}, [value.dateString, inputValue, config.placeholder])

	// Restore cursor position after inputValue changes (runs synchronously before paint)
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
	const selectSegment = (segment: DateSegment): void => {
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

	const handleClick = createHandleClick(
		inputRef,
		inputValue,
		config.placeholder,
		config.delimiter,
		config.segments,
		selectSegment,
	)

	// Handle input change with generic handler
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
		updateStore: setDateFromString,
	})

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		const bounds = getSegmentBounds(
			inputValue,
			config.delimiter,
			config.segments,
		)
		if (!bounds) return

		// Block invalid characters to prevent selection loss
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
				setDateFromString,
				selectSegment,
			)
		) {
			return
		}

		// Period/Dot key to move to next segment
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
			if (typeof position === 'number' && value.date) {
				const segment = getSegmentFromPosition(
					position,
					inputValue,
					config.delimiter,
					config.segments,
				)
				if (!segment) return

				const increment = e.key === 'ArrowUp' ? 1 : -1

				if (segment === 'day') {
					incrementDays(increment)
				} else if (segment === 'month') {
					incrementMonths(increment)
				} else if (segment === 'year') {
					incrementYears(increment)
				}

				// Update local input value immediately by reading fresh value from store
				if (store) {
					const updatedValue = store.getState().value
					setInputValue(updatedValue.dateString)
				}

				setTimeout(() => selectSegment(segment), 0)
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
				const segment = getSegmentFromPosition(
					position,
					inputValue,
					config.delimiter,
					config.segments,
				)
				if (segment === 'year') {
					e.preventDefault()
					selectSegment('month')
				} else if (segment === 'month') {
					e.preventDefault()
					selectSegment('day')
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
				const segment = getSegmentFromPosition(
					position,
					inputValue,
					config.delimiter,
					config.segments,
				)
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

	// Format on blur
	const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
		// Don't clear selection if clicking on arrow buttons (they have tabIndex=-1)
		const relatedTarget = e.relatedTarget as HTMLElement
		if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
			return
		}
		setSelectedSegment(null)

		// Ensure store is updated with current input value before formatting
		if (inputValue && inputValue !== value.dateString) {
			setDateFromString(inputValue)
		}

		// Sync display with store's formatted value (wait for next tick to ensure store updated)
		setTimeout(() => {
			if (value.date && value.isValid) {
				setInputValue(formatDate(value.date))
			} else {
				// If invalid or partial, show the store's dateString or placeholder
				setInputValue(value.dateString || config.placeholder)
			}
		}, 0)
	}

	// Handle focus
	const handleFocus = (): void => {
		if (inputValue === config.placeholder) {
			setInputValue('')
		} else if (inputValue && !focusFromMouseRef.current) {
			// Only auto-select first segment if focus came from keyboard (tab), not from mouse click
			setTimeout(() => selectSegment('day'), 0)
		}
		// Reset the flag after handling
		focusFromMouseRef.current = false
	}

	// Handle arrow button clicks
	const handleArrowClick = (direction: 'down' | 'up') => {
		// If no segment selected, default to incrementing the day (smallest common unit)
		const targetSegment = selectedSegment || 'day'
		const increment = direction === 'up' ? 1 : -1

		// Use the date-fns powered increment functions
		if (targetSegment === 'day') {
			incrementDays(increment)
		} else if (targetSegment === 'month') {
			incrementMonths(increment)
		} else if (targetSegment === 'year') {
			incrementYears(increment)
		}

		// Update local input value immediately by reading fresh value from store
		if (store) {
			const updatedValue = store.getState().value
			setInputValue(updatedValue.dateString)
		}

		// Always select the segment that was incremented
		setTimeout(() => selectSegment(targetSegment as DateSegment), 0)
	}

	return (
		<SegmentedInputWrapper
			hasSelection={!!selectedSegment}
			label={t('common.formats.dateFormat', {
				defaultValue: 'DD.MM.YYYY',
			})}
			onArrowClick={handleArrowClick}
		>
			<>
				<Input
					className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${!value.isValid && !value.isPartial ? 'text-error' : ''}`}
					fullWidth={false}
					onBlur={handleBlur}
					onChange={handleInputChange}
					onClick={handleClick}
					onFocus={handleFocus}
					onKeyDown={handleKeyDown}
					onMouseDown={handleMouseDown}
					placeholder={t('common.formats.dateFormat', {
						defaultValue: 'DD.MM.YYYY',
					})}
					ref={inputRef}
					size="md"
					style={{ fontSize: '0.95rem', width: 'calc(10ch + 1.6rem)' }}
					type="text"
					value={inputValue}
					variant="default"
				/>
				{afterSlot}
			</>
		</SegmentedInputWrapper>
	)
}
