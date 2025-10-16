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

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Button } from 'components/primitives/buttons/Button'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { CalendarDisplay } from 'components/ui/forms/input/calendar/calendarDisplay'
import { useRequiredFormContext } from 'components/ui/forms/WithFormContext'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { isEqual } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { formatISOLocale } from 'lib/utils/date/dates'
import { CalendarIcon, LucideIcon as LucideIconType, RotateCcw, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFormContext } from 'react-hook-form'

import { SegmentedDateInputConnected } from './SegmentedDateInputConnected'
import { SegmentedTimeInputConnected } from './SegmentedTimeInputConnected'
import {
  createDatePickerStore,
  DatePickerStoreContext,
  useDatePickerStore,
} from './store/useDatePickerStore'

export type InputDatePickerProps = {
  name: string
  rules?: any
  withDate?: boolean
  withTime?: boolean
  presetDate?: IsoDateString
  presetLabel?: string
  presetIcon?: LucideIconType
  onRenderLabelAction?: (resetButton: React.ReactNode) => void
}

/**
 * Internal component that assumes form context is available
 */
const InputDatePickerInternal: React.FC<InputDatePickerProps> = ({
  name,
  rules,
  withDate = true,
  withTime = true,
  presetDate,
  presetLabel,
  presetIcon: PresetIcon,
  onRenderLabelAction,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useRequiredFormContext() // Guaranteed non-null
  const { getISOString, setFromISOString, setInitialValue, resetToInitial, value } =
    useDatePickerStore()
  const isInitializedRef = useRef(false)
  const initialDateRef = useRef<Date | null>(null)

  // Watch the form value
  const formValue = parentFormContext.watch(name)

  // Register field with validation that runs on every render
  useEffect(() => {
    parentFormContext.register(name, {
      ...rules,
      validate: {
        ...rules?.validate,
        validDate: (fieldValue: string) => {
          // Check the current store state for validation
          const currentValue = value

          // If we have invalid complete input, block submission
          if (
            !currentValue.isValid &&
            !currentValue.isPartial &&
            (currentValue.dateString || currentValue.timeString)
          ) {
            return 'Invalid date or time format'
          }

          // Required but empty
          if (rules?.required && !fieldValue) {
            return 'This field is required'
          }

          return true
        },
      },
    })

    return () => {
      parentFormContext.unregister(name)
    }
    // parentFormContext methods are stable (from react-hook-form)
    // Only name and rules?.required affect registration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, rules?.required])

  // Initialize store from form value only once
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialValue = parentFormContext.getValues(name)
      if (initialValue) {
        // Use the form's initial value
        setFromISOString(initialValue)
        setInitialValue(initialValue)
        // Save initial date for comparison
        const initialDate = new Date(initialValue)
        if (!isNaN(initialDate.getTime())) {
          initialDateRef.current = initialDate
        }
        isInitializedRef.current = true
      }
    }
    // Zustand store functions (setFromISOString, setInitialValue) are stable references
    // and don't need to be in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync form value to store when it changes externally (e.g., from preset)
  useEffect(() => {
    // If we haven't set initial value yet and we receive a form value, use it as initial
    if (!isInitializedRef.current && formValue) {
      setFromISOString(formValue)
      setInitialValue(formValue)
      // Save initial date for comparison
      const initialDate = new Date(formValue)
      if (!isNaN(initialDate.getTime())) {
        initialDateRef.current = initialDate
      }
      isInitializedRef.current = true
      return
    }

    // Skip if this is the initial render
    if (!isInitializedRef.current) return

    const currentISOString = getISOString()

    // Only sync if the form value actually changed from outside
    if (formValue !== currentISOString && formValue) {
      setFromISOString(formValue)
    }
    // Zustand store functions (getISOString, setFromISOString, setInitialValue) are stable references
    // and don't need to be in the dependency array - only formValue changes trigger resync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValue])

  // Update form value and trigger validation
  useEffect(() => {
    // Skip if not initialized
    if (!isInitializedRef.current) return

    // For valid, complete input - update the form value
    if (value.isValid && !value.isPartial) {
      const isoString = getISOString()
      parentFormContext.setValue(name, isoString || '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    }
    // For empty input - clear the form value
    else if (!value.dateString && !value.timeString) {
      parentFormContext.setValue(name, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    }
    // For invalid or partial input - keep existing value but trigger validation
    else {
      parentFormContext.trigger(name)
    }
    // Using getISOString() result as dependency instead of the function itself
    // since Zustand functions are stable but we need to react to value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getISOString()])

  const hasPreset = presetDate && presetLabel && PresetIcon

  const onPresetClick = () => {
    setFromISOString(presetDate!)
    parentFormContext.setValue(name, presetDate!)
  }

  const handleCalendarDateChange = (selectedDate: IsoDateString, close: () => void) => {
    setFromISOString(selectedDate)
    close()
  }

  const handleReset = useCallback(() => {
    resetToInitial()
  }, [resetToInitial])

  // Show reset button when:
  // 1. Current datetime differs from initial datetime (comparing entire date+time), OR
  // 2. Current value is invalid and complete
  const dateTimeHasChanged =
    initialDateRef.current &&
    value.date &&
    value.isValid &&
    !isEqual(initialDateRef.current, value.date)

  const showResetButton =
    dateTimeHasChanged ||
    (!value.isValid && !value.isPartial && (value.dateString || value.timeString))

  // Render reset button (memoized to avoid recreating on every render)
  const resetButtonElement = useMemo(
    () =>
      showResetButton ? (
        <ToolTip
          toolTipContent={t('common.actions.resetToInitial', {
            defaultValue: 'Reset to initial value',
          })}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleReset}
            fullWidth={false}
            shape="circle"
            aria-label={t('common.actions.resetToInitial', {
              defaultValue: 'Reset to initial value',
            })}>
            <LucideIcon icon={RotateCcw} size={16} />
          </Button>
        </ToolTip>
      ) : null,
    [showResetButton, handleReset, t],
  )

  // Call onRenderLabelAction callback to pass reset button to parent
  useEffect(() => {
    if (onRenderLabelAction) {
      onRenderLabelAction(resetButtonElement)
    }
  }, [resetButtonElement, onRenderLabelAction])

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {/* Input fields */}
        <div className="flex items-start gap-2">
          {withDate && (
            <div className="flex items-start gap-2">
              <SegmentedDateInputConnected
                afterSlot={
                  <>
                    <Popover>
                      <PopoverButton
                        as={Button}
                        type="button"
                        variant="neutral"
                        className="px-2"
                        fullWidth={false}
                        join>
                        <LucideIcon icon={CalendarIcon} size={20} />
                      </PopoverButton>
                      <PopoverPanel
                        anchor="bottom start"
                        className="bg-base-100 border-base-300 z-50 w-[360px] rounded-lg border shadow-lg [--anchor-gap:8px]">
                        {({ close }) => (
                          <div className="relative p-4 pr-12">
                            <button
                              onClick={() => close()}
                              className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2"
                              aria-label={t('common.actions.close', { defaultValue: 'Close' })}>
                              <LucideIcon icon={X} size={16} />
                            </button>
                            <CalendarDisplay
                              onChange={(date) => handleCalendarDateChange(date, close)}
                              value={formatISOLocale(value.date || new Date())}
                            />
                          </div>
                        )}
                      </PopoverPanel>
                    </Popover>
                    {/* Show preset button next to date if no time input */}
                    {!withTime && hasPreset && PresetIcon && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={onPresetClick}
                        fullWidth={false}
                        className="p-0"
                        title={presetLabel}
                        aria-label={presetLabel}
                        join>
                        <LucideIcon icon={PresetIcon} size={20} />
                      </Button>
                    )}
                  </>
                }
              />
            </div>
          )}
          {withDate && withTime && <div className="w-2" />}
          {withTime && (
            <SegmentedTimeInputConnected
              afterSlot={
                hasPreset &&
                PresetIcon && (
                  <Button
                    variant="neutral"
                    type="button"
                    onClick={onPresetClick}
                    fullWidth={false}
                    className="px-2"
                    title={presetLabel}
                    aria-label={presetLabel}
                    join>
                    <LucideIcon icon={PresetIcon} size={20} />
                  </Button>
                )
              }
            />
          )}
        </div>

        {/* Error badge */}
        <FormErrorBadge error={parentFormContext.formState.errors[name]} />
      </div>
    </>
  )
}

/**
 * Wrapper component that provides store isolation and handles missing context
 */
const InputDatePickerInner: React.FC<InputDatePickerProps> = (props) => {
  // Create a new store instance for this component
  const store = useMemo(() => createDatePickerStore(), [])

  return (
    <DatePickerStoreContext.Provider value={store}>
      <InputDatePickerInternal {...props} />
    </DatePickerStoreContext.Provider>
  )
}

/**
 * Main component that checks for form context before rendering
 */
export const InputDatePicker: React.FC<InputDatePickerProps> = (props) => {
  const formContext = useFormContext()

  if (!formContext) {
    console.warn('InputDatePicker: No form context available')
    return null
  }

  return <InputDatePickerInner {...props} />
}
