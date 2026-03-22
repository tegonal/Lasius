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

import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'

import {
	createHandleClick,
	getSegmentBounds,
	getSegmentFromPosition,
	selectSegment as selectSegmentHelper,
	TIME_SEGMENT_CONFIG,
	type TimeSegment,
} from './shared/core'
import { formatTimeString } from './shared/date-time-helpers'
import {
	createInputChangeHandler,
	handleBackspaceDelete,
	handleEscapeKey,
	handleSeparatorKey,
	validateInputChar,
} from './shared/input'
import { SegmentedInputWrapper } from './shared/segmented-input-wrapper'
import { useRestoreCursorPosition } from './shared/use-restore-cursor-position'
import {
	DatePickerStoreContext,
	useDatePickerStore,
} from './store/use-date-picker-store'

export const SegmentedTimeInputConnected = ({
	afterSlot,
}: {
	afterSlot?: React.ReactNode
}) => {
	const { t } = useTranslation('common')
	const store = useContext(DatePickerStoreContext)
	const {
		incrementHours,
		incrementMinutes,
		resetToInitial,
		setTimeFromString,
		value,
	} = useDatePickerStore()
	const [inputValue, setInputValue] = useState<string>(value.timeString)
	const [selectedSegment, setSelectedSegment] = useState<null | TimeSegment>(
		null,
	)
	const inputRef = useRef<HTMLInputElement>(null)
	const focusFromArrowRef = useRef<boolean>(false)
	const focusFromMouseRef = useRef<boolean>(false)
	const setCursorPosition = useRestoreCursorPosition(inputRef, inputValue)

	const config = TIME_SEGMENT_CONFIG

	// Sync with store
	useEffect(() => {
		if (
			value.timeString !== inputValue &&
			!inputRef.current?.matches(':focus')
		) {
			setInputValue(value.timeString || config.placeholder)
		}
	}, [value.timeString, inputValue, config.placeholder])

	// Select a segment using helper
	const selectSegment = (segment: TimeSegment): void => {
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

	// Handle input change with generic handler
	const handleInputChange = createInputChangeHandler({
		config,
		inputRef,
		inputValue,
		selectedSegment,
		selectSegmentFn: selectSegment,
		setCursorPosition,
		setInputValue,
		updateStore: setTimeFromString,
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
				setTimeFromString,
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
			if (typeof position === 'number' && value.date) {
				const segment = getSegmentFromPosition(
					position,
					inputValue,
					config.delimiter,
					config.segments,
				)
				if (!segment) return

				const baseIncrement = e.key === 'ArrowUp' ? 1 : -1

				if (segment === 'hour') {
					incrementHours(baseIncrement)
				} else if (segment === 'minute') {
					incrementMinutes(baseIncrement * 5)
				}

				if (store) {
					const updatedValue = store.getState().value
					setInputValue(updatedValue.timeString)
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

	// Format on blur
	const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
		const relatedTarget = e.relatedTarget as HTMLElement
		if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
			return
		}
		setSelectedSegment(null)

		if (inputValue && inputValue !== value.timeString) {
			setTimeFromString(inputValue)
		}

		setTimeout(() => {
			if (value.date && value.isValid) {
				setInputValue(formatTimeString(value.date))
			} else {
				setInputValue(value.timeString || config.placeholder)
			}
		}, 0)
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
		const targetSegment: TimeSegment =
			selectedSegment === 'hour' ? 'hour' : 'minute'
		const baseIncrement = direction === 'up' ? 1 : -1

		if (targetSegment === 'hour') {
			incrementHours(baseIncrement)
		} else {
			incrementMinutes(baseIncrement * 5)
		}

		if (store) {
			const updatedValue = store.getState().value
			setInputValue(updatedValue.timeString)
		}

		focusFromArrowRef.current = true

		setTimeout(() => {
			if (inputRef.current && !inputRef.current.matches(':focus')) {
				inputRef.current.focus()
			}
			selectSegment(targetSegment)
		}, 10)
	}

	return (
		<SegmentedInputWrapper
			hasSelection={!!selectedSegment}
			label={t('common.formats.timeFormat', { defaultValue: 'HH:MM' })}
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
					placeholder={t('common.formats.timeFormat', {
						defaultValue: 'HH:MM',
					})}
					ref={inputRef}
					size="md"
					style={{
						fontSize: '0.95rem',
						width: 'calc(5ch + 1.6rem)',
					}}
					type="text"
					value={inputValue}
					variant="default"
				/>
				{afterSlot}
			</>
		</SegmentedInputWrapper>
	)
}
