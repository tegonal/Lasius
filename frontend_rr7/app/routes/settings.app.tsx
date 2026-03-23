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

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { AppSettingsForm } from '~/features/settings/components/app-settings-form'
import { AppSettingsRightColumn } from '~/features/settings/components/app-settings-right-column'

const AppSettingsPage = () => {
  return (
    <div className={innerGridClasses} data-testid="settings-app-page">
      <ColumnCenter>
        <ScrollArea className="bg-base-100 flex-1 overflow-y-auto p-4">
          <AppSettingsForm />
        </ScrollArea>
      </ColumnCenter>
      <ColumnRight>
        <AppSettingsRightColumn />
      </ColumnRight>
    </div>
  )
}

export default AppSettingsPage
