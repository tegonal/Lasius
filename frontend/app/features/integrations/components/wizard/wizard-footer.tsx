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

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { STEP_IDS } from '~/features/integrations/lib/wizard-steps'

interface WizardFooterProperties {
  currentStepIndex: number
  isNextDisabled: boolean
  isSaving: boolean
  onBack: () => void
  onFinish: () => void
  onNext: () => void
}

export const WizardFooter = ({
  currentStepIndex,
  isNextDisabled,
  isSaving,
  onBack,
  onFinish,
  onNext,
}: WizardFooterProperties) => {
  const { t } = useTranslation('integrations')
  const isLastStep = currentStepIndex === STEP_IDS.length - 1

  return (
    <div className="mt-6 flex flex-shrink-0 items-center justify-between">
      <Button
        disabled={currentStepIndex === 0}
        fullWidth={false}
        onClick={onBack}
        size="sm"
        variant="ghost">
        <LucideIcon icon={ArrowLeft} size={16} />
        {t('actions.back', { defaultValue: 'Back' })}
      </Button>

      <div className="text-base-content/50 text-sm">
        {currentStepIndex + 1} / {STEP_IDS.length}
      </div>

      {isLastStep ? (
        <Button
          disabled={isSaving}
          fullWidth={false}
          onClick={onFinish}
          size="sm"
          variant="primary">
          {isSaving
            ? t('actions.saving', { defaultValue: 'Saving...' })
            : t('actions.finish', { defaultValue: 'Finish' })}
        </Button>
      ) : (
        <Button
          disabled={isNextDisabled}
          fullWidth={false}
          onClick={onNext}
          size="sm"
          variant="primary">
          {t('actions.next', { defaultValue: 'Next' })}
          <LucideIcon icon={ArrowRight} size={16} />
        </Button>
      )}
    </div>
  )
}
