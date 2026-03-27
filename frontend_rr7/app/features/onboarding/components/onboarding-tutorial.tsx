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

import { ArrowLeft, ArrowRight, CheckCircle2, Circle, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { useOnboardingStatus } from '~/features/onboarding/hooks/use-onboarding-status'
import { cn } from '~/lib/utils/cn'
import {
  useAppSettingsStore,
  useOnboardingDismissed,
} from '~/stores/app-settings-store'

import { SlideBooking } from './slides/slide-booking'
import { SlideChecklist } from './slides/slide-checklist'
import { SlideNavigation } from './slides/slide-navigation'
import { SlideOrganisation } from './slides/slide-organisation'
import { SlideOverview } from './slides/slide-overview'
import { SlidePrivateOrg } from './slides/slide-private-org'
import { SlideProjects } from './slides/slide-projects'
import { SlideWorkingHours } from './slides/slide-working-hours'

export const OnboardingTutorial = () => {
  const { t } = useTranslation('onboarding')
  const onboardingDismissed = useOnboardingDismissed()
  const checklistReached = useAppSettingsStore(
    (s) => s.onboardingChecklistReached,
  )
  const dismissOnboarding = useAppSettingsStore((s) => s.dismissOnboarding)
  const markChecklistReached = useAppSettingsStore(
    (s) => s.markChecklistReached,
  )

  const { hasMultipleOrganisations, hasProjects, hasWorkingHours } =
    useOnboardingStatus()

  const [currentSlide, setCurrentSlide] = useState(checklistReached ? 2 : 0)
  const [dismissed, setDismissed] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [returnToChecklistIndex, setReturnToChecklistIndex] = useState<
    null | number
  >(null)
  const [direction, setDirection] = useState<'backward' | 'forward'>('forward')
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Client-only rendering to avoid SSR hydration flash with localStorage
  useEffect(() => setMounted(true), [])

  const slides = useMemo(() => {
    const allSlides = [
      { completed: false, component: SlideOverview, id: 'overview', order: -1 },
      {
        completed: false,
        component: SlideNavigation,
        id: 'navigation',
        order: -0.5,
      },
      {
        completed: false,
        component: SlideChecklist,
        id: 'checklist',
        order: 0,
      },
      {
        completed: false,
        component: SlidePrivateOrg,
        id: 'privateOrganisation',
        order: 0.5,
      },
      {
        completed: hasMultipleOrganisations,
        component: SlideOrganisation,
        id: 'organisation',
        order: 1,
      },
      {
        completed: hasProjects,
        component: SlideProjects,
        id: 'projects',
        order: 2,
      },
      {
        completed: hasWorkingHours,
        component: SlideWorkingHours,
        id: 'workingHours',
        order: 3,
      },
      { completed: false, component: SlideBooking, id: 'booking', order: 4 },
    ]

    return allSlides.toSorted((a, b) => {
      // Fixed-position slides first
      const fixedIds = [
        'overview',
        'navigation',
        'checklist',
        'privateOrganisation',
      ]
      const aFixed = fixedIds.indexOf(a.id)
      const bFixed = fixedIds.indexOf(b.id)
      if (aFixed !== -1 && bFixed !== -1) return aFixed - bFixed
      if (aFixed !== -1) return -1
      if (bFixed !== -1) return 1
      // Then incomplete before complete
      if (a.completed === b.completed) return a.order - b.order
      return a.completed ? 1 : -1
    })
  }, [hasMultipleOrganisations, hasProjects, hasWorkingHours])

  // Mark checklist as reached
  useEffect(() => {
    if (slides[currentSlide]?.id === 'checklist' && !checklistReached) {
      markChecklistReached()
    }
  }, [currentSlide, slides, checklistReached, markChecklistReached])

  // Don't render on server or if already dismissed
  if (!mounted) return null
  if (onboardingDismissed || dismissed) return null

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection('forward')
      setCurrentSlide(currentSlide + 1)
      setReturnToChecklistIndex(null)
      scrollRef.current?.scrollTo({ behavior: 'smooth', top: 0 })
    }
  }

  const handlePrevious = () => {
    if (returnToChecklistIndex !== null) {
      setDirection('backward')
      setCurrentSlide(returnToChecklistIndex)
      setReturnToChecklistIndex(null)
      scrollRef.current?.scrollTo({ behavior: 'smooth', top: 0 })
      return
    }
    if (currentSlide > 0) {
      setDirection('backward')
      setCurrentSlide(currentSlide - 1)
      scrollRef.current?.scrollTo({ behavior: 'smooth', top: 0 })
    }
  }

  const handleNavigateFromChecklist = (slideId: string) => {
    const targetIndex = slides.findIndex((s) => s.id === slideId)
    if (targetIndex !== -1 && targetIndex !== currentSlide) {
      setDirection(targetIndex > currentSlide ? 'forward' : 'backward')
      setReturnToChecklistIndex(currentSlide)
      setCurrentSlide(targetIndex)
      scrollRef.current?.scrollTo({ behavior: 'smooth', top: 0 })
    }
  }

  const handleDismiss = () => {
    dismissOnboarding()
    setDismissed(true)
  }

  const handleClose = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmClose = () => {
    setShowConfirmDialog(false)
    handleDismiss()
  }

  const CurrentSlideComponent = slides[currentSlide]?.component
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === slides.length - 1
  const isChecklistSlide = slides[currentSlide]?.id === 'checklist'

  return (
    <>
      <Modal onClose={handleClose} open size="lg">
        <div className="flex h-full flex-col p-6">
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <Button
              aria-label={t('common:actions.close', 'Close')}
              fullWidth={false}
              onClick={handleClose}
              shape="circle"
              variant="ghost"
            >
              <LucideIcon icon={X} size={20} />
            </Button>
          </div>

          {/* Progress dots */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {slides.map((slide, index) => {
              const isActive = index === currentSlide
              const isCompleted = slide.completed && slide.id !== 'checklist'

              return (
                <button
                  aria-label={`Go to slide ${index + 1}`}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  key={slide.id}
                  onClick={() => {
                    setDirection(index > currentSlide ? 'forward' : 'backward')
                    setCurrentSlide(index)
                  }}
                  type="button"
                >
                  <LucideIcon
                    className={
                      isCompleted
                        ? 'text-success'
                        : isActive
                          ? 'text-primary'
                          : 'text-base-content/30'
                    }
                    icon={
                      isCompleted
                        ? CheckCircle2
                        : isActive
                          ? CheckCircle2
                          : Circle
                    }
                    size={12}
                  />
                </button>
              )
            })}
          </div>

          {/* Slide content */}
          <div
            className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
            ref={scrollRef}
          >
            <div
              className={cn(
                'h-full',
                direction === 'forward'
                  ? 'animate-slide-in-right'
                  : 'animate-slide-in-left',
              )}
              key={currentSlide}
            >
              {CurrentSlideComponent &&
                (isChecklistSlide ? (
                  <CurrentSlideComponent
                    onNavigateToSlide={handleNavigateFromChecklist}
                  />
                ) : (
                  <CurrentSlideComponent />
                ))}
            </div>
          </div>

          {/* Navigation footer */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              className="gap-2"
              disabled={isFirstSlide}
              fullWidth={false}
              onClick={handlePrevious}
              size="sm"
              variant="ghost"
            >
              <LucideIcon icon={ArrowLeft} size={16} />
              {returnToChecklistIndex === null
                ? t('common:actions.back', 'Back')
                : t('actions.backToChecklist', 'Back to Checklist')}
            </Button>

            <div className="text-base-content/50 text-sm">
              {currentSlide + 1} / {slides.length}
            </div>

            {isLastSlide ? (
              <Button
                fullWidth={false}
                onClick={handleDismiss}
                size="sm"
                variant="primary"
              >
                {t('actions.gotIt', 'Ok, got it!')}
              </Button>
            ) : (
              <Button
                className="gap-2"
                fullWidth={false}
                onClick={handleNext}
                size="sm"
                variant="primary"
              >
                {t('common:actions.next', 'Next')}
                <LucideIcon icon={ArrowRight} size={16} />
              </Button>
            )}
          </div>
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
