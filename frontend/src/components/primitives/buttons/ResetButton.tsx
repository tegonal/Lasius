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

import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onClick: () => void
  className?: string
}

export const ResetButton: React.FC<Props> = ({ onClick, className }) => {
  const { t } = useTranslation('common')
  const resetLabel = t('common.actions.reset', { defaultValue: 'Reset' })

  return (
    <Button
      type="button"
      variant="ghost"
      shape="circle"
      size="xs"
      onClick={onClick}
      fullWidth={false}
      title={resetLabel}
      aria-label={resetLabel}
      className={className}>
      <LucideIcon icon={RotateCcw} size={16} />
    </Button>
  )
}
