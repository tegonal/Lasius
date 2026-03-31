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
import { addSeconds } from 'date-fns'
import { ArrowDownToLine } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { useProjectTags } from '~/features/bookings/hooks/use-project-tags'
import {
  createBookingEditRunningSchema,
  parseTagsFromFormData,
} from '~/features/bookings/lib/booking-schemas'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type SchemaTranslationFn } from '~/lib/i18n-types'
import { formatISOLocale } from '~/lib/utils/dates'
import {
  type ModelsCurrentUserTimeBooking,
  type ModelsTag,
} from '~/services/api/lasius'
import { useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type BookingEditRunningProps = {
  item: ModelsCurrentUserTimeBooking
  latestBooking?: null | { end?: { dateTime: string } }
  onClose: () => void
  selectedOrgId: string
}

export const BookingEditRunning = ({
  item,
  latestBooking,
  onClose,
  selectedOrgId,
}: BookingEditRunningProps) => {
  const { t } = useTranslation('common')
  const updateBookingApi = useUpdateUserBooking({
    onSuccess: () => {
      onClose()
    },
  })

  const booking = item.booking

  // Projects from layout loader
  const { userProjects } = useProjects()
  const projects = userProjects.map((p) => p.projectReference)

  const schema = createBookingEditRunningSchema(
    t as unknown as SchemaTranslationFn,
  )

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      projectId: booking?.projectReference.id ?? '',
      start: booking ? formatISOLocale(new Date(booking.start.dateTime)) : '',
      tags: booking?.tags ? JSON.stringify(booking.tags) : '',
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const projectIdControl = useInputControl(fields.projectId)
  const startControl = useInputControl(fields.start)

  // Tags via shared hook
  const { projectTags } = useProjectTags(selectedOrgId, projectIdControl.value)

  // Re-initialize form values when booking changes
  useEffect(() => {
    if (booking) {
      projectIdControl.change(booking.projectReference.id)
      form.update({
        name: fields.tags.name,
        value: booking.tags.length > 0 ? JSON.stringify(booking.tags) : '',
      })
      startControl.change(formatISOLocale(new Date(booking.start.dateTime)))
    }
  }, [
    booking,
    booking?.projectReference.id,
    booking?.tags,
    booking?.start.dateTime,
    projectIdControl,
    startControl,
    form,
    fields.tags.name,
  ])

  // Auto-focus tags when project changes
  useEffect(() => {
    if (projectIdControl.value && fields.tags.id) {
      document.querySelector<HTMLElement>(`#${fields.tags.id}`)?.focus()
    }
  }, [projectIdControl.value, fields.tags.id])

  const presetStart = latestBooking?.end
    ? {
        presetDate: formatISOLocale(
          addSeconds(new Date(latestBooking.end.dateTime), 1),
        ),
        presetIcon: ArrowDownToLine,
        presetLabel: t(
          'bookings:hints.useEndTimeOfLatest',
          'Use end time of latest booking as start time for this one',
        ),
      }
    : {}

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      const result = parseWithZod(formData, { schema })
      if (result.status !== 'success') return

      const { projectId, start, tags: tagsJson } = result.value
      const tags = parseTagsFromFormData(tagsJson) as unknown as ModelsTag[]

      if (!projectId || !booking) return

      updateBookingApi.submit({
        body: {
          projectId,
          start: start || undefined,
          tags,
        },
        bookingId: booking.id,
        orgId: selectedOrgId,
      })
    },
    [selectedOrgId, booking, updateBookingApi, schema],
  )

  return (
    <div className="relative w-full">
      <form {...getFormProps(form)} onSubmit={onSubmit}>
        <FormBody>
          <FieldSet>
            <FormElement
              htmlFor={fields.projectId.id}
              label={t('projects:label', 'Project')}
              required
            >
              <ProjectSelect
                errors={fields.projectId.errors}
                fallbackProject={booking?.projectReference}
                id={fields.projectId.id}
                name={fields.projectId.name}
                onChange={(id) => projectIdControl.change(id)}
                projects={projects}
                value={projectIdControl.value ?? ''}
              />
            </FormElement>
            <FormElement
              htmlFor={fields.tags.id}
              label={t('tag-manager:label', 'Tags')}
            >
              <InputTagsAutocomplete
                field={fields.tags}
                id={fields.tags.id}
                key={fields.tags.key}
                suggestions={projectTags}
              />
            </FormElement>
            <FormElement
              htmlFor={fields.start.id}
              label={t('time.starts', 'Starts')}
            >
              <InputDatePicker
                field={fields.start}
                onChange={(v) => startControl.change(v)}
                value={startControl.value ?? ''}
                withDate={false}
                withTime={true}
                {...presetStart}
              />
            </FormElement>
          </FieldSet>
          <ButtonGroup>
            <Button
              data-testid="booking-edit-running-save-btn"
              loading={updateBookingApi.isSubmitting}
              type="submit"
            >
              {t('actions.save', 'Save')}
            </Button>
            <Button
              data-testid="booking-edit-running-close-btn"
              disabled={updateBookingApi.isSubmitting}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              {t('actions.close', 'Close')}
            </Button>
          </ButtonGroup>
        </FormBody>
      </form>
    </div>
  )
}
