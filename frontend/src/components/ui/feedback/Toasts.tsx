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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { AnimatePresence, m } from 'framer-motion'
import { cn } from 'lib/utils/cn'
import { XIcon } from 'lucide-react'
import React, { useEffect } from 'react'
import { ToastViewType } from 'types/dynamicViews'
import { useIsClient } from 'usehooks-ts'

const ToastItem: React.FC<{ item: ToastViewType }> = ({ item }) => {
  const { removeToast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(item)
    }, item.ttl)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const alertClass = {
    WARNING: 'alert-warning',
    ERROR: 'alert-error',
    NOTIFICATION: 'alert-info',
    SUCCESS: 'alert-success',
  }

  return (
    <div className={cn('alert shadow-lg', alertClass[item.type])} role="alert">
      <span>{item.message}</span>
      <button
        className="btn btn-ghost btn-sm btn-square"
        onClick={() => removeToast(item)}
        aria-label="Close">
        <LucideIcon icon={XIcon} size={16} />
      </button>
    </div>
  )
}

export const Toasts: React.FC = () => {
  const { toastViews } = useToast()
  const isClient = useIsClient()
  if (!isClient) return null

  return (
    <div className="toast toast-end toast-bottom">
      <AnimatePresence mode="sync">
        {toastViews.map((toast) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mb-2">
            <ToastItem item={toast} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
