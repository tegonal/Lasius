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

import { cva } from 'class-variance-authority'

import { cn } from '~/lib/utils/cn'
import { type ModelsEntityReference } from '~/services/api/lasius'

const bookingNameVariants = cva('leading-normal', {
  defaultVariants: { variant: 'default' },
  variants: {
    variant: {
      compact: 'text-sm',
      default: '',
    },
  },
})

type Props = {
  className?: string
  item: undefined | { projectReference: ModelsEntityReference }
  variant?: 'compact'
}

export const BookingName = ({ className, item, variant }: Props) => {
  if (!item?.projectReference?.key) return null
  return (
    <div className={cn(bookingNameVariants({ variant }), className)}>
      <span className="font-bold">{item.projectReference.key}</span>
    </div>
  )
}
