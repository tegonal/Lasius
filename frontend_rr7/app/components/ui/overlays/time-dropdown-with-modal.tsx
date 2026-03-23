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

import { Menu } from '@base-ui/react/menu'
import { round } from 'es-toolkit'
import { ChevronDown, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Heading } from '~/components/primitives/typography/heading'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormElement } from '~/components/ui/forms/form-element'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { cn } from '~/lib/utils/cn'

type Props = {
  dayName?: string
  disabled?: boolean
  isWeekend?: boolean
  onChange: (hours: number) => void
  orgId?: string
  value: number
}

const PRESET_HOURS = [
  { label: 'Not set', value: 0 },
  { label: '2 hours', value: 2 },
  { label: '4 hours', value: 4 },
  { label: '6 hours', value: 6 },
  { label: '8 hours', value: 8 },
]

const formatHours = (decimal: number) => {
  if (decimal === 0) return '\u2014'
  const hours = Math.floor(decimal)
  const minutes = Math.round((decimal - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const TimeDropdownWithModal = ({
  dayName: _dayName = 'time',
  disabled,
  isWeekend,
  onChange,
  orgId: _orgId = 'default',
  value,
}: Props) => {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [customHours, setCustomHours] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(0)

  const handleClose = () => setIsOpen(false)

  useEffect(() => {
    setCustomHours(Math.floor(value))
    setCustomMinutes(Math.round((value % 1) * 60))
  }, [value])

  const currentDisplay = formatHours(value)

  const handlePresetSelect = (presetValue: number) => {
    onChange(presetValue)
  }

  const handleCustomSubmit = () => {
    const decimalHours = customHours + customMinutes / 60
    onChange(round(decimalHours, 2))
    handleClose()
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className={cn(
            'btn btn-ghost btn-sm group flex items-center justify-between gap-1 px-2 py-1',
            'hover:bg-base-300',
            isWeekend && 'opacity-60',
            value === 0 && 'text-base-content/50',
          )}
          disabled={disabled}
        >
          <span className="text-sm">{currentDisplay}</span>
          <LucideIcon
            className="opacity-50 group-hover:opacity-100"
            icon={ChevronDown}
            size={12}
          />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner sideOffset={4}>
            <Menu.Popup className="bg-base-100 border-base-300 w-36 rounded-lg border p-1 shadow-lg">
              <div className="border-base-300 mb-1 border-b pb-1">
                {PRESET_HOURS.map((preset) => (
                  <Menu.Item
                    className={cn(
                      'flex w-full items-center rounded px-2 py-1.5 text-left text-sm',
                      'hover:bg-base-200 data-[highlighted]:bg-base-200 cursor-pointer',
                      value === preset.value && 'bg-primary/10 font-medium',
                    )}
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset.value)}
                  >
                    {preset.label}
                  </Menu.Item>
                ))}
              </div>

              <Menu.Item
                className={cn(
                  'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm',
                  'hover:bg-base-200 data-[highlighted]:bg-base-200 cursor-pointer',
                )}
                onClick={() => setIsOpen(true)}
              >
                <span>
                  {t('common.time.customTime', {
                    defaultValue: 'Custom time...',
                  })}
                </span>
                <LucideIcon icon={Clock} size={12} />
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Modal autoSize onClose={handleClose} open={isOpen}>
        <FieldSet>
          <FormElement>
            <Heading as="h3" className="mb-4" variant="section">
              {t('common.time.setCustom', {
                defaultValue: 'Set custom time',
              })}
            </Heading>
          </FormElement>
          <FormElement>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <label className="text-base-content/70 mb-1 text-xs">
                  {t('common.time.hours', { defaultValue: 'Hours' })}
                </label>
                <input
                  className="input input-bordered w-20 text-center"
                  max={24}
                  min={0}
                  onChange={(e) =>
                    setCustomHours(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  type="number"
                  value={customHours}
                />
              </div>
              <span className="mt-5 text-xl font-bold">:</span>
              <div className="flex flex-col items-center">
                <label className="text-base-content/70 mb-1 text-xs">
                  {t('common.time.minutes', { defaultValue: 'Minutes' })}
                </label>
                <input
                  className="input input-bordered w-20 text-center"
                  max={59}
                  min={0}
                  onChange={(e) =>
                    setCustomMinutes(
                      Math.max(0, Math.min(59, parseInt(e.target.value) || 0)),
                    )
                  }
                  type="number"
                  value={customMinutes}
                />
              </div>
            </div>
          </FormElement>
          <FormElement>
            <div className="mt-4 flex flex-col gap-2">
              <Button className="w-full" onClick={handleCustomSubmit}>
                {t('common.actions.save', { defaultValue: 'Save' })}
              </Button>
              <Button
                className="w-full"
                onClick={handleClose}
                variant="secondary"
              >
                {t('common.actions.close', { defaultValue: 'Close' })}
              </Button>
            </div>
          </FormElement>
        </FieldSet>
      </Modal>
    </>
  )
}
