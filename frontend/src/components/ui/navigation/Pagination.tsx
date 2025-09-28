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

import { NextLinkText } from 'components/primitives/typography/Link'
import { cn } from 'lib/utils/cn'
import React from 'react'
import { LinkObjectType } from 'types/common'

export const UniversalPagination: React.FC<{
  totalPages: number
  currentPage: number
  linkFunction: (i: number) => LinkObjectType
  locale: string
}> = ({ totalPages, currentPage, linkFunction }) => {
  const indexes = []

  for (let i = 1; i <= totalPages; i += 1) {
    const isActive = i === currentPage || (i === 1 && !currentPage)
    indexes.push(
      <div className={cn('px-3 py-2 no-underline', isActive && 'font-bold')} key={i}>
        <NextLinkText key={i} {...linkFunction(i)}>
          {i}
        </NextLinkText>
      </div>,
    )
  }

  return (
    <>
      <div className="flex justify-center pt-3 pb-6">{indexes}</div>
    </>
  )
}
