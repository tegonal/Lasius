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

import { type FieldMetadata } from '@conform-to/react'
import { type LucideIcon as LucideIconType, RotateCcw } from 'lucide-react'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type IsoDateString } from '~/lib/utils/dates'

import { CalendarPopover } from './calendar-popover'
import { type DatePreset, PresetButton } from './preset-button'
import { SegmentedDateInputConnected } from './segmented-date-input-connected'
import { SegmentedTimeInputConnected } from './segmented-time-input-connected'
import { getDatePickerLayout } from './shared/date-picker-layout'
import { type ResetCheckValue, shouldShowResetButton } from './shared/reset-visibility'
import {
  createDatePickerStore,
  DatePickerStoreContext,
  useDatePickerStore,
} from './store/use-date-picker-store'

export type InputDatePickerProperties = {
  field: FieldMetadata<string>
  onChange?: (isoString: string) => void
  onRenderLabelAction?: (resetButton: React.ReactNode) => void
  presetDate?: IsoDateString
  presetIcon?: LucideIconType
  presetLabel?: string
  value?: string
  withDate?: boolean
  withTime?: boolean
}

export const InputDatePicker = (properties: InputDatePickerProperties) => {
  const store = useMemo(() => createDatePickerStore(), [])

  return (
    <DatePickerStoreContext.Provider value={store}>
      <DatePickerBridge {...properties} />
    </DatePickerStoreContext.Provider>
  )
}

const DatePickerBridge = ({
  field,
  onChange,
  onRenderLabelAction,
  presetDate,
  presetIcon,
  presetLabel,
  value: externalValue,
  withDate = true,
  withTime = true,
}: InputDatePickerProperties) => {
  const { getISOString, resetToInitial, setFromISOString, setInitialValue, value } =
    useDatePickerStore()
  const isInitializedReference = useRef(false)

  // The effective value — from parent's useInputControl or fall back to field default
  const fieldValue = externalValue ?? ''

  // Initialize store from field value only once
  useEffect(() => {
    if (isInitializedReference.current || !fieldValue) return
    setFromISOString(fieldValue)
    setInitialValue(fieldValue)
    isInitializedReference.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValue])

  // Sync external value changes to store (e.g. duration changed the end time)
  useEffect(() => {
    if (!isInitializedReference.current) return
    const currentISOString = getISOString()
    if (fieldValue !== currentISOString && fieldValue) {
      setFromISOString(fieldValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValue])

  // Update parent when store produces a valid date
  useEffect(() => {
    if (!isInitializedReference.current) return

    if (value.isValid && !value.isPartial) {
      const isoString = getISOString()
      if (isoString && onChange) {
        onChange(isoString)
      }
    } else if (!value.dateString && !value.timeString) {
      onChange?.('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getISOString()])

  const handlePresetClick = () => {
    if (!presetDate) {
      return
    }

    setFromISOString(presetDate)
    onChange?.(presetDate)
  }

  return (
    <>
      <input name={field.name} type="hidden" value={fieldValue} />
      <DatePickerUI
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

type DatePickerUIProperties = {
  onPresetClick: () => void
  onRenderLabelAction?: (resetButton: React.ReactNode) => void
  presetDate?: IsoDateString
  presetIcon?: LucideIconType
  presetLabel?: string
  resetToInitial: () => void
  value: ResetCheckValue
  withDate?: boolean
  withTime?: boolean
}

const DatePickerUI = ({
  onPresetClick,
  onRenderLabelAction,
  presetDate,
  presetIcon,
  presetLabel,
  resetToInitial,
  value,
  withDate = true,
  withTime = true,
}: DatePickerUIProperties) => {
  const { initialValue, setFromISOString } = useDatePickerStore()
  const layout = getDatePickerLayout({ presetDate, presetIcon, presetLabel, withDate, withTime })

  useResetLabelAction(
    shouldShowResetButton(initialValue.date, value),
    resetToInitial,
    onRenderLabelAction,
  )

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-start gap-2">
        {layout.showDate && (
          <DateField
            date={value.date}
            onPresetClick={onPresetClick}
            onSelect={setFromISOString}
            preset={layout.datePreset}
          />
        )}
        {layout.showSpacer && <div className="w-2" />}
        {layout.showTime && <TimeField onPresetClick={onPresetClick} preset={layout.timePreset} />}
      </div>
    </div>
  )
}

// Hands the reset button to the label of the form field, or null when the value is unchanged.
const useResetLabelAction = (
  isShowResetButton: boolean,
  resetToInitial: () => void,
  onRenderLabelAction?: (resetButton: React.ReactNode) => void,
) => {
  const { t } = useTranslation('common')
  const resetButtonElement = useMemo(
    () =>
      isShowResetButton ? (
        <Button
          aria-label={t('actions.resetToInitial', 'Reset to initial value')}
          fullWidth={false}
          onClick={resetToInitial}
          shape="circle"
          size="sm"
          title={t('actions.resetToInitial', 'Reset to initial value')}
          type="button"
          variant="ghost">
          <LucideIcon icon={RotateCcw} size={16} />
        </Button>
      ) : null,
    [isShowResetButton, resetToInitial, t],
  )

  useEffect(() => {
    onRenderLabelAction?.(resetButtonElement)
  }, [resetButtonElement, onRenderLabelAction])
}

const DateField = ({
  date,
  onPresetClick,
  onSelect,
  preset,
}: {
  date: Date | null
  onPresetClick: () => void
  onSelect: (isoString: string) => void
  preset: DatePreset | null
}) => (
  <div className="flex items-start gap-2">
    <SegmentedDateInputConnected
      afterSlot={
        <>
          <CalendarPopover date={date} onSelect={onSelect} />
          {preset && <PresetButton compact onClick={onPresetClick} preset={preset} />}
        </>
      }
    />
  </div>
)

const TimeField = ({
  onPresetClick,
  preset,
}: {
  onPresetClick: () => void
  preset: DatePreset | null
}) => (
  <SegmentedTimeInputConnected
    afterSlot={preset && <PresetButton onClick={onPresetClick} preset={preset} />}
  />
)
