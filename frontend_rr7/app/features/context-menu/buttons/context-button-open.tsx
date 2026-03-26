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

import { Popover } from '@base-ui/react/popover'
import { EllipsisVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export const ContextButtonOpen = ({
  'data-testid': testId,
}: {
  'data-testid'?: string
}) => {
  const { t } = useTranslation('context-menu')

  return (
    <Popover.Trigger
      render={
        <Button
          aria-label={t('actions.open', 'Open context menu')}
          data-testid={testId}
          fullWidth={false}
          shape="circle"
          title={t('actions.open', 'Open context menu')}
          variant="icon"
        >
          <LucideIcon icon={EllipsisVertical} />
        </Button>
      }
    />
  )
}
