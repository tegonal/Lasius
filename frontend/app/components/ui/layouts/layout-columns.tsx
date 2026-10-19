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

import { PanelRight } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Drawer } from '~/components/ui/overlays/drawer'
import { TABLET_MEDIA_QUERY, useIsMediaMatch } from '~/hooks/use-media-query'
import { useIsRightDrawerOpen, useUIStore } from '~/stores/ui-store'

/**
 * Shared 3-column layout primitives for the nested grid layout.
 *
 * Original 3-column grid (Next.js). The md band is now a tablet layout: icon rail + centre + drawer.
 *   grid-cols-[18rem_auto_19rem]  (lg)
 *   grid-cols-[19rem_auto_20rem]  (xl)
 *   grid-cols-[19rem_auto_24rem]  (2xl)
 *
 * With React Router nested routes we split this into two grids:
 *   Outer (user.layout.tsx):  grid-cols-[left_auto]   — ColumnLeft + Outlet
 *   Inner (child routes):   grid-cols-[auto_right]   — ColumnCenter + ColumnRight
 *
 * Both grids reference the same responsive widths to maintain identical layout.
 * The desktop header in app-layout.tsx uses the full 3-column grid, so its centre lines up with ColumnCenter.
 */

/** Header grid: logo + week strip + actions. The side widths equal ColumnLeft and ColumnRight. */
export const headerGridClasses =
  'grid size-full grid-cols-[3.5rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)_19rem] xl:grid-cols-[19rem_minmax(0,1fr)_20rem] 2xl:grid-cols-[19rem_minmax(0,1fr)_24rem]'

/** Outer grid: left nav + content area. Rendered by user.layout.tsx. The md band shows the icon rail. */
export const outerGridClasses =
  'grid size-full overflow-auto grid-cols-[3.5rem_auto] lg:grid-cols-[18rem_auto] xl:grid-cols-[19rem_auto] 2xl:grid-cols-[19rem_auto]'

/** Inner grid: center content + right sidebar. Rendered by child routes. Below lg the sidebar is a drawer. */
export const innerGridClasses =
  'grid size-full overflow-auto grid-cols-[1fr] lg:grid-cols-[auto_19rem] xl:grid-cols-[auto_20rem] 2xl:grid-cols-[auto_24rem]'

export const ColumnCenter = ({ children }: { children: ReactNode }) => {
  return (
    <div className="border-base-100 bg-base-100 text-base-content @container h-full min-w-0 overflow-auto border-l">
      {children}
    </div>
  )
}

export const ColumnLeft = ({ children }: { children: ReactNode }) => {
  return <div className="h-full w-full rounded-tl-xl">{children}</div>
}

/**
 * The right column from lg. In the tablet band (md) the same content renders once, in a drawer.
 * The drawer portals into this place in the DOM, so form fields stay inside a surrounding form.
 */
export const ColumnRight = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation('common')
  const isTablet = useIsMediaMatch(TABLET_MEDIA_QUERY)
  const isOpen = useIsRightDrawerOpen()
  const setRightDrawerOpen = useUIStore((state) => state.setRightDrawerOpen)
  const { pathname } = useLocation()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  // A route change or a resize out of the md band closes the drawer.
  useEffect(() => {
    setRightDrawerOpen(false)
  }, [isTablet, pathname, setRightDrawerOpen])

  if (isTablet) {
    // display: contents keeps the portal target out of the grid, so it adds no grid row.
    return (
      <div className="contents" ref={setContainer}>
        {container && (
          <Drawer
            bodyClassName="bg-base-200 text-base-content"
            closeLabel={t('actions.close', 'Close')}
            container={container}
            isOpen={isOpen}
            // The centre column reads the filter fields of the booking lists while the drawer is closed.
            keepMounted
            onOpenChange={setRightDrawerOpen}
            popupClassName="sm:max-w-[22rem]"
            testId="layout-right-drawer"
            title={t('layout.sidePanel', 'Side panel')}>
            {children}
          </Drawer>
        )}
      </div>
    )
  }

  return (
    <div className="border-base-100 bg-base-200 text-base-content hidden h-full overflow-hidden rounded-tr-xl border-l lg:block">
      {children}
    </div>
  )
}

/** The header button that opens the right column drawer. It shows only in the tablet band. */
export const ColumnRightToggle = () => {
  const { t } = useTranslation('common')
  const isOpen = useIsRightDrawerOpen()
  const setRightDrawerOpen = useUIStore((state) => state.setRightDrawerOpen)

  return (
    <Button
      aria-expanded={isOpen}
      aria-label={t('layout.openSidePanel', 'Open side panel')}
      className="hidden md:max-lg:flex"
      data-testid="layout-right-drawer-btn"
      fullWidth={false}
      onClick={() => setRightDrawerOpen(!isOpen)}
      shape="circle"
      variant="ghost">
      <LucideIcon icon={PanelRight} size={20} />
    </Button>
  )
}
