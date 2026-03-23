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

import { HelpCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useHelpStore } from '~/features/help/store/help-store'

/**
 * Header help button — toggles the help drawer (route-based content).
 */
export const HelpButton = () => {
  const { t } = useTranslation('common')
  const { toggleHelp } = useHelpStore()

  return (
    <div
      className="tooltip tooltip-bottom"
      data-tip={t('common.actions.help', { defaultValue: 'Help' })}
    >
      <Button
        aria-label={t('common.actions.help', { defaultValue: 'Help' })}
        data-testid="help-btn"
        fullWidth={false}
        onClick={toggleHelp}
        shape="circle"
        variant="ghost"
      >
        <LucideIcon icon={HelpCircleIcon} size={20} />
      </Button>
    </div>
  )
}

/**
 * Contextual help button — opens the help drawer with a specific help file.
 * Used in modals and feature-specific areas.
 */
export const ModalHelpButton = ({ helpKey }: { helpKey: string }) => {
  const { t } = useTranslation('common')
  const { openHelp } = useHelpStore()

  return (
    <Button
      aria-label={t('common.actions.help', { defaultValue: 'Help' })}
      fullWidth={false}
      onClick={() => openHelp(helpKey)}
      shape="circle"
      size="sm"
      type="button"
      variant="ghost"
    >
      <LucideIcon icon={HelpCircleIcon} size={20} />
    </Button>
  )
}
