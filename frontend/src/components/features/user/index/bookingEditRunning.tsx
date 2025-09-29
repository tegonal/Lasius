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
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { InputDatePicker2 } from 'components/ui/forms/input/datePicker2/InputDatePicker2'
import { InputSelectAutocomplete } from 'components/ui/forms/input/InputSelectAutocomplete'
import { InputTagsAutocomplete } from 'components/ui/forms/input/InputTagsAutocomplete'
import { addSeconds, isFuture } from 'date-fns'
import { useGetBookingLatest } from 'lib/api/hooks/useGetBookingLatest'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProjects } from 'lib/api/hooks/useProjects'
import { ModelsBooking } from 'lib/api/lasius'
import {
  getUserBookingCurrent,
  updateUserBooking,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { useGetTagsByProject } from 'lib/api/lasius/user-organisations/user-organisations'
import { logger } from 'lib/logger'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ArrowDownToLine } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { DEFAULT_STRING_VALUE } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelectedDate } from 'stores/calendarStore'
import { mutate } from 'swr'
import { ModelsTags } from 'types/common'

type Props = {
  item: ModelsBooking
  onSave: () => void
  onCancel: () => void
}

type FormValues = {
  projectId: string
  start: string
  tags: ModelsTags[]
}

export const BookingEditRunning: React.FC<Props> = ({ item, onSave, onCancel }) => {
  const { t } = useTranslation('common')
  const hookForm = useForm<FormValues>({
    defaultValues: {
      projectId: '',
      tags: [],
      start: '',
    },
  })
  const selectedDate = useSelectedDate()
  const { data: latestBooking } = useGetBookingLatest(selectedDate)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { selectedOrganisationId } = useOrganisation()
  const { projectSuggestions } = useProjects()
  const { data: projectTags } = useGetTagsByProject(
    selectedOrganisationId,
    hookForm.watch('projectId'),
  )

  useEffect(() => {
    if (item) {
      hookForm.setValue('projectId', item.projectReference.id)
      hookForm.setValue('tags', item.tags)
      hookForm.setValue('start', formatISOLocale(new Date(item.start.dateTime)))
      hookForm.trigger()
    }
  }, [hookForm, item, item?.projectReference.id, item?.tags, item?.start.dateTime])

  const onSubmit = async (data: any) => {
    const { projectId, tags = [], start } = data

    if (projectId === DEFAULT_STRING_VALUE) {
      return
    }
    setIsSubmitting(true)

    const payload = {
      ...item,
      start,
      end: undefined,
      projectId,
      tags,
    }
    try {
      await updateUserBooking(selectedOrganisationId, item.id, payload)
      await mutate(getUserBookingCurrent())
      onSave()
    } catch (error) {
      logger.warn(error)
    }
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
        default:
          break
      }
    })
    return () => subscription.unsubscribe()
  }, [hookForm])

  const presetStart = latestBooking
    ? {
        presetLabel: t('bookings.hints.useEndTimeOfLatest', {
          defaultValue: 'Use end time of latest booking as start time for this one',
        }),
        presetDate: formatISOLocale(addSeconds(new Date(latestBooking?.end?.dateTime || ''), 1)),
        presetIcon: ArrowDownToLine,
      }
    : {}

  return (
    <div className="relative w-full">
      <FormProvider {...hookForm}>
        <form onSubmit={hookForm.handleSubmit(onSubmit)}>
          <FormBody>
            <FieldSet>
              <FormElement
                label={t('projects.label', { defaultValue: 'Project' })}
                htmlFor="projectId"
                required>
                <InputSelectAutocomplete
                  id="projectId"
                  name="projectId"
                  suggestions={projectSuggestions()}
                  required
                />
              </FormElement>
              <FormElement label={t('tags.label', { defaultValue: 'Tags' })} htmlFor="tags">
                <InputTagsAutocomplete id="tags" name="tags" suggestions={projectTags} />
              </FormElement>
              <FormElement
                label={t('common.time.starts', { defaultValue: 'Starts' })}
                htmlFor="start">
                <InputDatePicker2
                  name="start"
                  withDate={false}
                  withTime={true}
                  rules={{
                    validate: {
                      startInPast: (v: string) =>
                        !isFuture(new Date(v)) ||
                        t('validation.startMustBeInPast', {
                          defaultValue: 'Start time must be in the past',
                        }),
                    },
                  }}
                  {...presetStart}
                />
              </FormElement>
            </FieldSet>
            <ButtonGroup>
              <Button type="submit" disabled={isSubmitting}>
                {t('common.actions.save', { defaultValue: 'Save' })}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('common.actions.close', { defaultValue: 'Close' })}
              </Button>
            </ButtonGroup>
          </FormBody>
        </form>
      </FormProvider>
    </div>
  )
}
