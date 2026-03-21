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
import * as LucideIcons from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

interface InlineIconProps {
	name: keyof typeof LucideIcons
	size?: number
}

export const InlineIcon = ({ name, size = 18 }: InlineIconProps) => {
	const IconComponent = LucideIcons[name] as LucideIconType

	if (!IconComponent) {
		return <span>{name}</span>
	}

	return (
		<span className="inline-flex align-middle">
			<LucideIcon icon={IconComponent} size={size} />
		</span>
	)
}
