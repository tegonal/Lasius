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

import { XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

import { ContextButtonWrapper } from '../context-button-wrapper'
import { useContextMenu } from '../hooks/use-context-menu'

type Props = { variant?: 'compact' | 'default' }

export const ContextButtonClose = ({ variant = 'default' }: Props) => {
  const { handleCloseAll } = useContextMenu()
  const { t } = useTranslation('common')

  return (
    <ContextButtonWrapper variant={variant}>
      <Button
        aria-label={t('contextMenu.actions.close', {
          defaultValue: 'Close context menu',
        })}
        fullWidth={false}
        onClick={handleCloseAll}
        shape="circle"
        title={t('contextMenu.actions.close', {
          defaultValue: 'Close context menu',
        })}
        variant="contextIcon"
      >
        <LucideIcon icon={XIcon} strokeWidth={2} />
      </Button>
    </ContextButtonWrapper>
  )
}
