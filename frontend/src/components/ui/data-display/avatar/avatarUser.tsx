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
import { ToolTip } from 'components/ui/feedback/Tooltip'
import React from 'react'
import { userAvatarPalette } from 'styles/colors'

type Props = {
  firstName: string
  lastName: string
  size?: number
}

export const AvatarUser: React.FC<Props> = ({ firstName, lastName, size = 39 }) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const fullName = `${firstName} ${lastName}`

  return (
    <ToolTip toolTipContent={<span className="whitespace-nowrap">{fullName}</span>}>
      <div
        className="relative shrink-0"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}>
        <Avatar
          square={false}
          size={size}
          name={`${firstName} ${lastName}`}
          variant="bauhaus"
          colors={userAvatarPalette}
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold text-white"
          style={{
            fontSize: `${size * 0.4}px`,
          }}>
          {initials}
        </div>
      </div>
    </ToolTip>
  )
}
