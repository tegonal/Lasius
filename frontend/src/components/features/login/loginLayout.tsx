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

import { Loading } from 'components/ui/data-display/fetchState/loading'
import React, { Suspense } from 'react'

type Props = {
  children: React.ReactNode
}

export const LoginLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="from-base-100 to-base-200 flex min-h-screen w-full items-center justify-center bg-gradient-to-br p-4">
      <div className="flex w-full flex-col items-center gap-8">
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </div>
    </div>
  )
}
