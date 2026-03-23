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

import { useLoaderData } from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { IntegrationsRightColumn } from '~/features/integrations/components/integrations-right-column'
import { IntegrationsStats } from '~/features/integrations/components/integrations-stats'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

export const IntegrationsLayout = () => {
  const { configs } = useLoaderData<{
    configs: ModelsIssueImporterConfigResponse[]
  }>()

  return (
    <div className={innerGridClasses}>
      <ColumnCenter>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <IntegrationsStats configs={configs} onAddClick={() => {}} />
          </div>
        </div>
      </ColumnCenter>
      <ColumnRight>
        <IntegrationsRightColumn />
      </ColumnRight>
    </div>
  )
}
