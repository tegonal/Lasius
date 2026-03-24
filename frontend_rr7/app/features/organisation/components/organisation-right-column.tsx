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

import { useTranslation } from 'react-i18next'

import { Heading } from '~/components/primitives/typography/heading'
import { Text } from '~/components/primitives/typography/text'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'

export const OrganisationRightColumn = () => {
  const { t } = useTranslation('organisation')
  const { isAdministrator, selectedOrganisation } = useOrganisation()

  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('currentOrganisation', 'Current organisation')}
      </Heading>
      {!selectedOrganisation?.private && (
        <>
          {isAdministrator ? (
            <Text variant="infoText">
              {t(
                'adminDescription',
                'You are an administrator of this organisation. You can add and remove members and change the organisation name, or create a new one.',
              )}
            </Text>
          ) : (
            <Text variant="infoText">
              {t(
                'memberDescription',
                "You are a member of this organisation and don't have the rights to add or remove members. Get in touch with an organisation administrator if you would like to invite someone.",
              )}
            </Text>
          )}
        </>
      )}
      <Text variant="infoText">
        {t(
          'createDescription',
          'Add a new organisation using the Actions button at the top of the list.',
        )}
      </Text>
    </div>
  )
}
