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

/* eslint-disable react-compiler/react-compiler -- Form integration effects have intentionally partial deps */
import { type FieldMetadata, useInputControl } from '@conform-to/react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { isEqual } from 'date-fns'
import {
  CalendarIcon,
  type LucideIcon as LucideIconType,
  RotateCcw,
  X,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { CalendarDisplay } from '~/components/ui/forms/input/calendar/calendar-display'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

import { SegmentedDateInputConnected } from './segmented-date-input-connected'
import { SegmentedTimeInputConnected } from './segmented-time-input-connected'
import {
  createDatePickerStore,
  DatePickerStoreContext,
  useDatePickerStore,
} from './store/use-date-picker-store'

export type InputDatePickerProps = {
  field: FieldMetadata<string>
  onRenderLabelAction?: (resetButton: React.ReactNode) => void
  presetDate?: IsoDateString
  presetIcon?: LucideIconType
  presetLabel?: string
  withDate?: boolean
  withTime?: boolean
}

export const InputDatePicker = (props: InputDatePickerProps) => {
  const store = useMemo(() => createDatePickerStore(), [])

  return (
    <DatePickerStoreContext.Provider value={store}>
      <ConformDatePickerBridge {...props} />
    </DatePickerStoreContext.Provider>
  )
}

const ConformDatePickerBridge = ({
  field,
  onRenderLabelAction,
  presetDate,
  presetIcon,
  presetLabel,
  withDate = true,
  withTime = true,
}: InputDatePickerProps) => {
  const control = useInputControl(field)
  const {
    getISOString,
    resetToInitial,
    setFromISOString,
    setInitialValue,
    value,
  } = useDatePickerStore()
  const isInitializedRef = useRef(false)
  const initialDateRef = useRef<Date | null>(null)

  // Initialize store from field value only once
  useEffect(() => {
    if (!isInitializedRef.current && control.value) {
      setFromISOString(control.value)
      setInitialValue(control.value)
      const initialDate = new Date(control.value)
      if (!Number.isNaN(initialDate.getTime())) {
        initialDateRef.current = initialDate
      }
      isInitializedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control.value])

  // Sync external field value changes to store
  useEffect(() => {
    if (!isInitializedRef.current) return
    const currentISOString = getISOString()
    if (control.value !== currentISOString && control.value) {
      setFromISOString(control.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control.value])

  // Update field value when store produces a valid date
  useEffect(() => {
    if (!isInitializedRef.current) return

    if (value.isValid && !value.isPartial) {
      const isoString = getISOString()
      control.change(isoString || '')
    } else if (!value.dateString && !value.timeString) {
      control.change('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getISOString()])

  const handlePresetClick = () => {
    if (presetDate) {
      setFromISOString(presetDate)
      control.change(presetDate)
    }
  }

  return (
    <>
      <input name={field.name} type="hidden" value={control.value ?? ''} />
      <DatePickerUI
        initialDateRef={initialDateRef}
        onPresetClick={handlePresetClick}
        onRenderLabelAction={onRenderLabelAction}
        presetDate={presetDate}
        presetIcon={presetIcon}
        presetLabel={presetLabel}
        resetToInitial={resetToInitial}
        value={value}
        withDate={withDate}
        withTime={withTime}
      />
      <FormFieldErrors errors={field.errors} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Shared UI (pure presentation)
// ---------------------------------------------------------------------------

type DatePickerUIProps = SharedPickerProps & {
  initialDateRef: React.RefObject<Date | null>
  onPresetClick: () => void
  resetToInitial: () => void
  value: {
    date: Date | null
    dateString: string
    isPartial: boolean
    isValid: boolean
    timeString: string
  }
}

type SharedPickerProps = {
  onRenderLabelAction?: (resetButton: React.ReactNode) => void
  presetDate?: IsoDateString
  presetIcon?: LucideIconType
  presetLabel?: string
  withDate?: boolean
  withTime?: boolean
}

const DatePickerUI = ({
  initialDateRef,
  onPresetClick,
  onRenderLabelAction,
  presetDate,
  presetIcon: PresetIcon,
  presetLabel,
  resetToInitial,
  value,
  withDate = true,
  withTime = true,
}: DatePickerUIProps) => {
  const { t } = useTranslation('common')
  const { setFromISOString } = useDatePickerStore()

  const hasPreset = presetDate && presetLabel && PresetIcon

  const handleCalendarDateChange = (
    selectedDate: IsoDateString,
    close: () => void,
  ) => {
    setFromISOString(selectedDate)
    close()
  }

  const handleReset = useCallback(() => {
    resetToInitial()
  }, [resetToInitial])

  const dateTimeHasChanged =
    initialDateRef.current &&
    value.date &&
    value.isValid &&
    !isEqual(initialDateRef.current, value.date)

  const showResetButton =
    dateTimeHasChanged ||
    (!value.isValid &&
      !value.isPartial &&
      (value.dateString || value.timeString))

  const resetButtonElement = useMemo(
    () =>
      showResetButton ? (
        <Button
          aria-label={t('actions.resetToInitial', 'Reset to initial value')}
          fullWidth={false}
          onClick={handleReset}
          shape="circle"
          size="sm"
          title={t('actions.resetToInitial', 'Reset to initial value')}
          type="button"
          variant="ghost"
        >
          <LucideIcon icon={RotateCcw} size={16} />
        </Button>
      ) : null,
    [showResetButton, handleReset, t],
  )

  useEffect(() => {
    if (onRenderLabelAction) {
      onRenderLabelAction(resetButtonElement)
    }
  }, [resetButtonElement, onRenderLabelAction])

  return (
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
                      className="px-2"
                      fullWidth={false}
                      join
                      type="button"
                      variant="neutral"
                    >
                      <LucideIcon icon={CalendarIcon} size={20} />
                    </PopoverButton>
                    <PopoverPanel
                      anchor="bottom start"
                      className="bg-base-100 border-base-300 z-50 w-[360px] rounded-lg border shadow-lg [--anchor-gap:8px]"
                    >
                      {({ close }) => (
                        <div className="relative p-4 pr-12">
                          <button
                            aria-label={t('actions.close', 'Close')}
                            className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2"
                            onClick={() => close()}
                          >
                            <LucideIcon icon={X} size={16} />
                          </button>
                          <CalendarDisplay
                            onChange={(date) =>
                              handleCalendarDateChange(date, close)
                            }
                            value={formatISOLocale(value.date || new Date())}
                          />
                        </div>
                      )}
                    </PopoverPanel>
                  </Popover>
                  {/* Show preset button next to date if no time input */}
                  {!withTime && hasPreset && PresetIcon && (
                    <Button
                      aria-label={presetLabel}
                      className="p-0"
                      fullWidth={false}
                      join
                      onClick={onPresetClick}
                      size="sm"
                      title={presetLabel}
                      type="button"
                      variant="ghost"
                    >
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
                  aria-label={presetLabel}
                  className="px-2"
                  fullWidth={false}
                  join
                  onClick={onPresetClick}
                  title={presetLabel}
                  type="button"
                  variant="neutral"
                >
                  <LucideIcon icon={PresetIcon} size={20} />
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}
