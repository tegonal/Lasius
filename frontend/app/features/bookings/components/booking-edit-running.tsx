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
import { useTranslation } from 'react-i18next'
import { type z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { BookingProjectTagsFields } from '~/features/bookings/components/booking-project-tags-fields'
import { useApplyRunningBooking } from '~/features/bookings/hooks/use-apply-running-booking'
import { useFocusTagsOnProjectChange } from '~/features/bookings/hooks/use-focus-tags-on-project-change'
import { useProjectTags } from '~/features/bookings/hooks/use-project-tags'
import {
  createBookingEditRunningSchema,
  parseTagsFromFormData,
} from '~/features/bookings/lib/booking-schemas'
import {
  getRunningBookingDefaults,
  getStartPreset,
} from '~/features/bookings/lib/running-booking-form'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { type ModelsCurrentUserTimeBooking, type ModelsTag } from '~/services/api/lasius'
import { useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type BookingEditRunningProperties = {
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
}: BookingEditRunningProperties) => {
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

  const schema = createBookingEditRunningSchema(t as unknown as SchemaTranslationFunction)

  const [form, fields] = useForm<z.input<typeof schema>, z.output<typeof schema>>({
    constraint: getZodConstraint(schema),
    defaultValue: getRunningBookingDefaults(booking),
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') return

      const { projectId, start, tags: tagsJson } = submission.value
      if (!projectId || !booking) return

      const tags = parseTagsFromFormData(tagsJson) as unknown as ModelsTag[]

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

  useApplyRunningBooking(booking, form, fields.tags.name, projectIdControl, startControl)
  useFocusTagsOnProjectChange(projectIdControl.value, fields.tags.id)

  const presetStart = getStartPreset(
    latestBooking,
    t(
      'bookings:hints.useEndTimeOfLatest',
      'Use end time of latest booking as start time for this one',
    ),
  )

  return (
    <div className="relative w-full">
      <form {...getFormProps(form)}>
        <FormBody>
          <FieldSet>
            <BookingProjectTagsFields
              fallbackProject={booking?.projectReference}
              onProjectChange={(id) => projectIdControl.change(id)}
              projectField={fields.projectId}
              projectId={projectIdControl.value}
              projects={projects}
              projectTags={projectTags}
              tagsField={fields.tags}
            />
            <FormElement htmlFor={fields.start.id} label={t('time.starts', 'Starts')}>
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
              type="submit">
              {t('actions.save', 'Save')}
            </Button>
            <Button
              data-testid="booking-edit-running-close-btn"
              disabled={updateBookingApi.isSubmitting}
              onClick={onClose}
              type="button"
              variant="secondary">
              {t('actions.close', 'Close')}
            </Button>
          </ButtonGroup>
        </FormBody>
      </form>
    </div>
  )
}
