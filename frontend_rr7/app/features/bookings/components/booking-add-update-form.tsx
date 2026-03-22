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
	isToday,
	setHours,
	setMinutes,
} from 'date-fns'
import { HelpCircle } from 'lucide-react'
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
import { formatISOLocale } from '~/lib/utils/dates'
import {
	type ModelsBooking,
	type ModelsEntityReference,
	type ModelsTag,
} from '~/services/api/lasius'

type BookingAddUpdateFormProps = {
	itemUpdate?: ModelsBooking
	mode: 'add' | 'update'
	onClose: () => void
	selectedDate?: Date
	selectedOrgId: string
}

type FormValues = {
	end: string
	projectId: string
	start: string
	tags: ModelsTag[]
}

export function BookingAddUpdateForm({
	itemUpdate,
	mode,
	onClose,
	selectedDate,
	selectedOrgId,
}: BookingAddUpdateFormProps) {
	const { t } = useTranslation('common')
	const fetcher = useFetcher<{ ok?: boolean }>()
	const formDataFetcher = useFetcher<{
		projects: ModelsEntityReference[]
		tags: ModelsTag[]
	}>()

	const isSubmitting = fetcher.state !== 'idle'

	const [startResetButton, setStartResetButton] =
		useState<React.ReactNode>(null)
	const [endResetButton, setEndResetButton] =
		useState<React.ReactNode>(null)

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
		if (mode === 'add') {
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
				const end = formatISOLocale(addHours(new Date(), 1))
				hookForm.setValue('start', formatISOLocale(new Date()))
				hookForm.setValue('end', end)
				previousEndDate.current = end
			}
		}
	}, [itemUpdate, mode, hookForm, dateForForm])

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
		if (fetcher.state === 'idle' && fetcher.data?.ok) {
			onClose()
		}
	}, [fetcher.state, fetcher.data, onClose])

	const onSubmit = useCallback(
		(formValues: FormValues) => {
			const { end, projectId, start, tags = [] } = formValues

			if (!projectId) {
				return
			}

			const formData = new FormData()
			formData.set('orgId', selectedOrgId)
			formData.set('projectId', projectId)
			formData.set('tags', JSON.stringify(tags))
			formData.set('start', start)
			formData.set('end', end)

			if (mode === 'add') {
				formData.set('intent', 'add')
			} else if (mode === 'update' && itemUpdate) {
				formData.set('intent', 'update')
				formData.set('bookingId', itemUpdate.id)
			}

			void fetcher.submit(formData, {
				action: '/api/bookings',
				method: 'post',
			})
		},
		[selectedOrgId, mode, itemUpdate, fetcher],
	)

	return (
		<FormProvider {...hookForm}>
			<form onSubmit={hookForm.handleSubmit(onSubmit)}>
				<FormBody>
					<FieldSet>
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
									{t(
										'bookings.warnings.longDurationDescription',
										{
											defaultValue:
												'This booking is longer than a typical 8-hour work day. Please verify that the start and end times are correct.',
											hours: durationHours.toFixed(1),
										},
									)}
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
						<Button
							onClick={onClose}
							type="button"
							variant="secondary"
						>
							{t('common.actions.close', {
								defaultValue: 'Close',
							})}
						</Button>
					</ButtonGroup>
				</FormBody>
			</form>
		</FormProvider>
	)
}
