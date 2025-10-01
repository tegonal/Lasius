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

import { Logo } from 'components/ui/icons/Logo'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import React from 'react'

type Props = {
  children: React.ReactNode
  infoPanel?: React.ReactNode
}

export const AuthLayout: React.FC<Props> = ({ children, infoPanel }) => {
  return (
    <div className="flex min-h-screen w-full">
      {infoPanel && (
        <div className="bg-secondary relative hidden items-center justify-center overflow-hidden lg:flex lg:w-1/2">
          <div className="bg-secondary-content/5 absolute top-20 left-20 h-64 w-64 rounded-full blur-3xl"></div>
          <div className="bg-secondary-content/5 absolute right-20 bottom-20 h-96 w-96 rounded-full blur-3xl"></div>

          <div className="text-secondary-content relative z-10 max-w-lg p-12">{infoPanel}</div>
        </div>
      )}

      <div
        className={`from-base-100 to-base-200/30 flex w-full items-center justify-center bg-gradient-to-b p-8 ${infoPanel ? 'lg:w-1/2' : ''}`}>
        <div className="w-full max-w-md space-y-6">
          {infoPanel && (
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo className="h-12 w-auto" />
            </div>
          )}

          {children}

          <div className="pt-4 text-center">
            <TegonalFooter />
          </div>
        </div>
      </div>
    </div>
  )
}
