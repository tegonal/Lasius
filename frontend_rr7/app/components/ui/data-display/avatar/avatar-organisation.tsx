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

const organisationAvatarPalette = [
  '#4a4343',
  '#52fbba',
  '#fffa45',
  '#ff1d00',
  '#723431',
]

interface Props {
  name: string
  size?: number
}

export const AvatarOrganisation = ({ name, size = 39 }: Props) => {
  return (
    <div
      className="relative"
      style={{
        height: `${size}px`,
        width: `${size}px`,
      }}
    >
      <Avatar
        colors={organisationAvatarPalette}
        name={name}
        size={size}
        square={false}
        variant="bauhaus"
      />
    </div>
  )
}
