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

import { Loading } from 'components/ui/data-display/fetchState/loading'
import { ContainerColumnsDesktop } from 'components/ui/layouts/containerColumnsDesktop'
import { HeaderDesktop } from 'components/ui/layouts/headerDesktop'
import { PageLayoutResponsive } from 'components/ui/layouts/pageLayoutResponsive'
import { NavigationMenuTabs } from 'components/ui/navigation/desktop/navigationMenuTabs'
import React, { Suspense } from 'react'

type Props = {
  children: React.ReactNode
}

export const LayoutDesktop: React.FC<Props> = ({ children }) => {
  return (
    <PageLayoutResponsive>
      <HeaderDesktop />
      <section className="bg-base-200 border-base-content/20 h-full w-full overflow-auto rounded-t-xl border border-b-0 shadow-2xl">
        <ContainerColumnsDesktop>
          <div className="h-full w-full rounded-tl-xl">
            <NavigationMenuTabs />
          </div>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </ContainerColumnsDesktop>
      </section>
    </PageLayoutResponsive>
  )
}
