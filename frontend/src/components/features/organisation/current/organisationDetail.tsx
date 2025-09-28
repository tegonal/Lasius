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

import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { OrganisationAddUpdateForm } from 'components/features/organisation/current/organisationAddUpdateForm'
import { OrganisationMembers } from 'components/features/organisation/current/organisationMembers'
import { Button } from 'components/primitives/buttons/Button'
import { Heading } from 'components/primitives/typography/Heading'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useTranslation } from 'next-i18next'
import { ROLES } from 'projectConfig/constants'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

export const OrganisationDetail: React.FC = () => {
  const { t } = useTranslation('common')
  const updateModal = useModal(`EditOrganisationModal`)
  const { selectedOrganisation } = useOrganisation()
  const { handleCloseAll } = useContextMenu()
  const isClient = useIsClient()

  const editOrganisation = () => {
    updateModal.openModal()
    handleCloseAll()
  }

  if (!isClient) return null

  return (
    <>
      <Heading as="h2" variant="h2" className="flex items-center justify-between">
        <div>
          {selectedOrganisation?.private
            ? t('organizations.myPersonalOrganisation', {
                defaultValue: 'My personal organisation',
              })
            : selectedOrganisation?.organisationReference.key}
        </div>
        {selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN &&
          !selectedOrganisation?.private && (
            <Button
              variant="primary"
              size="sm"
              title={t('organizations.actions.edit', { defaultValue: 'Edit organisation' })}
              aria-label={t('organizations.actions.edit', { defaultValue: 'Edit organisation' })}
              onClick={() => editOrganisation()}
              className="w-auto">
              {t('organizations.actions.edit', { defaultValue: 'Edit organisation' })}
            </Button>
          )}
      </Heading>
      {selectedOrganisation?.private && (
        <div className="mx-auto mb-4 flex max-w-[500px] flex-col items-center justify-center gap-3 text-center">
          <Icon name="lock-1-interface-essential" size={24} />
          <div className="w-full max-w-[500px]">
            {t('organizations.privateDescription', {
              defaultValue:
                'This organisation is only visible to you. You can use it to track private projects that you do not want others to have access to. If you want to invite people, invite them to an existing organisation or create a new one.',
            })}
          </div>
        </div>
      )}
      {!selectedOrganisation?.private && <OrganisationMembers item={selectedOrganisation} />}

      {selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN ? (
        <>
          <ModalResponsive modalId={updateModal.modalId}>
            <OrganisationAddUpdateForm
              mode="update"
              item={selectedOrganisation}
              onSave={updateModal.closeModal}
              onCancel={updateModal.closeModal}
            />
          </ModalResponsive>
        </>
      ) : null}
    </>
  )
}
