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

import { Outlet } from 'react-router'

import { ColumnCenter, ColumnRight, innerGridClasses } from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { StatsExport } from '~/features/stats/components/stats-export'
import { StatsFilter } from '~/features/stats/components/stats-filter'
import { StatsOverview } from '~/features/stats/components/stats-overview'
import { StatsTabs } from '~/features/stats/components/stats-tabs'

type StatsOverviewLayoutProperties = {
  bookingSummary: { elements: number; hours: number }
  distinctProjects: number
  distinctUsers: number
  from: string
  rangeName: string
  scope: 'organisation' | 'user'
  selectedOrgId: string
  tabs: StatsTab[]
  testId: string
  to: string
}

type StatsTab = { id: string; label: string; to: string }

/** The overview, export, tabs and filter frame of the user and the organisation statistics. */
export const StatsOverviewLayout = ({
  bookingSummary,
  distinctProjects,
  distinctUsers,
  from,
  rangeName,
  scope,
  selectedOrgId,
  tabs,
  testId,
  to,
}: StatsOverviewLayoutProperties) => (
  <div className={innerGridClasses} data-testid={testId}>
    <ColumnCenter>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="bg-base-200 flex-shrink-0 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <StatsOverview
                distinctProjects={distinctProjects}
                distinctUsers={distinctUsers}
                elements={bookingSummary.elements}
                hours={bookingSummary.hours}
              />
            </div>
            <div className="flex-shrink-0">
              <StatsExport
                bookingList={bookingSummary}
                distinctProjects={distinctProjects}
                distinctUsers={distinctUsers}
                from={from}
                scope={scope}
                selectedOrgId={selectedOrgId}
                to={to}
              />
            </div>
          </div>
        </div>
        <div className="border-base-200 border-b px-6 pt-2">
          <StatsTabs tabs={tabs} />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="pt-4">
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </ColumnCenter>
    <ColumnRight>
      <ScrollArea className="h-full">
        <div className="p-4">
          <StatsFilter from={from} rangeName={rangeName} to={to} />
        </div>
      </ScrollArea>
    </ColumnRight>
  </div>
)
