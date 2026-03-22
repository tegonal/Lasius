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

import { roundToNearestMinutes } from 'date-fns'
import { Timer } from 'lucide-react'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useBookingFormData } from '~/features/bookings/hooks/use-booking-form-data'
import { useStopAndStart } from '~/features/bookings/hooks/use-stop-and-start'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsTag } from '~/services/api/lasius'

type FormValues = {
	projectId: string
	tags: ModelsTag[]
}

type Props = {
	onSuccess?: () => void
	selectedOrgId: string
}

export const BookingStart = ({ onSuccess, selectedOrgId }: Props) => {
	const { t } = useTranslation('common')
	const stopAndStart = useStopAndStart()
	const hookForm = useForm<FormValues>({
		defaultValues: { projectId: '', tags: [] },
		mode: 'onSubmit',
	})

	const watchedProjectId = hookForm.watch('projectId')
	const { projects, projectTags } = useBookingFormData(
		selectedOrgId,
		watchedProjectId,
	)

	const resetComponent = () => {
		hookForm.setValue('projectId', '')
		hookForm.setValue('tags', [])
	}

	const onSubmit = () => {
		const data = hookForm.getValues()
		const { projectId, tags = [] } = data
		if (projectId) {
			stopAndStart.submit({
				orgId: selectedOrgId,
				projectId,
				start: formatISOLocale(
					roundToNearestMinutes(new Date(), {
						roundingMethod: 'floor',
					}),
				),
				tags,
			})
			resetComponent()
			onSuccess?.()
		}
	}

	useEffect(() => {
		const subscription = hookForm.watch((value, { name }) => {
			switch (name) {
				case 'projectId':
					if (value.projectId) {
						hookForm.setFocus('tags')
					}
					break
				default:
					break
			}
		})
		return () => subscription.unsubscribe()
	}, [hookForm])

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
						<ButtonGroup>
							<Button
								data-testid="booking-start-submit-btn"
								disabled={stopAndStart.state !== 'idle'}
								type="submit"
							>
								<LucideIcon icon={Timer} size={24} />
								{t('bookings.actions.start', {
									defaultValue: 'Start booking',
								})}
							</Button>
						</ButtonGroup>
					</FormBody>
				</form>
			</FormProvider>
		</div>
	)
}
