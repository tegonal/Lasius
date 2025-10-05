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

import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ModalConfirm } from 'components/ui/overlays/modal/modalConfirm'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboardingStatus } from 'lib/hooks/useOnboardingStatus'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { DEV } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'

import { OnboardingSlideBooking } from './slides/onboardingSlideBooking'
import { OnboardingSlideChecklist } from './slides/onboardingSlideChecklist'
import { OnboardingSlideNavigation } from './slides/onboardingSlideNavigation'
import { OnboardingSlideOrganisation } from './slides/onboardingSlideOrganisation'
import { OnboardingSlideOverview } from './slides/onboardingSlideOverview'
import { OnboardingSlidePrivateOrganisation } from './slides/onboardingSlidePrivateOrganisation'
import { OnboardingSlideProjects } from './slides/onboardingSlideProjects'
import { OnboardingSlideWorkingHours } from './slides/onboardingSlideWorkingHours'

import type { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'

export const OnboardingTutorial: React.FC = () => {
  const { t } = useTranslation('common')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const tutorialRef = React.useRef<HTMLDivElement>(null)
  const plausible = usePlausible<LasiusPlausibleEvents>()

  // Track which events have been sent to prevent duplicates on remount
  const hasTrackedStart = React.useRef(false)
  const trackedSlides = React.useRef<Set<string>>(new Set())

  const {
    hasCompletedOnboarding,
    hasMultipleOrganisations,
    hasProjects,
    hasWorkingHours,
    hasEverBooked,
    isLoading,
    dismissOnboarding,
  } = useOnboardingStatus()

  // Define all slides with completion status
  const allSlides = [
    {
      id: 'overview',
      component: OnboardingSlideOverview,
      completed: false, // Overview is always shown first
      order: -1,
      show: true,
    },
    {
      id: 'navigation',
      component: OnboardingSlideNavigation,
      completed: false, // Navigation explanation is always shown second
      order: -0.5,
      show: true,
    },
    {
      id: 'checklist',
      component: OnboardingSlideChecklist,
      completed: false, // Checklist is always shown third
      order: 0,
      show: true,
    },
    {
      id: 'privateOrganisation',
      component: OnboardingSlidePrivateOrganisation,
      completed: false, // Show explanation about private org
      order: 0.5,
      show: true, // Always show private org explanation
    },
    {
      id: 'organisation',
      component: OnboardingSlideOrganisation,
      completed: hasMultipleOrganisations,
      order: 1,
      show: true, // Always show how to create/join orgs
    },
    {
      id: 'projects',
      component: OnboardingSlideProjects,
      completed: hasProjects,
      order: 2,
      show: true,
    },
    {
      id: 'workingHours',
      component: OnboardingSlideWorkingHours,
      completed: hasWorkingHours,
      order: 3,
      show: true,
    },
    {
      id: 'booking',
      component: OnboardingSlideBooking,
      completed: hasEverBooked,
      order: 4,
      show: true,
    },
  ].filter((slide) => slide.show)

  // Sort slides: overview first, navigation second, checklist third, privateOrg fourth, then incomplete slides, then complete slides
  const slides = allSlides.sort((a, b) => {
    if (a.id === 'overview') return -1
    if (b.id === 'overview') return 1
    if (a.id === 'navigation') return -1
    if (b.id === 'navigation') return 1
    if (a.id === 'checklist') return -1
    if (b.id === 'checklist') return 1
    if (a.id === 'privateOrganisation') return -1
    if (b.id === 'privateOrganisation') return 1
    if (a.completed === b.completed) return a.order - b.order
    return a.completed ? 1 : -1
  })

  // Track tutorial start on mount (only once)
  useEffect(() => {
    if ((!isLoading || DEV) && !hasTrackedStart.current) {
      plausible('onboarding.tutorial.start', {})
      hasTrackedStart.current = true
    }
  }, [plausible, isLoading])

  // Track slide views (only once per slide)
  useEffect(() => {
    if ((!isLoading || DEV) && slides[currentSlide]) {
      const slideKey = `${slides[currentSlide].id}-${currentSlide}`

      if (!trackedSlides.current.has(slideKey)) {
        plausible('onboarding.tutorial.slide_view', {
          props: {
            slide_id: slides[currentSlide].id,
            slide_number: currentSlide + 1,
          },
        })
        trackedSlides.current.add(slideKey)
      }
    }
  }, [currentSlide, slides, plausible, isLoading])

  // Don't show while data is loading (except in dev mode where we always show it)
  if (isLoading && !DEV) {
    return null
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
      tutorialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
      tutorialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleDismiss = () => {
    const isLastSlide = currentSlide === slides.length - 1

    if (isLastSlide) {
      plausible('onboarding.tutorial.complete', {
        props: { slides_viewed: slides.length },
      })
    } else {
      plausible('onboarding.tutorial.dismiss', {
        props: {
          current_slide: currentSlide + 1,
          total_slides: slides.length,
        },
      })
    }

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

  const handleCancelClose = () => {
    setShowConfirmDialog(false)
  }

  // Don't show if already completed onboarding or dismissed (except in dev mode)
  if (!DEV && (hasCompletedOnboarding || dismissed)) {
    return null
  }

  const CurrentSlideComponent = slides[currentSlide]?.component
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === slides.length - 1

  return (
    <>
      <div
        ref={tutorialRef}
        className="bg-base-200 relative mx-4 flex h-full flex-col rounded-lg p-6">
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={handleClose}
            variant="ghost"
            shape="circle"
            fullWidth={false}
            aria-label={t('common.actions.close', { defaultValue: 'Close' })}>
            <LucideIcon icon={X} size={20} />
          </Button>
        </div>

        {/* Progress indicators */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide
            const isCompleted = slide.completed && slide.id !== 'checklist'

            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className="transition-opacity hover:opacity-80"
                aria-label={`Go to slide ${index + 1}`}>
                <LucideIcon
                  icon={isCompleted ? CheckCircle2 : isActive ? CheckCircle2 : Circle}
                  size={12}
                  className={
                    isCompleted
                      ? 'text-success'
                      : isActive
                        ? 'text-primary'
                        : 'text-base-content/30'
                  }
                />
              </button>
            )
          })}
        </div>

        {/* Slide content with animation */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full">
              {CurrentSlideComponent && <CurrentSlideComponent />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={isFirstSlide}
            variant="ghost"
            size="sm"
            fullWidth={false}
            className="gap-2">
            <LucideIcon icon={ArrowLeft} size={16} />
            {t('common.actions.back', { defaultValue: 'Back' })}
          </Button>

          <div className="text-base-content/50 text-sm">
            {currentSlide + 1} / {slides.length}
          </div>

          {isLastSlide ? (
            <Button onClick={handleDismiss} variant="primary" size="sm" fullWidth={false}>
              {t('onboarding.actions.gotIt', { defaultValue: 'Ok, got it!' })}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="primary"
              size="sm"
              fullWidth={false}
              className="gap-2">
              {t('common.actions.next', { defaultValue: 'Next' })}
              <LucideIcon icon={ArrowRight} size={16} />
            </Button>
          )}
        </div>
      </div>

      {showConfirmDialog && (
        <ModalConfirm
          text={{
            action: t('onboarding.confirmClose', {
              defaultValue:
                'Are you sure you want to close the tutorial? You can re-enable it in App Settings.',
            }),
            confirm: t('common.ok', { defaultValue: 'Ok' }),
            cancel: t('common.actions.cancel', { defaultValue: 'Cancel' }),
          }}
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}
    </>
  )
}
