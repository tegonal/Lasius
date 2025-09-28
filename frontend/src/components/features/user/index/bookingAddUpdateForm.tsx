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

import { Button } from 'components/primitives/buttons/Button'
import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { InputDatePicker } from 'components/ui/forms/input/datePicker/inputDatePicker'
import { InputSelectAutocomplete } from 'components/ui/forms/input/inputSelectAutocomplete'
import { InputTagsAutocomplete } from 'components/ui/forms/input/inputTagsAutocomplete'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
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
import { useGetAdjacentBookings } from 'lib/api/hooks/useGetAdjacentBookings'
import { useGetBookingLatest } from 'lib/api/hooks/useGetBookingLatest'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProjects } from 'lib/api/hooks/useProjects'
import { ModelsBooking } from 'lib/api/lasius'
import {
  addUserBookingByOrganisation,
  updateUserBooking,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { useGetTagsByProject } from 'lib/api/lasius/user-organisations/user-organisations'
import { logger } from 'lib/logger'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { DEFAULT_STRING_VALUE } from 'projectConfig/constants'
import React, { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelectedDate } from 'stores/calendarStore'
import { ModelsTags } from 'types/common'

type Props = {
  itemUpdate?: ModelsBooking
  itemReference?: ModelsBooking
  mode: 'add' | 'update' | 'addBetween'
  onSave: () => void
  onCancel: () => void
}

type FormValues = {
  projectId: string
  start: string
  end: string
  tags: ModelsTags[]
}

export const BookingAddUpdateForm: React.FC<Props> = ({
  itemUpdate,
  itemReference,
  mode,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const hookForm = useForm<FormValues>({
    defaultValues: {
      projectId: '',
      tags: [],
      end: '',
      start: '',
    },
  })
  const { selectedOrganisationId } = useOrganisation()
  const { previous: bookingBeforeCurrent, next: bookingAfterCurrent } = useGetAdjacentBookings(
    itemUpdate || itemReference,
  )
  const { data: latestBooking } = useGetBookingLatest(selectedDate)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { projectSuggestions } = useProjects()
  const { data: projectTags } = useGetTagsByProject(
    selectedOrganisationId,
    hookForm.watch('projectId'),
  )
  const { closeModal } = useModal('BookingAddMobileModal')
  const previousEndDate = useRef('')

  useEffect(() => {
    if (itemUpdate) {
      hookForm.setValue('projectId', itemUpdate.projectReference.id)
      hookForm.setValue('tags', itemUpdate.tags)
      hookForm.setValue('start', formatISOLocale(new Date(itemUpdate.start.dateTime)))
      hookForm.setValue('end', formatISOLocale(new Date(itemUpdate?.end?.dateTime || '')))
      hookForm.trigger()
    }
    if (mode === 'add' && !itemReference) {
      if (!isToday(new Date(selectedDate))) {
        const end = formatISOLocale(setHours(new Date(selectedDate), 12))
        hookForm.setValue('start', formatISOLocale(setHours(new Date(selectedDate), 8)))
        hookForm.setValue('end', end)
        previousEndDate.current = end
      }

      if (isToday(new Date(selectedDate))) {
        const end = formatISOLocale(new Date())
        hookForm.setValue('start', formatISOLocale(addHours(new Date(), -1)))
        hookForm.setValue('end', end)
        previousEndDate.current = end
      }

      hookForm.setValue('projectId', '')
      hookForm.setValue('tags', [])
    }

    if (mode === 'add' && itemReference) {
      const reference = new Date(itemReference.end?.dateTime || '')
      hookForm.setValue('start', formatISOLocale(reference))
      hookForm.setValue('end', formatISOLocale(addHours(reference, 1)))

      hookForm.setValue('projectId', '')
      hookForm.setValue('tags', [])
    }

    if (mode === 'addBetween' && itemReference) {
      logger.info('addBetween')
      hookForm.setValue(
        'start',
        formatISOLocale(new Date(bookingBeforeCurrent?.end?.dateTime || '')),
      )
      hookForm.setValue('end', formatISOLocale(new Date(itemReference?.start?.dateTime || '')))

      hookForm.setValue('projectId', '')
      hookForm.setValue('tags', [])
    }

    //  Register validators with element names
    hookForm.register('start', {
      validate: {
        startBeforeEnd: (v) => isBefore(new Date(v), new Date(hookForm.getValues('end'))),
      },
    })

    hookForm.register('end', {
      validate: {
        endAfterStart: (v) => isAfter(new Date(v), new Date(hookForm.getValues('start'))),
      },
    })
  }, [
    hookForm,
    itemUpdate?.projectReference.id,
    itemUpdate?.tags,
    itemUpdate?.start.dateTime,
    itemUpdate,
    mode,
    selectedDate,
    itemReference,
    bookingBeforeCurrent?.end?.dateTime,
  ])

  const onSubmit = async () => {
    const data = hookForm.getValues()
    const { projectId, tags = [], start, end } = data

    if (projectId === DEFAULT_STRING_VALUE) {
      return
    }
    setIsSubmitting(true)

    const payload = {
      ...(itemUpdate || {}),
      start,
      end,
      projectId,
      tags,
    }

    if (mode === 'add' || mode === 'addBetween') {
      await addUserBookingByOrganisation(selectedOrganisationId, payload)
    } else if (mode === 'update' && itemUpdate) {
      await updateUserBooking(selectedOrganisationId, itemUpdate.id, payload)
    }

    closeModal()
    onSave()

    setIsSubmitting(false)
  }

  useEffect(() => {
    const subscription = hookForm.watch((value, { name }) => {
      switch (name) {
        case 'projectId':
          if (value.projectId) {
            hookForm.setFocus('tags')
            hookForm.trigger()
          }
          break
        case 'start':
          if (value.start && previousEndDate.current === value.end) {
            const time = [getHours(new Date(value.end)), getMinutes(new Date(value.end))]
            const endDate = formatISOLocale(
              setMinutes(setHours(new Date(value.start), time[0]), time[1]),
            )
            hookForm.setValue('end', endDate)
            previousEndDate.current = endDate
          }
          hookForm.trigger()
          break
        case 'end':
          hookForm.trigger()
          break
        default:
          break
      }
    })
    return () => subscription.unsubscribe()
  }, [hookForm])

  const presetStart =
    mode === 'addBetween'
      ? {}
      : {
          presetLabel:
            mode === 'add'
              ? t('bookings.hints.useEndTimeOfLatest', {
                  defaultValue: 'Use end time of latest booking as start time for this one',
                })
              : t('bookings.hints.useEndTimeOfPrevious', {
                  defaultValue: 'Use end time of previous booking as start time for this one',
                }),
          presetDate:
            mode === 'add'
              ? formatISOLocale(new Date(latestBooking?.end?.dateTime || ''))
              : formatISOLocale(new Date(bookingBeforeCurrent?.end?.dateTime || '')),
          presetIcon: ArrowDownToLine,
        }

  const presetEnd =
    mode === 'add'
      ? {}
      : mode === 'addBetween'
        ? {}
        : {
            presetLabel: t('bookings.hints.useStartTimeOfNext', {
              defaultValue: 'Use start time of next booking as end time for this one',
            }),
            presetDate: formatISOLocale(new Date(bookingAfterCurrent?.start?.dateTime || '')),
            presetIcon: ArrowUpToLine,
          }

  return (
    <FormProvider {...hookForm}>
      <div className="relative w-full">
        <form onSubmit={hookForm.handleSubmit(onSubmit)}>
          <FormBody>
            <FormElement>
              <InputSelectAutocomplete
                name="projectId"
                suggestions={projectSuggestions()}
                required
              />
            </FormElement>
            <FormElement>
              <InputTagsAutocomplete name="tags" suggestions={projectTags} />
            </FormElement>
            <FormElement>
              <InputDatePicker
                name="start"
                label={t('common.time.starts', { defaultValue: 'Starts' })}
                withDate
                {...presetStart}
              />
            </FormElement>
            <FormElement>
              <InputDatePicker
                name="end"
                label={t('common.time.ends', { defaultValue: 'Ends' })}
                withDate
                {...presetEnd}
              />
            </FormElement>
            <FormElement>
              <Button type="submit" disabled={isSubmitting}>
                {t('common.actions.save', { defaultValue: 'Save' })}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('common.actions.close', { defaultValue: 'Close' })}
              </Button>
            </FormElement>
          </FormBody>
        </form>
      </div>
    </FormProvider>
  )
}
