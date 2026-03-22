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

import { zodResolver } from '@hookform/resolvers/zod'
import { type TFunction } from 'i18next'
import { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Alert } from '~/components/ui/feedback/alert'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import {
	useCreateProject,
	useUpdateProject,
} from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

type Props = {
	item?: ModelsProject | ModelsUserProject
	mode: 'add' | 'update'
	onCancel: () => void
	onSave: () => void
}

const createProjectSchema = (t: TFunction) =>
	z.object({
		projectKey: z.string().min(
			1,
			t('validation.projectKeyRequired', {
				defaultValue: 'Project name is required',
			}),
		),
	})

type FormData = z.infer<ReturnType<typeof createProjectSchema>>

export const ProjectAddUpdateForm = ({
	item,
	mode,
	onCancel,
	onSave,
}: Props) => {
	const { t } = useTranslation('common')
	const { addToast } = useToast()
	const { selectedOrganisationId } = useOrganisation()

	const createProjectApi = useCreateProject()
	const updateProjectApi = useUpdateProject()
	const activeFetcher = mode === 'add' ? createProjectApi : updateProjectApi

	const schema = useMemo(() => createProjectSchema(t), [t])

	const getProjectKey = (
		projectItem?: ModelsProject | ModelsUserProject,
	): string => {
		if (!projectItem) return ''
		if ('projectReference' in projectItem) {
			return projectItem.projectReference.key
		}
		return projectItem.key
	}

	const getProjectId = (
		projectItem?: ModelsProject | ModelsUserProject,
	): string => {
		if (!projectItem) return ''
		if ('projectReference' in projectItem) {
			return projectItem.projectReference.id
		}
		return projectItem.id
	}

	const hookForm = useForm<FormData>({
		defaultValues: {
			projectKey: getProjectKey(item),
		},
		resolver: zodResolver(schema),
	})

	const isSubmitting = activeFetcher.state !== 'idle'

	// Handle response
	const handledRef = useRef(false)
	useEffect(() => {
		if (activeFetcher.state !== 'idle' || !activeFetcher.data) return
		if (handledRef.current) return
		handledRef.current = true

		addToast({
			message:
				mode === 'add'
					? t('projects.status.created', {
							defaultValue: 'Project created',
						})
					: t('projects.status.updated', {
							defaultValue: 'Project updated',
						}),
			type: 'SUCCESS',
		})
		onSave()
	}, [activeFetcher.state, activeFetcher.data, addToast, t, mode, onSave])

	const onSubmit = () => {
		const { projectKey } = hookForm.getValues()

		if (mode === 'add') {
			createProjectApi.submit({
				body: { bookingCategories: [], key: projectKey },
				orgId: selectedOrganisationId,
			})
		} else {
			updateProjectApi.submit({
				body: { key: projectKey },
				orgId: selectedOrganisationId,
				projectId: getProjectId(item),
			})
		}
	}

	return (
		<FormProvider {...hookForm}>
			<div className="flex flex-col">
				<ModalCloseButton onClose={onCancel} />

				<ModalHeader>
					{mode === 'add'
						? t('projects.actions.add', {
								defaultValue: 'Add Project',
							})
						: t('projects.actions.edit', {
								defaultValue: 'Edit project',
							})}
				</ModalHeader>

				<ModalDescription className="mb-4">
					{mode === 'add'
						? t('projects.description.add', {
								defaultValue:
									'Create a new project to organize your time tracking.',
							})
						: t('projects.description.edit', {
								defaultValue: 'Update the project details.',
							})}
				</ModalDescription>

				<form onSubmit={hookForm.handleSubmit(onSubmit)}>
					<FormBody>
						<Alert className="mb-4" variant="info">
							{t('projects.info.uniqueNameRequired', {
								defaultValue:
									'Project names must be unique within your organisation.',
							})}
						</Alert>
						<FieldSet>
							<FormElement
								htmlFor="projectKey"
								label={t('projects.projectName', {
									defaultValue: 'Project name',
								})}
								required
							>
								<Input
									aria-describedby="projectKey-error"
									autoComplete="off"
									data-testid="project-form-key-input"
									id="projectKey"
									{...hookForm.register('projectKey', {
										onChange: () => {
											if (hookForm.formState.errors.projectKey) {
												hookForm.clearErrors('projectKey')
											}
										},
									})}
								/>
								<FormErrorBadge
									error={hookForm.formState.errors.projectKey}
									id="projectKey-error"
								/>
							</FormElement>
						</FieldSet>
						<ButtonGroup>
							<Button
								className="relative z-0"
								data-testid="project-form-save-btn"
								disabled={isSubmitting}
								type="submit"
							>
								{t('common.actions.save', {
									defaultValue: 'Save',
								})}
							</Button>
							<Button
								data-testid="project-form-close-btn"
								onClick={onCancel}
								type="button"
								variant="secondary"
							>
								{t('common.actions.cancel', {
									defaultValue: 'Cancel',
								})}
							</Button>
						</ButtonGroup>
					</FormBody>
				</form>
			</div>
		</FormProvider>
	)
}
