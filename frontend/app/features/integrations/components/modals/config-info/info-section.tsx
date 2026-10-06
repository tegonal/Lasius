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

import type React from 'react'

type InfoSectionProperties = {
  children: React.ReactNode
  title: string
}

export const InfoSection = ({ children, title }: InfoSectionProperties) => (
  <div>
    <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
      {title}
    </h3>
    {children}
  </div>
)

type InfoCardProperties = {
  children: React.ReactNode
}

export const InfoCard = ({ children }: InfoCardProperties) => (
  <div className="bg-base-200 rounded-lg p-4">{children}</div>
)
