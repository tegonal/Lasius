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

import { Popover } from '@base-ui/react/popover'
import { CalendarIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { CalendarDisplay } from '~/components/ui/forms/input/calendar/calendar-display'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

type CalendarPopoverProperties = {
  date: Date | null
  onSelect: (date: IsoDateString) => void
}

/** A calendar button that opens a month calendar and closes it after a day is picked. */
export const CalendarPopover = ({ date, onSelect }: CalendarPopoverProperties) => {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const triggerReference = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const handleOpenChange = (isNextOpen: boolean) => {
    // Inside a modal dialog, the portal must render in the dialog focus trap.
    // Decision: rr7-context-menu-popover.
    if (isNextOpen) {
      setContainer(triggerReference.current?.closest<HTMLElement>('[role="dialog"]') ?? null)
    }
    setIsOpen(isNextOpen)
  }

  return (
    <Popover.Root onOpenChange={handleOpenChange} open={isOpen}>
      <Popover.Trigger
        ref={triggerReference}
        render={
          <Button className="px-2" fullWidth={false} join type="button" variant="neutral">
            <LucideIcon icon={CalendarIcon} size={20} />
          </Button>
        }
      />
      {/* Base UI renders no portal for a null container; undefined means document.body. */}
      <Popover.Portal container={container ?? undefined}>
        <Popover.Positioner align="start" className="z-50" side="bottom" sideOffset={8}>
          <Popover.Popup className="bg-base-100 border-base-300 w-[360px] rounded-lg border shadow-lg">
            <div className="relative p-4 pr-12">
              <Popover.Close
                aria-label={t('actions.close', 'Close')}
                className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2">
                <LucideIcon icon={X} size={16} />
              </Popover.Close>
              <CalendarDisplay
                onChange={(selected) => {
                  onSelect(selected)
                  setIsOpen(false)
                }}
                value={formatISOLocale(date || new Date())}
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
