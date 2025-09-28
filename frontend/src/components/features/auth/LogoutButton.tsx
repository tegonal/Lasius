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

import { useSignOut } from 'components/features/system/hooks/useSignOut'
import { Button } from 'components/primitives/buttons/Button'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { LogOutIcon } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const LogoutButton: React.FC = () => {
  const { t } = useTranslation('common')
  const { signOut } = useSignOut()

  return (
    <ToolTip
      toolTipContent={t('auth.actions.logout', { defaultValue: 'Logout' })}
      placement="bottom">
      <Button
        onClick={signOut}
        fullWidth={false}
        variant="ghost"
        shape="circle"
        aria-label={t('auth.actions.signOut', { defaultValue: 'Sign out' })}>
        <LucideIcon icon={LogOutIcon} />
      </Button>
    </ToolTip>
  )
}
