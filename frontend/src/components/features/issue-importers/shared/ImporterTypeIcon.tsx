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

import { SiGitlab } from '@icons-pack/react-simple-icons'
import { SiJirasoftware } from '@icons-pack/react-simple-icons'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Layers } from 'lucide-react'
import React from 'react'

import type { ImporterType } from './types'

type Props = {
  type: ImporterType
  className?: string
}

export const ImporterTypeIcon: React.FC<Props> = ({ type, className = 'h-5 w-5' }) => {
  switch (type) {
    case 'gitlab':
      return <SiGitlab className={className} />
    case 'jira':
      return <SiJirasoftware className={className} />
    case 'plane':
      return <LucideIcon icon={Layers} className={className} />
  }
}
