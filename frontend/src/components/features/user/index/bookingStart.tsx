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
import { InputSelectAutocomplete } from 'components/ui/forms/input/inputSelectAutocomplete'
import { InputTagsAutocomplete } from 'components/ui/forms/input/inputTagsAutocomplete'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { roundToNearestMinutes } from 'date-fns'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProjects } from 'lib/api/hooks/useProjects'
import { startUserBookingCurrent } from 'lib/api/lasius/user-bookings/user-bookings'
import { useGetTagsByProject } from 'lib/api/lasius/user-organisations/user-organisations'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { ModelsTags } from 'types/common'

type FormValues = {
  projectId: string
  tags: ModelsTags[]
}

export const BookingStart: React.FC = () => {
  const { t } = useTranslation('common')
  const hookForm = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues: { projectId: '', tags: [] },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { projectSuggestions } = useProjects()
  const { selectedOrganisationId } = useOrganisation()
  const { data: projectTags } = useGetTagsByProject(
    selectedOrganisationId,
    hookForm.watch('projectId'),
  )
  const { closeModal } = useModal('BookingAddMobileModal')

  const resetComponent = () => {
    hookForm.setValue('projectId', '')
    hookForm.setValue('tags', [])
  }

  const onSubmit = async () => {
    const data = hookForm.getValues()
    setIsSubmitting(true)
    const { projectId, tags = [] } = data
    if (projectId) {
      await startUserBookingCurrent(selectedOrganisationId, {
        projectId,
        tags,
        start: formatISOLocale(roundToNearestMinutes(new Date(), { roundingMethod: 'floor' })),
      })
      closeModal()
      resetComponent()
    }
    setIsSubmitting(false)
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
            <FormElement>
              <InputSelectAutocomplete
                name="projectId"
                suggestions={projectSuggestions()}
                required
              />
            </FormElement>
            <FormElement>
              <InputTagsAutocomplete suggestions={projectTags} name="tags" />
            </FormElement>
            <FormElement>
              <Button type="submit" disabled={isSubmitting}>
                <Icon name="stopwatch-interface-essential" size={24} />
                {t('bookings.actions.start', { defaultValue: 'Start booking' })}
              </Button>
            </FormElement>
          </FormBody>
        </form>
      </FormProvider>
    </div>
  )
}
