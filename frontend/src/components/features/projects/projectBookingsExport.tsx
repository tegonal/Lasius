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

import { Text } from 'components/primitives/typography/Text'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { DateRangeFilter } from 'components/ui/forms/DateRangeFilter'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { getExtendedModelsBookingList } from 'lib/api/functions/getExtendedModelsBookingList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsEntityReference } from 'lib/api/lasius'
import { getProjectBookingList } from 'lib/api/lasius/project-bookings/project-bookings'
import { exportBookingList, type ExportFormat } from 'lib/utils/data/export'
import { ChevronDown, Download } from 'lucide-react'
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

export const ProjectBookingsExport: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()

  const hookForm = useForm<FormValues>()

  const handleDownload = async (format: ExportFormat) => {
    setIsLoading(true)
    const { from, to } = hookForm.getValues()
    const timespan = apiTimespanFromTo(from, to)
    const data = await getProjectBookingList(
      selectedOrganisationId,
      item.id,
      timespan || { from: '', to: '' },
    )
    const extendedHistory = getExtendedModelsBookingList(data)
    const filename = exportBookingList(extendedHistory, format, undefined, {
      context: 'project',
      contextName: item.key,
      from,
      to,
    })
    addToast({
      message: t('export.status.success', {
        defaultValue: 'Export successful: {{filename}}',
        filename,
      }),
      type: 'SUCCESS',
      ttl: 60000,
    })
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
            <div className="dropdown">
              <button type="button" className="btn btn-primary" disabled={isLoading} tabIndex={0}>
                <Download className="size-4" />
                {t('export.actions.export', { defaultValue: 'Export' })}
                <ChevronDown className="size-4" />
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                <li>
                  <button onClick={() => handleDownload('csv')}>
                    {t('export.formats.csv', { defaultValue: 'CSV (.csv)' })}
                  </button>
                </li>
                <li>
                  <button onClick={() => handleDownload('xlsx')}>
                    {t('export.formats.excel', { defaultValue: 'Excel (.xlsx)' })}
                  </button>
                </li>
                <li>
                  <button onClick={() => handleDownload('ods')}>
                    {t('export.formats.ods', { defaultValue: 'OpenDocument (.ods)' })}
                  </button>
                </li>
              </ul>
            </div>
          </FormElement>
        </FormBody>
      </FormProvider>
    </div>
  )
}
