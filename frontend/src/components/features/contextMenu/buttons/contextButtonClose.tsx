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

import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { XIcon } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  variant?: 'default' | 'compact'
}
export const ContextButtonClose: React.FC<Props> = ({ variant = 'default' }) => {
  const { handleCloseAll } = useContextMenu()
  const { t } = useTranslation('common')
  const wrapperVariant = variant === 'compact' ? 'compact' : 'default'
  return (
    <ContextButtonWrapper variant={wrapperVariant}>
      <Button
        variant="contextIcon"
        title={t('contextMenu.actions.close', { defaultValue: 'Close context menu' })}
        aria-label={t('contextMenu.actions.close', { defaultValue: 'Close context menu' })}
        onClick={handleCloseAll}
        shape="circle"
        fullWidth={false}>
        <LucideIcon icon={XIcon} strokeWidth={2} />
      </Button>
    </ContextButtonWrapper>
  )
}
