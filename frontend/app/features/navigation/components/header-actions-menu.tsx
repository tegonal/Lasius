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

import { Menu } from '@base-ui/react/menu'
import { Building2, HelpCircleIcon, LogOutIcon, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useHelpStore } from '~/features/help/store/help-store'
import { OrgSwitcherDialog } from '~/features/organisation/components/org-switcher'

const itemClasses =
  'rounded-field flex cursor-pointer items-center gap-3 px-3 py-2 data-[highlighted]:bg-base-200'

/** The tablet header: organisation, help and sign-out in one menu, so the week strip stays centred. */
export const HeaderActionsMenu = () => {
  const { t } = useTranslation('common')
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const { toggleHelp } = useHelpStore()
  const fetcher = useFetcher()

  const signOut = () => {
    void fetcher.submit(null, { action: '/logout', method: 'post' })
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              aria-label={t('navigation.openMenu', 'Open menu')}
              data-testid="header-actions-menu-btn"
              fullWidth={false}
              shape="circle"
              variant="ghost">
              <LucideIcon icon={MoreHorizontal} size={20} />
            </Button>
          }
        />
        <Menu.Portal>
          <Menu.Positioner align="end" className="z-[100]" sideOffset={4}>
            <Menu.Popup className="bg-base-100 rounded-box border-base-content/10 w-60 border p-2 shadow-lg">
              <Menu.Item className={itemClasses} onClick={() => setIsOrgDialogOpen(true)}>
                <LucideIcon icon={Building2} size={18} />
                {t('organisation:actions.switch', 'Switch organisation')}
              </Menu.Item>
              <Menu.Item className={itemClasses} onClick={toggleHelp}>
                <LucideIcon icon={HelpCircleIcon} size={18} />
                {t('actions.help', 'Help')}
              </Menu.Item>
              <Menu.Item
                className={itemClasses}
                data-testid="header-menu-sign-out"
                onClick={signOut}>
                <LucideIcon icon={LogOutIcon} size={18} />
                {t('auth.actions.signOut', 'Sign out')}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <OrgSwitcherDialog isOpen={isOrgDialogOpen} onClose={() => setIsOrgDialogOpen(false)} />
    </>
  )
}
