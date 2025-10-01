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
import { HeaderMobile } from 'components/ui/layouts/headerMobile'
import { PageLayoutResponsive } from 'components/ui/layouts/pageLayoutResponsive'
import { NavigationMenuTabs } from 'components/ui/navigation/desktop/navigationMenuTabs'
import { MobileNavigationButton } from 'components/ui/navigation/mobile/mobileNavigationButton'
import React, { Suspense } from 'react'

type Props = {
  children: React.ReactNode
  rightColumn?: React.ReactNode
  mobileContent?: React.ReactNode
}

export const LayoutResponsive: React.FC<Props> = ({ children, rightColumn, mobileContent }) => {
  return (
    <PageLayoutResponsive>
      <div className="hidden md:block">
        <HeaderDesktop />
      </div>

      <div className="overflow-hidden md:hidden">
        <HeaderMobile />
      </div>

      <section className="bg-base-200 border-base-content/20 hidden h-full w-full overflow-auto rounded-t-xl border border-b-0 shadow-2xl md:block">
        <ContainerColumnsDesktop>
          <div className="h-full w-full rounded-tl-xl">
            <NavigationMenuTabs />
          </div>

          <Suspense fallback={<Loading />}>{children}</Suspense>

          {rightColumn && (
            <div className="border-base-100 bg-base-200 text-base-content flex h-full w-full overflow-auto rounded-tr-xl border-l">
              {rightColumn}
            </div>
          )}
        </ContainerColumnsDesktop>
      </section>

      <section className="bg-base-200 h-full w-full overflow-hidden md:hidden">
        <Suspense fallback={<Loading />}>{mobileContent || children}</Suspense>
      </section>

      <div className="fixed bottom-4 left-4 z-10 md:hidden">
        <MobileNavigationButton />
      </div>
    </PageLayoutResponsive>
  )
}
