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

import {
	addHours,
	getHours,
	getMinutes,
	isAfter,
	isBefore,
	isToday,
	setHours,
	setMinutes,
} from 'date-fns'
import {
	ArrowDownToLine,
	ArrowRight,
	ArrowUpToLine,
	HelpCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { InputDatePickerDuration } from '~/components/ui/forms/input/date-picker/input-date-picker-duration'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { formatISOLocale } from '~/lib/utils/dates'
import {
	type ModelsBooking,
	type ModelsBookingStub,
	type ModelsEntityReference,
	type ModelsTag,
} from '~/services/api/lasius'
import {
	useAddUserBookingByOrganisation,
	useUpdateUserBooking,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'

import { BookingPresetSelector } from './booking-preset-selector'

type BookingAddUpdateFormProps = {
	bookingAfter?: ModelsBooking
	bookingBefore?: ModelsBooking
	favorites?: ModelsBookingStub[]
	itemReference?: ModelsBooking
	itemUpdate?: ModelsBooking
	latestBooking?: ModelsBooking
	mode: 'add' | 'addBetween' | 'update'
	onClose: () => void
	orgBookings?: ModelsBooking[]
	recentBookings?: ModelsBooking[]
	selectedDate?: Date
	selectedOrgId: string
}

type FormValues = {
	end: string
	projectId: string
	start: string
	tags: ModelsTag[]
}

type PresetSelection = {
	projectId: string
	projectName: string
	tags: ModelsTag[]
}

const isWithinSameMinute = (time1: string, time2: string): boolean => {
	if (!time1 || !time2) return false
	const date1 = new Date(time1)
	const date2 = new Date(time2)
	const diffMs = Math.abs(date1.getTime() - date2.getTime())
	return diffMs < 60000 // Less than 1 minute
}

export function BookingAddUpdateForm({
	bookingAfter,
	bookingBefore,
	favorites = [],
	itemReference,
	itemUpdate,
	latestBooking,
	mode,
	onClose,
	orgBookings = [],
	recentBookings = [],
	selectedDate,
	selectedOrgId,
}: BookingAddUpdateFormProps) {
	const { t } = useTranslation('common')
	const addBookingApi = useAddUserBookingByOrganisation()
	const updateBookingApi = useUpdateUserBooking()
	const formDataFetcher = useFetcher<{
		projects: ModelsEntityReference[]
		tags: ModelsTag[]
	}>()

	const isSubmitting =
		addBookingApi.state !== 'idle' || updateBookingApi.state !== 'idle'

	const [startResetButton, setStartResetButton] =
		useState<React.ReactNode>(null)
	const [endResetButton, setEndResetButton] = useState<React.ReactNode>(null)
	const [showPresetPanel, setShowPresetPanel] = useState(false)

	const dateForForm = useMemo(() => selectedDate ?? new Date(), [selectedDate])

	const hookForm = useForm<FormValues>({
		defaultValues: {
			end: '',
			projectId: '',
			start: '',
			tags: [],
		},
		mode: 'onChange',
	})

	const previousEndDate = useRef('')

	// Track previous values to avoid re-fetching when fetcher identity changes
	const prevOrgIdRef = useRef<string>('')
	const prevProjectIdRef = useRef<string>('')

	// Load form data (projects, tags) for the selected org
	useEffect(() => {
		if (selectedOrgId && selectedOrgId !== prevOrgIdRef.current) {
			prevOrgIdRef.current = selectedOrgId
			void formDataFetcher.load(`/api/booking-form-data?orgId=${selectedOrgId}`)
		}
	}, [selectedOrgId, formDataFetcher])

	const projects = formDataFetcher.data?.projects ?? []

	// Watch projectId to load project-specific tags
	const watchedProjectId = hookForm.watch('projectId')
	const projectTagsFetcher = useFetcher<{ tags: ModelsTag[] }>()

	useEffect(() => {
		const key = `${selectedOrgId}:${watchedProjectId}`
		if (selectedOrgId && watchedProjectId && key !== prevProjectIdRef.current) {
			prevProjectIdRef.current = key
			void projectTagsFetcher.load(
				`/api/booking-form-data?orgId=${selectedOrgId}&projectId=${watchedProjectId}`,
			)
		}
	}, [selectedOrgId, watchedProjectId, projectTagsFetcher])

	const projectTags = projectTagsFetcher.data?.tags ?? []

	// Calculate duration in hours and check if it exceeds typical work day (8 hours)
	const startValue = hookForm.watch('start')
	const endValue = hookForm.watch('end')
	const durationHours = useMemo(() => {
		if (!startValue || !endValue) return 0
		const start = new Date(startValue)
		const end = new Date(endValue)
		return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
	}, [startValue, endValue])
	const showDurationWarning = durationHours > 8

	// Initialize form values based on mode
	useEffect(() => {
		if (itemUpdate) {
			hookForm.setValue('projectId', itemUpdate.projectReference.id)
			hookForm.setValue('tags', itemUpdate.tags)
			hookForm.setValue(
				'start',
				formatISOLocale(new Date(itemUpdate.start.dateTime)),
			)
			hookForm.setValue(
				'end',
				formatISOLocale(new Date(itemUpdate?.end?.dateTime ?? '')),
			)
			void hookForm.trigger()
		}

		if (mode === 'add' && !itemReference) {
			if (!isToday(new Date(dateForForm))) {
				const end = formatISOLocale(setHours(new Date(dateForForm), 12))
				hookForm.setValue(
					'start',
					formatISOLocale(setHours(new Date(dateForForm), 8)),
				)
				hookForm.setValue('end', end)
				previousEndDate.current = end
			}

			if (isToday(new Date(dateForForm))) {
				const end = formatISOLocale(new Date())
				hookForm.setValue('start', formatISOLocale(addHours(new Date(), -1)))
				hookForm.setValue('end', end)
				previousEndDate.current = end
			}

			hookForm.setValue('projectId', '')
			hookForm.setValue('tags', [])
		}

		if (mode === 'add' && itemReference) {
			const reference = new Date(itemReference.end?.dateTime ?? '')
			hookForm.setValue('start', formatISOLocale(reference))
			hookForm.setValue('end', formatISOLocale(addHours(reference, 1)))

			hookForm.setValue('projectId', '')
			hookForm.setValue('tags', [])
		}

		if (mode === 'addBetween' && itemReference) {
			hookForm.setValue(
				'start',
				formatISOLocale(new Date(bookingBefore?.end?.dateTime ?? '')),
			)
			hookForm.setValue(
				'end',
				formatISOLocale(new Date(itemReference?.start?.dateTime ?? '')),
			)

			hookForm.setValue('projectId', '')
			hookForm.setValue('tags', [])
		}

		// Register validators with element names
		hookForm.register('start', {
			validate: {
				startBeforeEnd: (v) =>
					isBefore(new Date(v), new Date(hookForm.getValues('end'))),
			},
		})

		hookForm.register('end', {
			validate: {
				endAfterStart: (v) =>
					isAfter(new Date(v), new Date(hookForm.getValues('start'))),
			},
		})
	}, [
		itemUpdate,
		mode,
		hookForm,
		dateForForm,
		itemReference,
		bookingBefore?.end?.dateTime,
	])

	// Watch for field changes to auto-adjust end date when start changes
	useEffect(() => {
		const subscription = hookForm.watch((value, { name }) => {
			switch (name) {
				case 'end':
					void hookForm.trigger()
					break
				case 'projectId':
					if (value.projectId) {
						hookForm.setFocus('tags')
						void hookForm.trigger()
					}
					break
				case 'start':
					if (value.start && previousEndDate.current === value.end) {
						const endHours = getHours(new Date(value.end as string))
						const endMinutes = getMinutes(new Date(value.end as string))
						const endDate = formatISOLocale(
							setMinutes(
								setHours(new Date(value.start as string), endHours),
								endMinutes,
							),
						)
						hookForm.setValue('end', endDate)
						previousEndDate.current = endDate
					}
					void hookForm.trigger()
					break
				default:
					break
			}
		})
		return () => subscription.unsubscribe()
	}, [hookForm])

	// Close on successful submission
	useEffect(() => {
		const addDone =
			addBookingApi.state === 'idle' && addBookingApi.data !== undefined
		const updateDone =
			updateBookingApi.state === 'idle' && updateBookingApi.data !== undefined
		if (addDone || updateDone) {
			onClose()
		}
	}, [
		addBookingApi.state,
		addBookingApi.data,
		updateBookingApi.state,
		updateBookingApi.data,
		onClose,
	])

	// Compute preset start props for the start InputDatePicker
	const presetStart = useMemo(() => {
		if (mode === 'addBetween') return {}

		const referenceTime =
			mode === 'add'
				? latestBooking?.end?.dateTime
				: bookingBefore?.end?.dateTime

		if (!referenceTime) return {}

		// Hide preset if current start time is already within same minute as reference
		if (isWithinSameMinute(startValue, referenceTime)) {
			return {}
		}

		return {
			presetDate: formatISOLocale(new Date(referenceTime)),
			presetIcon: ArrowDownToLine,
			presetLabel:
				mode === 'add'
					? t('bookings.hints.useEndTimeOfLatest', {
							defaultValue:
								'Use end time of latest booking as start time for this one',
						})
					: t('bookings.hints.useEndTimeOfPrevious', {
							defaultValue:
								'Use end time of previous booking as start time for this one',
						}),
		}
	}, [mode, latestBooking, bookingBefore, startValue, t])

	// Compute preset end props for the end InputDatePicker
	const presetEnd = useMemo(() => {
		if (mode === 'add' || mode === 'addBetween') return {}

		const referenceTime = bookingAfter?.start?.dateTime
		if (!referenceTime) return {}

		// Hide preset if current end time is already within same minute as reference
		if (isWithinSameMinute(endValue, referenceTime)) {
			return {}
		}

		return {
			presetDate: formatISOLocale(new Date(referenceTime)),
			presetIcon: ArrowUpToLine,
			presetLabel: t('bookings.hints.useStartTimeOfNext', {
				defaultValue: 'Use start time of next booking as end time for this one',
			}),
		}
	}, [mode, bookingAfter, endValue, t])

	const handlePresetSelect = useCallback(
		(preset: PresetSelection) => {
			hookForm.setValue('projectId', preset.projectId)
			hookForm.setValue('tags', preset.tags)
			setShowPresetPanel(false)
			// Trigger validation after setting values
			void hookForm.trigger(['projectId', 'tags'])
		},
		[hookForm],
	)

	const onSubmit = useCallback(
		(formValues: FormValues) => {
			const { end, projectId, start, tags = [] } = formValues

			if (!projectId) {
				return
			}

			if (mode === 'add' || mode === 'addBetween') {
				addBookingApi.submit({
					body: { end, projectId, start, tags },
					orgId: selectedOrgId,
				})
			} else if (mode === 'update' && itemUpdate) {
				updateBookingApi.submit({
					body: {
						end: end || undefined,
						projectId,
						start: start || undefined,
						tags,
					},
					bookingId: itemUpdate.id,
					orgId: selectedOrgId,
				})
			}
		},
		[selectedOrgId, mode, itemUpdate, addBookingApi, updateBookingApi],
	)

	return (
		<FormProvider {...hookForm}>
			<div className="relative w-full overflow-hidden">
				{/* Preset panel — slides in from right */}
				<div
					className="bg-base-100 absolute inset-0 z-20 transition-transform duration-300 ease-out"
					style={{
						transform: showPresetPanel ? 'translateX(0)' : 'translateX(100%)',
					}}
				>
					<BookingPresetSelector
						favorites={favorites}
						onBack={() => setShowPresetPanel(false)}
						onSelect={handlePresetSelect}
						orgBookings={orgBookings}
						recentBookings={recentBookings}
					/>
				</div>

				{/* Form content — slides left when presets are shown */}
				<div
					className="relative w-full transition-transform duration-300 ease-out"
					style={{
						transform: showPresetPanel ? 'translateX(-100%)' : 'translateX(0)',
					}}
				>
					<form onSubmit={hookForm.handleSubmit(onSubmit)}>
						<FormBody>
							<FieldSet>
								<div className="mb-4 flex gap-2">
									<Button
										className="flex-1 gap-2"
										onClick={() => setShowPresetPanel(true)}
										size="sm"
										type="button"
										variant="neutral"
									>
										{t('bookings.presets.browse', {
											defaultValue: 'Browse presets',
										})}
										<LucideIcon icon={ArrowRight} size={16} />
									</Button>
									<ModalHelpButton helpKey="modal-add-edit-booking" />
								</div>
								<FormElement
									htmlFor="projectId"
									label={t('projects.label', {
										defaultValue: 'Project',
									})}
									required
								>
									<ProjectSelect
										fallbackProject={itemUpdate?.projectReference}
										id="projectId"
										name="projectId"
										projects={projects}
										required
									/>
								</FormElement>
								<FormElement
									htmlFor="tags"
									label={t('tags.label', {
										defaultValue: 'Tags',
									})}
								>
									<InputTagsAutocomplete
										id="tags"
										name="tags"
										suggestions={projectTags}
									/>
								</FormElement>
							</FieldSet>

							<FieldSet className="flex items-start gap-4">
								<div className="flex-grow space-y-4 pb-6">
									<FormElement
										htmlFor="start"
										label={t('common.time.starts', {
											defaultValue: 'Starts',
										})}
										labelActionSlot={startResetButton}
									>
										<InputDatePicker
											name="start"
											onRenderLabelAction={setStartResetButton}
											rules={{ required: true }}
											{...presetStart}
										/>
									</FormElement>
									<FormElement
										htmlFor="end"
										label={t('common.time.ends', {
											defaultValue: 'Ends',
										})}
										labelActionSlot={endResetButton}
									>
										<InputDatePicker
											name="end"
											onRenderLabelAction={setEndResetButton}
											rules={{ required: true }}
											{...presetEnd}
										/>
									</FormElement>
								</div>
								<div className="flex w-28 flex-col items-center pt-8">
									<InputDatePickerDuration
										endFieldName="end"
										startFieldName="start"
									/>
								</div>
							</FieldSet>

							{showDurationWarning && (
								<div className="alert alert-warning mb-4" role="alert">
									<LucideIcon icon={HelpCircle} size={20} />
									<div className="flex flex-col gap-1">
										<div className="font-semibold">
											{t('bookings.warnings.longDuration', {
												defaultValue: 'Long duration detected',
											})}
										</div>
										<div className="text-sm">
											{t('bookings.warnings.longDurationDescription', {
												defaultValue:
													'This booking is longer than a typical 8-hour work day. Please verify that the start and end times are correct.',
												hours: durationHours.toFixed(1),
											})}
										</div>
									</div>
								</div>
							)}

							<ButtonGroup>
								<Button disabled={isSubmitting} type="submit">
									{t('common.actions.save', {
										defaultValue: 'Save',
									})}
								</Button>
								<Button onClick={onClose} type="button" variant="secondary">
									{t('common.actions.close', {
										defaultValue: 'Close',
									})}
								</Button>
							</ButtonGroup>
						</FormBody>
					</form>
				</div>
			</div>
		</FormProvider>
	)
}
