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

import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { BookingProjectTagsFields } from '~/features/bookings/components/booking-project-tags-fields'
import { BookingTimeFieldSet } from '~/features/bookings/components/booking-time-field-set'
import { useBookingFormSubmit } from '~/features/bookings/hooks/use-booking-form-submit'
import { useBookingProjectFields } from '~/features/bookings/hooks/use-booking-project-fields'
import { useBookingTimeFields } from '~/features/bookings/hooks/use-booking-time-fields'
import {
  type BookingFormMode,
  buildBookingSubmit,
  computeInitialValues,
} from '~/features/bookings/lib/booking-form-logic'
import { createBookingSchema, parseTagsFromFormData } from '~/features/bookings/lib/booking-schemas'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { untyped } from '~/lib/i18n-types'
import { type ModelsBooking, type ModelsTag } from '~/services/api/lasius'

import { BookingPresetSelector } from './booking-preset-selector'

type BookingAddUpdateFormProperties = {
  bookingAfter?: ModelsBooking
  bookingBefore?: ModelsBooking
  itemReference?: ModelsBooking
  itemUpdate?: ModelsBooking
  latestBooking?: ModelsBooking
  mode: BookingFormMode
  onClose: () => void
  selectedDate?: Date
  selectedOrgId: string
}

export const BookingAddUpdateForm = ({
  bookingAfter,
  bookingBefore,
  itemReference,
  itemUpdate,
  latestBooking,
  mode,
  onClose,
  selectedDate,
  selectedOrgId,
}: BookingAddUpdateFormProperties) => {
  const { t } = useTranslation('common')
  const { isSubmitting, send } = useBookingFormSubmit(selectedOrgId, onClose)

  const [showPresetPanel, setShowPresetPanel] = useState(false)

  const schema = useMemo(() => createBookingSchema(untyped(t)), [t])
  const initialValues = useMemo(
    () =>
      computeInitialValues(
        mode,
        selectedDate ?? new Date(),
        new Date(),
        itemUpdate,
        itemReference,
        bookingBefore,
      ),
    [mode, selectedDate, itemUpdate, itemReference, bookingBefore],
  )

  const [form, fields] = useForm<z.input<typeof schema>, z.output<typeof schema>>({
    constraint: getZodConstraint(schema),
    defaultValue: initialValues,
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') return
      const { tags, ...rest } = submission.value
      const value = { ...rest, tags: parseTagsFromFormData(tags) as ModelsTag[] }
      send(buildBookingSubmit(mode, value, itemUpdate))
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const time = useBookingTimeFields({
    bookingAfter,
    bookingBefore,
    endField: fields.end,
    initialEnd: initialValues.end,
    latestBooking,
    mode,
    startField: fields.start,
  })
  const project = useBookingProjectFields({
    projectField: fields.projectId,
    selectedOrgId,
    setTags: (value) => form.update({ name: fields.tags.name, value }),
    tagsFieldId: fields.tags.id,
  })

  return (
    <div className="relative w-full overflow-x-hidden">
      <div
        className="flex w-[200%] items-stretch transition-transform duration-300 ease-out"
        style={{
          transform: showPresetPanel ? 'translateX(-50%)' : 'translateX(0)',
        }}>
        {/* Form content */}
        <div className="w-1/2">
          <form {...getFormProps(form)}>
            <FormBody>
              <FieldSet>
                <div className="mb-4 flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowPresetPanel(true)}
                    size="sm"
                    type="button"
                    variant="neutral">
                    {t('bookings:presets.browse', 'Browse presets')}
                    <LucideIcon icon={ArrowRight} size={16} />
                  </Button>
                  <ModalHelpButton helpKey="modal-add-edit-booking" />
                </div>
                <BookingProjectTagsFields
                  fallbackProject={itemUpdate?.projectReference}
                  onProjectChange={project.changeProject}
                  projectField={fields.projectId}
                  projectId={project.projectId}
                  projects={project.projects}
                  projectTags={project.projectTags}
                  tagsField={fields.tags}
                />
              </FieldSet>

              <BookingTimeFieldSet endField={fields.end} startField={fields.start} time={time} />

              <ButtonGroup>
                <Button data-testid="booking-form-save-btn" loading={isSubmitting} type="submit">
                  {t('actions.save', 'Save')}
                </Button>
                <Button
                  data-testid="booking-form-close-btn"
                  disabled={isSubmitting}
                  onClick={onClose}
                  type="button"
                  variant="secondary">
                  {t('actions.close', 'Close')}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </div>
        {/* Preset panel — absolute so it doesn't stretch the container beyond the form height */}
        <div className="relative w-1/2">
          <div className="absolute inset-0">
            <BookingPresetSelector
              onBack={() => setShowPresetPanel(false)}
              onSelect={(preset) => {
                project.applyPreset(preset)
                setShowPresetPanel(false)
              }}
              selectedOrgId={selectedOrgId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
