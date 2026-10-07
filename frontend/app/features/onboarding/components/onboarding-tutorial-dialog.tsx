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

import { X } from 'lucide-react'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { useOnboardingStatus } from '~/features/onboarding/hooks/use-onboarding-status'
import {
  initialOnboardingNavState,
  type OnboardingNavAction,
  onboardingNavReducer,
} from '~/features/onboarding/lib/onboarding-navigation'
import { orderOnboardingSlides } from '~/features/onboarding/lib/order-onboarding-slides'
import { cn } from '~/lib/utils/cn'
import { useAppSettingsStore } from '~/stores/app-settings-store'

import { OnboardingFooter } from './onboarding-footer'
import { SlideProgressDots } from './slide-progress-dots'
import { SlideBooking } from './slides/slide-booking'
import { SlideChecklist } from './slides/slide-checklist'
import { SlideNavigation } from './slides/slide-navigation'
import { SlideOrganisation } from './slides/slide-organisation'
import { SlideOverview } from './slides/slide-overview'
import { SlidePrivateOrg } from './slides/slide-private-org'
import { SlideProjects } from './slides/slide-projects'
import { SlideWorkingHours } from './slides/slide-working-hours'

interface OnboardingTutorialDialogProperties {
  onDismiss: () => void
}

export const OnboardingTutorialDialog = ({ onDismiss }: OnboardingTutorialDialogProperties) => {
  const { t } = useTranslation('onboarding')
  const isChecklistReached = useAppSettingsStore((s) => s.onboardingChecklistReached)
  const markChecklistReached = useAppSettingsStore((s) => s.markChecklistReached)
  const { hasMultipleOrganisations, hasProjects, hasWorkingHours } = useOnboardingStatus()

  // The parent mounts this component after hydration, so the persisted flag is already loaded.
  const [navigation, dispatch] = useReducer(
    onboardingNavReducer,
    isChecklistReached,
    initialOnboardingNavState,
  )
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const scrollReference = useRef<HTMLDivElement>(null)

  const slides = useMemo(
    () =>
      orderOnboardingSlides([
        { completed: false, component: SlideOverview, id: 'overview', order: -1 },
        { completed: false, component: SlideNavigation, id: 'navigation', order: -0.5 },
        { completed: false, component: SlideChecklist, id: 'checklist', order: 0 },
        { completed: false, component: SlidePrivateOrg, id: 'privateOrganisation', order: 0.5 },
        {
          completed: hasMultipleOrganisations,
          component: SlideOrganisation,
          id: 'organisation',
          order: 1,
        },
        { completed: hasProjects, component: SlideProjects, id: 'projects', order: 2 },
        { completed: hasWorkingHours, component: SlideWorkingHours, id: 'workingHours', order: 3 },
        { completed: false, component: SlideBooking, id: 'booking', order: 4 },
      ]),
    [hasMultipleOrganisations, hasProjects, hasWorkingHours],
  )

  const { currentSlide, direction, returnToChecklistIndex } = navigation
  const current = slides[currentSlide]
  const isChecklistSlide = current?.id === 'checklist'

  useEffect(() => {
    if (isChecklistSlide && !isChecklistReached) {
      markChecklistReached()
    }
  }, [isChecklistSlide, isChecklistReached, markChecklistReached])

  const navigateAndScroll = (action: OnboardingNavAction) => {
    dispatch(action)
    scrollReference.current?.scrollTo({ behavior: 'smooth', top: 0 })
  }

  const handleNavigateFromChecklist = (slideId: string) => {
    navigateAndScroll({
      index: slides.findIndex((s) => s.id === slideId),
      type: 'gotoFromChecklist',
    })
  }

  const handleConfirmClose = () => {
    setShowConfirmDialog(false)
    onDismiss()
  }

  const CurrentSlideComponent = current?.component

  return (
    <>
      <Modal onClose={() => setShowConfirmDialog(true)} open size="lg">
        <div className="flex h-full flex-col p-6">
          <div className="absolute top-4 right-4">
            <Button
              aria-label={t('common:actions.close', 'Close')}
              data-testid="onboarding-close-btn"
              fullWidth={false}
              onClick={() => setShowConfirmDialog(true)}
              shape="circle"
              variant="ghost">
              <LucideIcon icon={X} size={20} />
            </Button>
          </div>

          <SlideProgressDots
            currentSlide={currentSlide}
            onSelect={(index) => dispatch({ index, type: 'goto' })}
            slides={slides}
          />

          <div
            className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
            ref={scrollReference}>
            <div
              className={cn(
                'h-full',
                direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left',
              )}
              data-slide-id={current?.id}
              data-testid="onboarding-slide"
              key={currentSlide}>
              {CurrentSlideComponent && (
                <CurrentSlideComponent
                  onNavigateToSlide={isChecklistSlide ? handleNavigateFromChecklist : undefined}
                />
              )}
            </div>
          </div>

          <OnboardingFooter
            currentSlide={currentSlide}
            isReturnToChecklist={returnToChecklistIndex !== null}
            onBack={() => navigateAndScroll({ type: 'previous' })}
            onDone={onDismiss}
            onNext={() => navigateAndScroll({ slideCount: slides.length, type: 'next' })}
            slideCount={slides.length}
          />
        </div>
      </Modal>

      {showConfirmDialog && (
        <GenericConfirmModal
          blockViewport
          cancelLabel={t('common:actions.cancel', 'Cancel')}
          confirmLabel={t('common:ok', 'Ok')}
          confirmVariant="primary"
          message={t(
            'confirmClose',
            'Are you sure you want to close the tutorial? You can re-enable it in App Settings.',
          )}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmClose}
          open={showConfirmDialog}
          title={t('closeTutorial', 'Close tutorial')}
        />
      )}
    </>
  )
}
