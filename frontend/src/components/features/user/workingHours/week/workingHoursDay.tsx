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
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormElement } from 'components/ui/forms/FormElement'
import { InputDatePicker2 } from 'components/ui/forms/input/datePicker2/InputDatePicker2'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { getHours, getMinutes } from 'date-fns'
import { round } from 'es-toolkit'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import { updateWorkingHoursByOrganisation } from 'lib/api/lasius/user-organisations/user-organisations'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'
import { ModelsWorkingHoursWeekdays } from 'types/common'

type Props = {
  organisation: ModelsUserOrganisation | undefined
  item: {
    day: ModelsWorkingHoursWeekdays
    date: IsoDateString
    value: IsoDateString
    displayValue: string
  }
}

export const WorkingHoursDay: React.FC<Props> = ({ item, organisation }) => {
  const { modalId, openModal, closeModal } = useModal(
    `EditWorkingHoursModal-${organisation?.organisationReference.id}-${item.day}`,
  )
  const { t } = useTranslation('common')
  const hookForm = useForm()
  const { mutate } = useSWRConfig()
  const { addToast } = useToast()

  useEffect(() => {
    hookForm.setValue(item.day, item.value)
  }, [hookForm, item.day, item.value])

  const onSubmit = async () => {
    const date = new Date(hookForm.getValues()[item.day])
    const hours = round(getHours(date) + getMinutes(date) / 60, 2)
    await updateWorkingHoursByOrganisation(organisation?.organisationReference.id || '', {
      ...organisation,
      plannedWorkingHours: {
        ...(organisation?.plannedWorkingHours || plannedWorkingHoursStub),
        [item.day]: hours,
      },
    })
    await mutate(getGetUserProfileKey())
    addToast({
      message: t('workingHours.status.updated', { defaultValue: 'Working hours updated' }),
      type: 'SUCCESS',
    })
    closeModal()
  }

  return (
    <FormProvider {...hookForm}>
      <div className="text-center leading-normal">
        <div>
          <div className="flex flex-col items-center justify-center">
            <Button
              variant="ghost"
              onClick={openModal}
              className="flex flex-col items-center justify-center gap-2 text-center">
              <div>
                <FormatDate date={item.date} format="dayNameShort" />
              </div>
              <div>{item.displayValue}</div>
              <Icon name="pencil-2-interface-essential" size={18} />
            </Button>
          </div>
        </div>
      </div>
      <ModalResponsive autoSize modalId={modalId}>
        <FieldSet>
          <FormElement>
            <div className="text-center">
              <FormatDate date={item.date} format="dayNameShort" />
            </div>
          </FormElement>
          <FormElement>
            <InputDatePicker2 name={item.day} withDate={false} />
          </FormElement>
          <FormElement>
            <Button onClick={() => onSubmit()}>
              {t('common.actions.save', { defaultValue: 'Save' })}
            </Button>
          </FormElement>
        </FieldSet>
      </ModalResponsive>
    </FormProvider>
  )
}
