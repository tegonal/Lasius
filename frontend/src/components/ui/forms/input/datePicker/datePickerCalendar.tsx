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
import { CalendarButton } from 'components/primitives/buttons/CalendarButton'
import { FormElement } from 'components/ui/forms/formElement'
import { CalendarDisplay } from 'components/ui/forms/input/calendar/calendarDisplay'
import { DatePickerFieldDays } from 'components/ui/forms/input/datePicker/datePickerFieldDays'
import { DatePickerFieldMonths } from 'components/ui/forms/input/datePicker/datePickerFieldMonths'
import { DatePickerFieldSeparator } from 'components/ui/forms/input/datePicker/datePickerFieldSeparator'
import { DatePickerFieldYears } from 'components/ui/forms/input/datePicker/datePickerFieldYears'
import { InputDatepickerContext } from 'components/ui/forms/input/datePicker/store/store'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ISODateString } from 'next-auth'
import { useTranslation } from 'next-i18next'
import React, { useContext } from 'react'

export const DatePickerCalendar: React.FC = () => {
  const { t } = useTranslation('common')
  const { state, dispatch } = useContext(InputDatepickerContext)
  const { modalId, openModal, closeModal } = useModal(
    `inputDateTimePickerCalendar-${state.isoString}`,
  )

  const changeDate = (selectedDate: ISODateString) => {
    dispatch({ type: 'setDateFromIsoString', payload: selectedDate })
    closeModal()
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(6,auto)] gap-0">
        <DatePickerFieldDays />
        <DatePickerFieldSeparator separator="." />
        <DatePickerFieldMonths />
        <DatePickerFieldSeparator separator="." />
        <DatePickerFieldYears />
        <div className="flex items-center justify-center pl-3">
          <CalendarButton onClick={openModal} />
        </div>
        <ModalResponsive autoSize modalId={modalId}>
          <FormElement>
            <div className="flex flex-col items-center justify-center">
              <CalendarDisplay
                onChange={changeDate}
                value={formatISOLocale(state.date || new Date())}
              />
            </div>
          </FormElement>
          <FormElement>
            <Button variant="secondary" onClick={closeModal}>
              {t('common.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </FormElement>
        </ModalResponsive>
      </div>
    </>
  )
}
