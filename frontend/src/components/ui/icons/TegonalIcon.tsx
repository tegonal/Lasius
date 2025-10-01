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

import React from 'react'

type Props = {
  size?: number
  className?: string
}

export const TegonalIcon: React.FC<Props> = ({ size = 24, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}>
      <path
        d="M19.9991 4.24717C19.999 4.17451 19.9764 4.15668 19.9066 4.13851C19.8368 4.12035 8.51328 1.0167 8.51328 1.0167C8.42077 0.993822 8.38317 0.995055 8.28393 1.0167L3.0355 2.40301C2.99117 2.41322 2.98588 2.47276 3.03374 2.48633L15.7683 6.29878L15.77 6.2999C15.8101 6.31279 15.8292 6.33982 15.8319 6.37817V12.0197C15.8294 12.0607 15.8164 12.0831 15.7737 12.0723L15.7726 12.072C15.2512 11.9082 11.43 10.7071 11.3848 10.6923C11.3385 10.6775 11.3145 10.698 11.3145 10.735C11.3145 10.7812 11.3092 21.2491 11.3092 22.9324C11.3092 23.0046 11.3759 23.0255 11.4239 22.9628C11.4239 22.9628 15.7678 17.4535 15.7906 17.4226C15.8199 17.3829 15.8319 17.3579 15.8319 17.2929V12.122C15.8333 12.0954 15.8475 12.0769 15.859 12.0659L19.9327 8.29409C19.975 8.25025 19.9978 8.21179 19.999 8.13464C19.9996 7.52676 20.0009 4.29785 19.9991 4.24717V4.24717Z"
        fill="currentcolor"
      />
    </svg>
  )
}
