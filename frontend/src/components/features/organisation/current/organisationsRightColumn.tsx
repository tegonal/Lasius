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
import { Text } from 'components/primitives/typography/Text'
import { isAdminOfCurrentOrg } from 'lib/api/functions/isAdminOfCurrentOrg'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProfile } from 'lib/api/hooks/useProfile'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const OrganisationsRightColumn: React.FC = () => {
  const { t } = useTranslation('common')
  const { profile } = useProfile()
  const { selectedOrganisation } = useOrganisation()
  const amIAdmin = isAdminOfCurrentOrg(profile)

  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('organisations.currentOrganisation', { defaultValue: 'Current organisation' })}
      </Heading>
      {!selectedOrganisation?.private && (
        <>
          {amIAdmin ? (
            <Text variant="infoText">
              {t('organisations.adminDescription', {
                defaultValue:
                  'You are an administrator of this organisation. You can add and remove members and change the organisation name, or create a new one.',
              })}
            </Text>
          ) : (
            <Text variant="infoText">
              {t('organisations.memberDescription', {
                defaultValue:
                  "You are a member of this organisation and don't have the rights to add or remove members. Get in touch with an organisation administrator if you would like to invite someone.",
              })}
            </Text>
          )}
        </>
      )}
      <Text variant="infoText">
        {t('organisations.createDescription', {
          defaultValue: 'Add a new organisation using the Actions button at the top of the list.',
        })}
      </Text>
    </div>
  )
}
