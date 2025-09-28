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
import { Text } from 'components/primitives/typography/Text'
import { DateRangeFilter } from 'components/ui/forms/DateRangeFilter'
import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { getExtendedModelsBookingList } from 'lib/api/functions/getExtendedModelsBookingList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsEntityReference } from 'lib/api/lasius'
import { getProjectBookingList } from 'lib/api/lasius/project-bookings/project-bookings'
import { exportBookingListToCsv } from 'lib/utils/data/csv'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { ModelsTags } from 'types/common'

type Props = {
  item: ModelsEntityReference
}

type FormValues = {
  project: string
  tags: ModelsTags[]
  from: string
  to: string
  dateRange: string
}

export const ProjectBookingsCsvExport: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { selectedOrganisationId } = useOrganisation()

  const hookForm = useForm<FormValues>()

  const handleDownload = async () => {
    setIsLoading(true)
    const { from, to } = hookForm.getValues()
    const data = await getProjectBookingList(
      selectedOrganisationId,
      item.id,
      apiTimespanFromTo(from, to),
    )
    const extendedHistory = getExtendedModelsBookingList(data)
    exportBookingListToCsv(extendedHistory)
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-[320px]">
      <FormProvider {...hookForm}>
        <FormBody>
          <FormElement>
            <Text variant="infoText">
              {t('export.projectDescription', {
                defaultValue:
                  'Exporting all bookings for {{project}}. This includes time booked by any user, even those not part of your organisation.',
                project: item.key,
              })}
            </Text>
          </FormElement>
          <FormElement>
            <DateRangeFilter name="dateRange" />
          </FormElement>
          <FormElement>
            <Button type="button" disabled={isLoading} onClick={handleDownload}>
              {t('export.actions.downloadCsv', { defaultValue: 'Download CSV' })}
            </Button>
          </FormElement>
        </FormBody>
      </FormProvider>
    </div>
  )
}
