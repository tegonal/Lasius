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

import { MODAL_SELECT_ORGANISATION } from 'components/features/user/selectUserOrganisation'
import { Heading } from 'components/primitives/typography/Heading'
import { CardSmall } from 'components/ui/cards/CardSmall'
import { AvatarOrganisation } from 'components/ui/data-display/avatar/avatarOrganisation'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { noop } from 'es-toolkit'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsEntityReference, ModelsUserOrganisation } from 'lib/api/lasius'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onSelect?: (organisation: ModelsEntityReference) => void
  selected?: ModelsEntityReference
}

export const SelectUserOrganisationModal: React.FC<Props> = ({ selected, onSelect = noop }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId, organisations, setSelectedOrganisation } = useOrganisation()
  const { closeModal } = useModal(MODAL_SELECT_ORGANISATION)
  const plausible = usePlausible<LasiusPlausibleEvents>()

  const selectOrganisation = async (orgReference: ModelsEntityReference) => {
    plausible('organisation', { props: { status: 'selected' } })
    await setSelectedOrganisation(orgReference)
    onSelect(orgReference)
    closeModal()
  }

  const isCurrent = (item: ModelsUserOrganisation) => {
    if (selected) {
      return selected.id === item.organisationReference.id
    }
    return item.organisationReference.id === selectedOrganisationId
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <Heading as="h1" className="col-span-3">
        {t('organizations.selectOrganisation', { defaultValue: 'Select organisation' })}
      </Heading>
      {organisations.map((item) => (
        <CardSmall
          key={item.organisationReference.id}
          onClick={() => selectOrganisation(item.organisationReference)}>
          <div className="flex flex-col items-center justify-center pt-2">
            <AvatarOrganisation name={item.organisationReference.key} size={64} />
          </div>
          <div className="leading-normal">
            {item.private
              ? t('organizations.myPersonalOrganisation', {
                  defaultValue: 'My personal organisation',
                })
              : item.organisationReference.key}
          </div>
          {isCurrent(item) && (
            <div
              title={t('common.selected', { defaultValue: 'Selected' })}
              className="absolute top-2 right-2">
              <Icon name="check-circle-1-interface-essential" size={18} />
            </div>
          )}
        </CardSmall>
      ))}
    </div>
  )
}
