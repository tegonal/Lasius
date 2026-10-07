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

import { CheckCircle2, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type WizardStep } from '~/features/integrations/hooks/use-wizard-state'
import { getStepClassName, STEP_IDS } from '~/features/integrations/lib/wizard-steps'
import { cn } from '~/lib/utils/cn'

interface WizardProgressProperties {
  currentStepIndex: number
  onSelectStep: (step: WizardStep) => void
}

export const WizardProgress = ({ currentStepIndex, onSelectStep }: WizardProgressProperties) => {
  const { t } = useTranslation('integrations')
  const labels: Record<WizardStep, string> = {
    config: t('issueImporters.wizard.steps.config', { defaultValue: 'Configure' }),
    platform: t('issueImporters.wizard.steps.platform', { defaultValue: 'Platform' }),
    projects: t('issueImporters.wizard.steps.projects', { defaultValue: 'Projects' }),
    test: t('issueImporters.wizard.steps.test', { defaultValue: 'Test' }),
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      {STEP_IDS.map((step, index) => {
        const isDone = index < currentStepIndex
        return (
          <div className="flex items-center" key={step}>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors',
                getStepClassName(index, currentStepIndex),
                isDone ? 'hover:bg-base-200 cursor-pointer' : 'cursor-not-allowed',
              )}
              disabled={!isDone}
              onClick={() => onSelectStep(step)}
              type="button">
              <LucideIcon icon={isDone ? CheckCircle2 : Circle} size={16} />
              <span>{labels[step]}</span>
            </button>
            {index < STEP_IDS.length - 1 && <div className="bg-base-content/20 mx-1 h-px w-4" />}
          </div>
        )
      })}
    </div>
  )
}
