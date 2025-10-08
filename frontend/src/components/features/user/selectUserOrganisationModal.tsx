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

import { Heading } from 'components/primitives/typography/Heading'
import { CardSmall } from 'components/ui/cards/CardSmall'
import { AvatarOrganisation } from 'components/ui/data-display/avatar/avatarOrganisation'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { noop } from 'es-toolkit'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsEntityReference, ModelsUserOrganisation } from 'lib/api/lasius'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { CheckCircleIcon } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onSelect?: (organisation: ModelsEntityReference) => void
  onClose?: () => void
  selected?: ModelsEntityReference
}

export const SelectUserOrganisationModal: React.FC<Props> = ({
  selected,
  onSelect = noop,
  onClose = noop,
}) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId, organisations, setSelectedOrganisation } = useOrganisation()
  const plausible = usePlausible<LasiusPlausibleEvents>()

  const selectOrganisation = async (orgReference: ModelsEntityReference) => {
    plausible('organisation.switch.success', {
      props: {
        organisation_count: organisations.length,
      },
    })
    await setSelectedOrganisation(orgReference)
    onSelect(orgReference)
    onClose()
  }

  const isCurrent = (item: ModelsUserOrganisation) => {
    if (selected) {
      return selected.id === item.organisationReference.id
    }
    return item.organisationReference.id === selectedOrganisationId
  }

  return (
    <div>
      <Heading as="h1" className="mb-4">
        {t('organisations.selectOrganisation', { defaultValue: 'Select organisation' })}
      </Heading>
      <div className="grid grid-cols-3 gap-3">
        {organisations.map((item) => (
          <CardSmall
            key={item.organisationReference.id}
            onClick={() => selectOrganisation(item.organisationReference)}>
            <div className="flex flex-col items-center justify-center pt-2">
              <AvatarOrganisation name={item.organisationReference.key} size={64} />
            </div>
            <div className="leading-normal">
              {item.private
                ? t('organisations.myPersonalOrganisation', {
                    defaultValue: 'My personal organisation',
                  })
                : item.organisationReference.key}
            </div>
            {isCurrent(item) && (
              <div
                title={t('common.selected', { defaultValue: 'Selected' })}
                className="absolute top-2 right-2">
                <LucideIcon icon={CheckCircleIcon} size={18} />
              </div>
            )}
          </CardSmall>
        ))}
      </div>
    </div>
  )
}
