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

import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Heading } from '~/components/primitives/typography/heading'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type StatsProject } from '~/features/stats/lib/project-stats'

type StatsProjectHeaderProperties = {
  backTo: string
  project: StatsProject
}

export const StatsProjectHeader = ({ backTo, project }: StatsProjectHeaderProperties) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2">
        <Heading variant="section">
          <span data-testid="stats-filter-project">{project.key}</span>
        </Heading>
        <Button
          data-testid="stats-filter-back"
          fullWidth={false}
          onClick={() => void navigate(backTo)}
          size="sm"
          variant="ghost">
          <LucideIcon icon={ArrowLeft} size={16} />
          {t('actions.back', { defaultValue: 'Back' })}
        </Button>
      </div>
    </div>
  )
}
