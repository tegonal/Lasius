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

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Button } from 'components/primitives/buttons/Button'
import { Heading } from 'components/primitives/typography/Heading'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormElement } from 'components/ui/forms/FormElement'
import { InputDurationStandalone } from 'components/ui/forms/input/datePicker2/InputDurationStandalone'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { round } from 'es-toolkit'
import { cn } from 'lib/utils/cn'
import { ChevronDown, Clock } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

type Props = {
  value: number // decimal hours
  onChange: (hours: number) => void
  disabled?: boolean
  isWeekend?: boolean
  dayName?: string
  orgId?: string
}

const PRESET_HOURS = [
  { label: 'Not set', value: 0 },
  { label: '2 hours', value: 2 },
  { label: '4 hours', value: 4 },
  { label: '6 hours', value: 6 },
  { label: '8 hours', value: 8 },
]

export const TimeDropdownWithModal: React.FC<Props> = ({
  value,
  onChange,
  disabled,
  isWeekend,
  dayName = 'time',
  orgId = 'default',
}) => {
  const { t } = useTranslation('common')
  const { modalId, openModal, closeModal } = useModal(
    `EditWorkingHoursModal-${orgId}-${dayName?.replace(/\s/g, '-')}`,
  )
  const hookForm = useForm()

  useEffect(() => {
    hookForm.setValue('timeValue', value)
  }, [hookForm, value])

  const formatHours = (decimal: number) => {
    if (decimal === 0) return '—'
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const currentDisplay = formatHours(value)

  const handlePresetSelect = (presetValue: number) => {
    onChange(presetValue)
  }

  const handleCustomSubmit = () => {
    const hours = hookForm.getValues().timeValue || 0
    onChange(round(hours, 2))
    closeModal()
  }

  return (
    <>
      <Menu as="div" className="relative inline-block">
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'group hover:bg-base-300 flex items-center justify-between gap-1 px-2 py-1',
            isWeekend && 'opacity-60',
            value === 0 && 'text-base-content/50',
          )}>
          <span className="text-sm">{currentDisplay}</span>
          <LucideIcon icon={ChevronDown} className="opacity-50 group-hover:opacity-100" size={12} />
        </MenuButton>

        <MenuItems className="bg-base-100 border-base-300 absolute left-0 z-[9999] mt-2 w-36 rounded-lg border shadow-lg">
          <div className="p-1">
            <div className="border-base-300 mb-1 border-b pb-1">
              {PRESET_HOURS.map((preset) => (
                <MenuItem key={preset.value}>
                  {({ active }) => (
                    <button
                      onClick={() => handlePresetSelect(preset.value)}
                      className={cn(
                        'flex w-full items-center rounded px-2 py-1.5 text-left text-sm',
                        active && 'bg-base-200',
                        value === preset.value && 'bg-primary/10 font-medium',
                      )}>
                      {preset.label}
                    </button>
                  )}
                </MenuItem>
              ))}
            </div>

            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => openModal()}
                  className={cn(
                    'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm',
                    active && 'bg-base-200',
                  )}>
                  <span>Custom time...</span>
                  <LucideIcon icon={Clock} size={12} />
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      <FormProvider {...hookForm}>
        <ModalResponsive autoSize modalId={modalId}>
          <FieldSet>
            <FormElement>
              <Heading as="h3" variant="section" className="mb-4">
                {t('common.time.setCustom', { defaultValue: 'Set custom time' })}
              </Heading>
            </FormElement>
            <FormElement>
              <div className="time-picker-modal w-full [&_.bg-base-300]:w-full [&_.bg-base-300]:justify-center">
                <InputDurationStandalone name="timeValue" />
              </div>
            </FormElement>
            <FormElement>
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={handleCustomSubmit} className="w-full">
                  {t('common.actions.save', { defaultValue: 'Save' })}
                </Button>
                <Button variant="secondary" onClick={closeModal} className="w-full">
                  {t('common.actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
              </div>
            </FormElement>
          </FieldSet>
        </ModalResponsive>
      </FormProvider>
    </>
  )
}
