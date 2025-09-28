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
import React from 'react'
import { organisationAvatarPalette } from 'styles/colors'

type Props = {
  name: string
  size?: number
}

export const AvatarOrganisation: React.FC<Props> = ({ name, size = 39 }) => {
  return (
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}>
      <Avatar
        square={false}
        size={size}
        name={name}
        variant="bauhaus"
        colors={organisationAvatarPalette}
      />
    </div>
  )
}
