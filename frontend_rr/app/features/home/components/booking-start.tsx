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

import { getFormProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { roundToNearestMinutes } from 'date-fns'
import { Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useStopAndStart } from '~/features/bookings/hooks/use-stop-and-start'
import {
  createBookingStartSchema,
  parseTagsFromFormData,
} from '~/features/bookings/lib/booking-schemas'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsTag } from '~/services/api/lasius'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'

type Properties = {
  onSuccess?: () => void
  selectedOrgId: string
}

export const BookingStart = ({ onSuccess, selectedOrgId }: Properties) => {
  const { t } = useTranslation(['bookings', 'projects', 'tag-manager'])
  const stopAndStart = useStopAndStart()

  // Projects from layout loader (already loaded)
  const { userProjects } = useProjects()
  const projects = userProjects.map((p) => p.projectReference)

  // Tags via Orval hook
  const { data: tagsData, submit: submitTags } = useGetTagsByProject()
  const previousProjectKeyReference = useRef('')

  const schema = createBookingStartSchema(t as unknown as SchemaTranslationFunction)
  const [resetKey, setResetKey] = useState(0)

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: { projectId: '', tags: '' },
    id: `booking-start-${resetKey}`,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const projectIdControl = useInputControl(fields.projectId)

  // Load tags when project changes
  useEffect(() => {
    const pid = projectIdControl.value
    const key = `${selectedOrgId}:${pid}`
    if (selectedOrgId && pid && key !== previousProjectKeyReference.current) {
      previousProjectKeyReference.current = key
      submitTags({ orgId: selectedOrgId, projectId: pid })
    }
  }, [selectedOrgId, projectIdControl.value, submitTags])

  const projectTags = tagsData ?? []

  const resetComponent = () => {
    setResetKey((k) => k + 1)
    previousProjectKeyReference.current = ''
  }

  const onSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = parseWithZod(formData, { schema })
    if (result.status !== 'success') return

    const { projectId, tags: tagsJson } = result.value
    const tags = parseTagsFromFormData(tagsJson) as unknown as ModelsTag[]
    const start = formatISOLocale(
      roundToNearestMinutes(new Date(), {
        roundingMethod: 'floor',
      }),
    )

    stopAndStart.submit({
      orgId: selectedOrgId,
      projectId,
      start,
      tags,
    })
    resetComponent()
    onSuccess?.()
  }

  // Auto-focus tags when project changes
  useEffect(() => {
    if (projectIdControl.value && fields.tags.id) {
      document.querySelector<HTMLElement>(`#${fields.tags.id}`)?.focus()
    }
  }, [projectIdControl.value, fields.tags.id])

  return (
    <div className="relative w-full">
      <form {...getFormProps(form)} onSubmit={onSubmit}>
        <FormBody>
          <FieldSet>
            <FormElement
              htmlFor={fields.projectId.id}
              label={t('projects:label', 'Project')}
              required>
              <ProjectSelect
                errors={fields.projectId.errors}
                id={fields.projectId.id}
                name={fields.projectId.name}
                onChange={(id) => projectIdControl.change(id)}
                projects={projects}
                value={projectIdControl.value ?? ''}
              />
            </FormElement>
            <FormElement htmlFor={fields.tags.id} label={t('tag-manager:label', 'Tags')}>
              <InputTagsAutocomplete
                field={fields.tags}
                id={fields.tags.id}
                key={fields.tags.key}
                projectId={projectIdControl.value}
                suggestions={projectTags}
              />
            </FormElement>
          </FieldSet>
          <ButtonGroup>
            <Button
              data-testid="booking-start-submit-btn"
              disabled={stopAndStart.state !== 'idle'}
              type="submit">
              <LucideIcon icon={Timer} size={24} />
              {t('bookings:actions.start', 'Start booking')}
            </Button>
          </ButtonGroup>
        </FormBody>
      </form>
    </div>
  )
}
