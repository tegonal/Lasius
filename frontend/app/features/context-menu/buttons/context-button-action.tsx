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

import { type LucideIcon as LucideIconType } from 'lucide-react'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

import { ContextButtonWrapper } from '../context-button-wrapper'

type Properties = {
  'data-testid'?: string
  icon: LucideIconType
  // Serves as the accessible name and as the tooltip.
  label: string
  onClick?: () => void
  variant?: 'compact' | 'default'
}

/** One round icon button in a context bar. */
export const ContextButtonAction = ({
  'data-testid': testId,
  icon,
  label,
  onClick,
  variant,
}: Properties) => (
  <ContextButtonWrapper variant={variant}>
    <Button
      aria-label={label}
      data-testid={testId}
      fullWidth={false}
      onClick={onClick}
      shape="circle"
      title={label}
      variant="contextIcon">
      <LucideIcon icon={icon} size={24} />
    </Button>
  </ContextButtonWrapper>
)
