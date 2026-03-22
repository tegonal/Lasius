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

/* eslint-disable react-compiler/react-compiler -- Form integration effects have intentionally partial deps */
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { isEqual } from 'date-fns'
import {
	CalendarIcon,
	type LucideIcon as LucideIconType,
	RotateCcw,
	X,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { CalendarDisplay } from '~/components/ui/forms/input/calendar/calendar-display'
import { useRequiredFormContext } from '~/components/ui/forms/with-form-context'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

import { SegmentedDateInputConnected } from './segmented-date-input-connected'
import { SegmentedTimeInputConnected } from './segmented-time-input-connected'
import {
	createDatePickerStore,
	DatePickerStoreContext,
	useDatePickerStore,
} from './store/use-date-picker-store'

export type InputDatePickerProps = {
	name: string
	onRenderLabelAction?: (resetButton: React.ReactNode) => void
	presetDate?: IsoDateString
	presetIcon?: LucideIconType
	presetLabel?: string
	rules?: Record<string, unknown>
	withDate?: boolean
	withTime?: boolean
}

/**
 * Main component that checks for form context before rendering
 */
export const InputDatePicker = (props: InputDatePickerProps) => {
	const formContext = useFormContext()

	if (!formContext) {
		return null
	}

	return <InputDatePickerInner {...props} />
}

/**
 * Wrapper component that provides store isolation
 */
const InputDatePickerInner = (props: InputDatePickerProps) => {
	const store = useMemo(() => createDatePickerStore(), [])

	return (
		<DatePickerStoreContext.Provider value={store}>
			<InputDatePickerInternal {...props} />
		</DatePickerStoreContext.Provider>
	)
}

/**
 * Internal component that assumes form context is available
 */
const InputDatePickerInternal = ({
	name,
	onRenderLabelAction,
	presetDate,
	presetIcon: PresetIcon,
	presetLabel,
	rules,
	withDate = true,
	withTime = true,
}: InputDatePickerProps) => {
	const { t } = useTranslation('common')
	const parentFormContext = useRequiredFormContext()
	const {
		getISOString,
		resetToInitial,
		setFromISOString,
		setInitialValue,
		value,
	} = useDatePickerStore()
	const isInitializedRef = useRef(false)
	const initialDateRef = useRef<Date | null>(null)

	// Watch the form value
	const formValue = parentFormContext.watch(name)

	// Register field with validation that runs on every render
	useEffect(() => {
		parentFormContext.register(name, {
			...rules,
			validate: {
				...(rules?.validate as Record<string, unknown>),
				validDate: (fieldValue: string) => {
					const currentValue = value

					if (
						!currentValue.isValid &&
						!currentValue.isPartial &&
						(currentValue.dateString || currentValue.timeString)
					) {
						return 'Invalid date or time format'
					}

					if (rules?.required && !fieldValue) {
						return 'This field is required'
					}

					return true
				},
			},
		})

		return () => {
			parentFormContext.unregister(name)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [name, rules?.required])

	// Initialize store from form value only once
	useEffect(() => {
		if (!isInitializedRef.current) {
			const initialValue = parentFormContext.getValues(name)
			if (initialValue) {
				setFromISOString(initialValue)
				setInitialValue(initialValue)
				const initialDate = new Date(initialValue)
				if (!isNaN(initialDate.getTime())) {
					initialDateRef.current = initialDate
				}
				isInitializedRef.current = true
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Sync form value to store when it changes externally
	useEffect(() => {
		if (!isInitializedRef.current && formValue) {
			setFromISOString(formValue)
			setInitialValue(formValue)
			const initialDate = new Date(formValue)
			if (!isNaN(initialDate.getTime())) {
				initialDateRef.current = initialDate
			}
			isInitializedRef.current = true
			return
		}

		if (!isInitializedRef.current) return

		const currentISOString = getISOString()

		if (formValue !== currentISOString && formValue) {
			setFromISOString(formValue)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formValue])

	// Update form value and trigger validation
	useEffect(() => {
		if (!isInitializedRef.current) return

		if (value.isValid && !value.isPartial) {
			const isoString = getISOString()
			parentFormContext.setValue(name, isoString || '', {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true,
			})
		} else if (!value.dateString && !value.timeString) {
			parentFormContext.setValue(name, '', {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true,
			})
		} else {
			void parentFormContext.trigger(name)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [getISOString()])

	const hasPreset = presetDate && presetLabel && PresetIcon

	const onPresetClick = () => {
		if (presetDate) {
			setFromISOString(presetDate)
			parentFormContext.setValue(name, presetDate)
		}
	}

	const handleCalendarDateChange = (
		selectedDate: IsoDateString,
		close: () => void,
	) => {
		setFromISOString(selectedDate)
		close()
	}

	const handleReset = useCallback(() => {
		resetToInitial()
	}, [resetToInitial])

	const dateTimeHasChanged =
		initialDateRef.current &&
		value.date &&
		value.isValid &&
		!isEqual(initialDateRef.current, value.date)

	const showResetButton =
		dateTimeHasChanged ||
		(!value.isValid &&
			!value.isPartial &&
			(value.dateString || value.timeString))

	const resetButtonElement = useMemo(
		() =>
			showResetButton ? (
				<Button
					aria-label={t('common.actions.resetToInitial', {
						defaultValue: 'Reset to initial value',
					})}
					fullWidth={false}
					onClick={handleReset}
					shape="circle"
					size="sm"
					title={t('common.actions.resetToInitial', {
						defaultValue: 'Reset to initial value',
					})}
					type="button"
					variant="ghost"
				>
					<LucideIcon icon={RotateCcw} size={16} />
				</Button>
			) : null,
		[showResetButton, handleReset, t],
	)

	useEffect(() => {
		if (onRenderLabelAction) {
			onRenderLabelAction(resetButtonElement)
		}
	}, [resetButtonElement, onRenderLabelAction])

	return (
		<>
			<div className="flex w-full flex-col gap-2">
				{/* Input fields */}
				<div className="flex items-start gap-2">
					{withDate && (
						<div className="flex items-start gap-2">
							<SegmentedDateInputConnected
								afterSlot={
									<>
										<Popover>
											<PopoverButton
												as={Button}
												className="px-2"
												fullWidth={false}
												join
												type="button"
												variant="neutral"
											>
												<LucideIcon icon={CalendarIcon} size={20} />
											</PopoverButton>
											<PopoverPanel
												anchor="bottom start"
												className="bg-base-100 border-base-300 z-50 w-[360px] rounded-lg border shadow-lg [--anchor-gap:8px]"
											>
												{({ close }) => (
													<div className="relative p-4 pr-12">
														<button
															aria-label={t('common.actions.close', {
																defaultValue: 'Close',
															})}
															className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2"
															onClick={() => close()}
														>
															<LucideIcon icon={X} size={16} />
														</button>
														<CalendarDisplay
															onChange={(date) =>
																handleCalendarDateChange(date, close)
															}
															value={formatISOLocale(value.date || new Date())}
														/>
													</div>
												)}
											</PopoverPanel>
										</Popover>
										{/* Show preset button next to date if no time input */}
										{!withTime && hasPreset && PresetIcon && (
											<Button
												aria-label={presetLabel}
												className="p-0"
												fullWidth={false}
												join
												onClick={onPresetClick}
												size="sm"
												title={presetLabel}
												type="button"
												variant="ghost"
											>
												<LucideIcon icon={PresetIcon} size={20} />
											</Button>
										)}
									</>
								}
							/>
						</div>
					)}
					{withDate && withTime && <div className="w-2" />}
					{withTime && (
						<SegmentedTimeInputConnected
							afterSlot={
								hasPreset &&
								PresetIcon && (
									<Button
										aria-label={presetLabel}
										className="px-2"
										fullWidth={false}
										join
										onClick={onPresetClick}
										title={presetLabel}
										type="button"
										variant="neutral"
									>
										<LucideIcon icon={PresetIcon} size={20} />
									</Button>
								)
							}
						/>
					)}
				</div>

				{/* Error badge */}
				<FormErrorBadge error={parentFormContext.formState.errors[name]} />
			</div>
		</>
	)
}
