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
import { useCallback, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { useBookingFormData } from '~/features/bookings/hooks/use-booking-form-data'
import { formatISOLocale } from '~/lib/utils/dates'
import {
  type ModelsCurrentUserTimeBooking,
  type ModelsTag,
} from '~/services/api/lasius'
import { useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

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

export const BookingEditRunning = ({
  item,
  onClose,
  selectedOrgId,
}: BookingEditRunningProps) => {
  const { t } = useTranslation('common')
  const updateBookingApi = useUpdateUserBooking({
    onSuccess: () => {
      onClose()
    },
  })

  const hookForm = useForm<FormValues>({
    defaultValues: {
      projectId: '',
      start: '',
      tags: [],
    },
    mode: 'onChange',
  })

  const booking = item.booking

  const watchedProjectId = hookForm.watch('projectId')
  const { projects, projectTags, recentBookings } = useBookingFormData(
    selectedOrgId,
    watchedProjectId,
  )

  // Derive latest completed booking from recent bookings for start-time preset
  const latestBooking = useMemo(() => {
    const completed = recentBookings.filter((b) => b.end?.dateTime)
    if (completed.length === 0) return null
    return completed.reduce(
      (latest, b) =>
        new Date(b.end!.dateTime) > new Date(latest!.end!.dateTime)
          ? b
          : latest,
      completed[0],
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
      if (name === 'projectId' && value.projectId) {
        hookForm.setFocus('tags')
        void hookForm.trigger()
      }
    })
    return () => subscription.unsubscribe()
  }, [hookForm])

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
    [selectedOrgId, booking, updateBookingApi],
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
                        t('validation.startMustBeInPast', {
                          defaultValue: 'Start time must be in the past',
                        }),
                    },
                  }}
                  withDate={false}
                  withTime={true}
                  {...presetStart}
                />
              </FormElement>
            </FieldSet>
            <ButtonGroup>
              <Button loading={updateBookingApi.isSubmitting} type="submit">
                {t('common.actions.save', {
                  defaultValue: 'Save',
                })}
              </Button>
              <Button
                disabled={updateBookingApi.isSubmitting}
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
