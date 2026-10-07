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

interface OnboardingFooterProperties {
  currentSlide: number
  isReturnToChecklist: boolean
  onBack: () => void
  onDone: () => void
  onNext: () => void
  slideCount: number
}

export const OnboardingFooter = ({
  currentSlide,
  isReturnToChecklist,
  onBack,
  onDone,
  onNext,
  slideCount,
}: OnboardingFooterProperties) => {
  const { t } = useTranslation('onboarding')
  const isLastSlide = currentSlide === slideCount - 1

  return (
    <div className="mt-6 flex items-center justify-between">
      <Button
        className="gap-2"
        data-testid="onboarding-back-btn"
        disabled={currentSlide === 0}
        fullWidth={false}
        onClick={onBack}
        size="sm"
        variant="ghost">
        <LucideIcon icon={ArrowLeft} size={16} />
        {isReturnToChecklist
          ? t('actions.backToChecklist', 'Back to Checklist')
          : t('common:actions.back', 'Back')}
      </Button>

      <div className="text-base-content/50 text-sm" data-testid="onboarding-counter">
        {currentSlide + 1} / {slideCount}
      </div>

      {isLastSlide ? (
        <Button
          data-testid="onboarding-done-btn"
          fullWidth={false}
          onClick={onDone}
          size="sm"
          variant="primary">
          {t('actions.gotIt', 'Ok, got it!')}
        </Button>
      ) : (
        <Button
          className="gap-2"
          data-testid="onboarding-next-btn"
          fullWidth={false}
          onClick={onNext}
          size="sm"
          variant="primary">
          {t('common:actions.next', 'Next')}
          <LucideIcon icon={ArrowRight} size={16} />
        </Button>
      )}
    </div>
  )
}
