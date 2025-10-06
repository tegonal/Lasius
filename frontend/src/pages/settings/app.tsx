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

import { AppSettingsForm } from 'components/features/settings/app/AppSettingsForm'
import { AppSettingsRightColumn } from 'components/features/settings/app/AppSettingsRightColumn'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { LayoutResponsive } from 'components/ui/layouts/layoutResponsive'
import { getServerSidePropsWithAuthRequired } from 'lib/auth/getServerSidePropsWithAuth'
import { GetServerSideProps } from 'next'

const AppSettingsPage = () => {
  return (
    <LayoutResponsive rightColumn={<AppSettingsRightColumn />}>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto p-4">
        <AppSettingsForm />
      </ScrollContainer>
    </LayoutResponsive>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithAuthRequired(context)
}

export default AppSettingsPage
