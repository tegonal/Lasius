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

import { addSeconds, isFuture } from 'date-fns'
import { ArrowDownToLine } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { formatISOLocale } from '~/lib/utils/dates'
import {
	type ModelsBooking,
	type ModelsCurrentUserTimeBooking,
	type ModelsEntityReference,
	type ModelsTag,
} from '~/services/api/lasius'

type BookingEditRunningProps = {
	item: ModelsCurrentUserTimeBooking
	onClose: () => void
	selectedOrgId: string
}

type FormValues = {
	projectId: string
	start: string
	tags: ModelsTag[]
}

export function BookingEditRunning({
	item,
	onClose,
	selectedOrgId,
}: BookingEditRunningProps) {
	const { t } = useTranslation('common')
	const fetcher = useFetcher<{ ok?: boolean }>()
	const formDataFetcher = useFetcher<{
		projects: ModelsEntityReference[]
		recentBookings: ModelsBooking[]
		tags: ModelsTag[]
	}>()

	const isSubmitting = fetcher.state !== 'idle'

	const hookForm = useForm<FormValues>({
		defaultValues: {
			projectId: '',
			start: '',
			tags: [],
		},
		mode: 'onChange',
	})

	const booking = item.booking

	// Track previous values to avoid re-fetching when fetcher identity changes
	const prevOrgIdRef = useRef<string>('')
	const prevProjectIdRef = useRef<string>('')

	// Load form data (projects, tags) for the selected org
	useEffect(() => {
		if (selectedOrgId && selectedOrgId !== prevOrgIdRef.current) {
			prevOrgIdRef.current = selectedOrgId
			void formDataFetcher.load(
				`/api/booking-form-data?orgId=${selectedOrgId}`,
			)
		}
	}, [selectedOrgId, formDataFetcher])

	const projects = formDataFetcher.data?.projects ?? []

	// Watch projectId to load project-specific tags
	const watchedProjectId = hookForm.watch('projectId')
	const projectTagsFetcher = useFetcher<{ tags: ModelsTag[] }>()

	useEffect(() => {
		const key = `${selectedOrgId}:${watchedProjectId}`
		if (
			selectedOrgId &&
			watchedProjectId &&
			key !== prevProjectIdRef.current
		) {
			prevProjectIdRef.current = key
			void projectTagsFetcher.load(
				`/api/booking-form-data?orgId=${selectedOrgId}&projectId=${watchedProjectId}`,
			)
		}
	}, [selectedOrgId, watchedProjectId, projectTagsFetcher])

	const projectTags = projectTagsFetcher.data?.tags ?? []

	// Derive latest completed booking from recent bookings for start-time preset
	const recentBookings = formDataFetcher.data?.recentBookings ?? []
	const latestBooking = useMemo(() => {
		const completed = recentBookings.filter((b) => b.end?.dateTime)
		if (completed.length === 0) return null
		return completed.reduce((latest, b) =>
			new Date(b.end!.dateTime) > new Date(latest.end!.dateTime)
				? b
				: latest,
		)
	}, [recentBookings])

	// Initialize form values from the running booking
	useEffect(() => {
		if (booking) {
			hookForm.setValue('projectId', booking.projectReference.id)
			hookForm.setValue('tags', booking.tags)
			hookForm.setValue(
				'start',
				formatISOLocale(new Date(booking.start.dateTime)),
			)
			void hookForm.trigger()
		}
	}, [
		hookForm,
		booking,
		booking?.projectReference.id,
		booking?.tags,
		booking?.start.dateTime,
	])

	// Auto-focus tags when project changes
	useEffect(() => {
		const subscription = hookForm.watch((value, { name }) => {
			switch (name) {
				case 'projectId':
					if (value.projectId) {
						hookForm.setFocus('tags')
						void hookForm.trigger()
					}
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

	const presetStart = latestBooking?.end
		? {
				presetDate: formatISOLocale(
					addSeconds(new Date(latestBooking.end.dateTime), 1),
				),
				presetIcon: ArrowDownToLine,
				presetLabel: t('bookings.hints.useEndTimeOfLatest', {
					defaultValue:
						'Use end time of latest booking as start time for this one',
				}),
			}
		: {}

	const onSubmit = useCallback(
		(formValues: FormValues) => {
			const { projectId, start, tags = [] } = formValues

			if (!projectId || !booking) {
				return
			}

			const formData = new FormData()
			formData.set('intent', 'update')
			formData.set('orgId', selectedOrgId)
			formData.set('bookingId', booking.id)
			formData.set('projectId', projectId)
			formData.set('tags', JSON.stringify(tags))
			formData.set('start', start)

			void fetcher.submit(formData, {
				action: '/api/bookings',
				method: 'post',
			})
		},
		[selectedOrgId, booking, fetcher],
	)

	return (
		<div className="relative w-full">
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
									fallbackProject={booking?.projectReference}
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
							<FormElement
								htmlFor="start"
								label={t('common.time.starts', {
									defaultValue: 'Starts',
								})}
							>
								<InputDatePicker
									name="start"
									rules={{
										validate: {
											startInPast: (v: string) =>
												!isFuture(new Date(v)) ||
												(t(
													'validation.startMustBeInPast',
													{
														defaultValue:
															'Start time must be in the past',
													},
												) as string),
										},
									}}
									withDate={false}
									withTime={true}
									{...presetStart}
								/>
							</FormElement>
						</FieldSet>
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
		</div>
	)
}
