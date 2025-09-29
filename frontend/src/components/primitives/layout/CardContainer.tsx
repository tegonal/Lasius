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

import { Card, CardBody } from 'components/ui/cards/Card'
import React from 'react'

type Props = {
  // Keeping sx prop for backward compatibility, but it's ignored
  className?: string
  children: React.ReactNode
}

// Legacy component wrapper for backward compatibility
// Consider migrating to Card component directly
export const CardContainer: React.FC<Props> = ({ className, children }) => {
  return (
    <Card className={className} shadow="lg">
      <CardBody>{children}</CardBody>
    </Card>
  )
}
