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
import { Button } from 'components/primitives/buttons/Button'
import { Heading } from 'components/primitives/typography/Heading'
import { Text } from 'components/primitives/typography/Text'
import { FormElement } from 'components/ui/forms/formElement'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { isAdminOfCurrentOrg } from 'lib/api/functions/isAdminOfCurrentOrg'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProfile } from 'lib/api/hooks/useProfile'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const OrganisationsRightColumn: React.FC = () => {
  const { t } = useTranslation('common')
  const { modalId, openModal, closeModal } = useModal('AddOrganisationModal')
  const { handleCloseAll } = useContextMenu()
  const { profile } = useProfile()
  const { selectedOrganisation } = useOrganisation()
  const amIAdmin = isAdminOfCurrentOrg(profile)

  const addOrganisation = () => {
    openModal()
    handleCloseAll()
  }

  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('organizations.currentOrganization', { defaultValue: 'Current organisation' })}
      </Heading>
      {!selectedOrganisation?.private && (
        <>
          {amIAdmin ? (
            <Text variant="infoText">
              {t('organizations.adminDescription', {
                defaultValue:
                  'You are an administrator of this organisation. You can add and remove members and change the organisation name, or create a new one.',
              })}
            </Text>
          ) : (
            <Text variant="infoText">
              {t('organizations.memberDescription', {
                defaultValue:
                  "You are a member of this organisation and don't have the rights to add or remove members. Get in touch with an organisation administrator if you would like to invite someone.",
              })}
            </Text>
          )}
        </>
      )}
      <Text variant="infoText">
        {t('organizations.createDescription', {
          defaultValue: 'Add a new organisation by clicking on the button below.',
        })}
      </Text>
      <FormElement>
        <Button onClick={() => addOrganisation()}>
          {t('organizations.actions.create', { defaultValue: 'Create organisation' })}
        </Button>
      </FormElement>
      <ModalResponsive modalId={modalId}>
        <OrganisationAddUpdateForm mode="add" onSave={closeModal} onCancel={closeModal} />
      </ModalResponsive>
    </div>
  )
}
