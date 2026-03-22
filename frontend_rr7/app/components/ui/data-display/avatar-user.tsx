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

import Avatar from 'boring-avatars'

const USER_AVATAR_PALETTE = [
	'#212020',
	'#0f455b',
	'#224431',
	'#836c02',
	'#D9832D',
]

type Props = {
	firstName: string
	lastName: string
	size?: number
}

export const AvatarUser = ({ firstName, lastName, size = 39 }: Props) => {
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
	const fullName = `${firstName} ${lastName}`

	return (
		<div
			className="relative shrink-0"
			style={{ height: `${size}px`, width: `${size}px` }}
			title={fullName}
		>
			<Avatar
				colors={USER_AVATAR_PALETTE}
				name={fullName}
				size={size}
				square={false}
				variant="bauhaus"
			/>
			<div
				className="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold text-white"
				style={{ fontSize: `${size * 0.4}px` }}
			>
				{initials}
			</div>
		</div>
	)
}
