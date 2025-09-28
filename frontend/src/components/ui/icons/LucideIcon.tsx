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

import { LucideIcon as LucideIconType, LucideProps } from 'lucide-react'
import React from 'react'

// Global defaults for all Lucide icons
const LUCIDE_DEFAULTS: Partial<LucideProps> = {
  size: 26,
  strokeWidth: 1.5,
}

interface LucideIconProps extends LucideProps {
  icon: LucideIconType
}

/**
 * Wrapper component for Lucide icons with global defaults
 * Usage: <LucideIcon icon={HelpCircleIcon} />
 * Override defaults: <LucideIcon icon={HelpCircleIcon} size={24} strokeWidth={2} />
 */
export const LucideIcon: React.FC<LucideIconProps> = ({ icon: Icon, ...props }) => {
  return <Icon {...LUCIDE_DEFAULTS} {...props} />
}
