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
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { CalendarDisplay } from 'components/ui/forms/input/calendar/calendarDisplay'
import { useRequiredFormContext } from 'components/ui/forms/WithFormContext'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { formatISOLocale } from 'lib/utils/date/dates'
import { CalendarIcon, LucideIcon as LucideIconType, RotateCcw } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useMemo, useRef } from 'react'
import { useFormContext } from 'react-hook-form'

import { SegmentedDateInputConnected } from './SegmentedDateInputConnected'
import { SegmentedTimeInputConnected } from './SegmentedTimeInputConnected'
import {
  createDatePickerStore,
  DatePickerStoreContext,
  useDatePickerStore,
} from './store/useDatePickerStore'

export type InputDatePicker2Props = {
  name: string
  rules?: any
  withDate?: boolean
  withTime?: boolean
  presetDate?: IsoDateString
  presetLabel?: string
  presetIcon?: LucideIconType
}

/**
 * Internal component that assumes form context is available
 */
const InputDatePicker2Internal: React.FC<InputDatePicker2Props> = ({
  name,
  rules,
  withDate = true,
  withTime = true,
  presetDate,
  presetLabel,
  presetIcon: PresetIcon,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useRequiredFormContext() // Guaranteed non-null
  const { getISOString, setFromISOString, setInitialValue, resetToInitial, value } =
    useDatePickerStore()
  const { modalId, openModal, closeModal } = useModal(`inputDatePicker2-${name}`)
  const isInitializedRef = useRef(false)

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

  const handleCalendarDateChange = (selectedDate: IsoDateString) => {
    setFromISOString(selectedDate)
    closeModal()
  }

  const handleReset = () => {
    resetToInitial()
  }

  // Show reset button when current value is invalid and complete
  const showResetButton =
    !value.isValid && !value.isPartial && (value.dateString || value.timeString)

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {/* Input fields with format hints */}
        <div className="flex items-start gap-2">
          {withDate && (
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1">
                <div className="join">
                  <SegmentedDateInputConnected />
                  <Button
                    type="button"
                    variant="neutral"
                    className="px-2"
                    onClick={openModal}
                    fullWidth={false}>
                    <LucideIcon icon={CalendarIcon} size={20} />
                  </Button>
                  {/* Show preset button next to date if no time input */}
                  {!withTime && hasPreset && PresetIcon && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={onPresetClick}
                      fullWidth={false}
                      className="join-item p-0"
                      title={presetLabel}
                      aria-label={presetLabel}>
                      <LucideIcon icon={PresetIcon} size={20} />
                    </Button>
                  )}
                </div>
                <span className="text-base-content/60 text-xs">
                  {t('common.formats.dateFormat', { defaultValue: 'DD.MM.YYYY' })}
                </span>
              </div>
            </div>
          )}
          {withDate && withTime && <div className="w-2" />}
          {withTime && (
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1">
                <div className={hasPreset ? 'join' : ''}>
                  <SegmentedTimeInputConnected />
                  {hasPreset && PresetIcon && (
                    <Button
                      variant="neutral"
                      type="button"
                      onClick={onPresetClick}
                      fullWidth={false}
                      className="join-item px-2"
                      title={presetLabel}
                      aria-label={presetLabel}>
                      <LucideIcon icon={PresetIcon} size={20} />
                    </Button>
                  )}
                </div>
                <span className="text-base-content/60 text-xs">
                  {t('common.formats.timeFormat', { defaultValue: 'HH:MM' })}
                </span>
              </div>
            </div>
          )}
          {showResetButton && (
            <div className="-my-6">
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
            </div>
          )}
        </div>

        {/* Error badge */}
        <FormErrorBadge error={parentFormContext.formState.errors[name]} />
      </div>

      {/* Calendar Modal */}
      <ModalResponsive autoSize modalId={modalId}>
        <FormBody>
          <FieldSet>
            <FormElement>
              <CalendarDisplay
                onChange={handleCalendarDateChange}
                value={formatISOLocale(value.date || new Date())}
              />
            </FormElement>
          </FieldSet>
          <ButtonGroup>
            <Button variant="secondary" onClick={closeModal}>
              {t('common.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </ButtonGroup>
        </FormBody>
      </ModalResponsive>
    </>
  )
}

/**
 * Wrapper component that provides store isolation and handles missing context
 */
const InputDatePicker2Inner: React.FC<InputDatePicker2Props> = (props) => {
  // Create a new store instance for this component
  const store = useMemo(() => createDatePickerStore(), [])

  return (
    <DatePickerStoreContext.Provider value={store}>
      <InputDatePicker2Internal {...props} />
    </DatePickerStoreContext.Provider>
  )
}

/**
 * Main component that checks for form context before rendering
 */
export const InputDatePicker2: React.FC<InputDatePicker2Props> = (props) => {
  const formContext = useFormContext()

  if (!formContext) {
    console.warn('InputDatePicker2: No form context available')
    return null
  }

  return <InputDatePicker2Inner {...props} />
}
