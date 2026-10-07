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

import { useEffect, useRef, useState } from 'react'

/**
 * The portal container for a Base UI popup: the surrounding dialog, or undefined for document.body.
 * Render `<span className="hidden" ref={anchorReference} />` next to the popup trigger.
 */
export const useDialogPortalContainer = () => {
  const anchorReference = useRef<HTMLSpanElement>(null)
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(null)

  // Inside a modal dialog, the portal must render in the dialog focus trap.
  // Decision: rr7-context-menu-popover.
  useEffect(() => {
    const dialog = anchorReference.current?.closest('[role="dialog"]')
    if (dialog instanceof HTMLElement) {
      setDialogContainer(dialog)
    }
  }, [])

  // Base UI renders no portal for a null container. Pitfall: base-ui-portal-null-container.
  return { anchorReference, container: dialogContainer ?? undefined }
}
