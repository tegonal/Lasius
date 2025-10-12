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
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ToastViewType } from 'types/dynamicViews'
import { useIsClient } from 'usehooks-ts'

const ToastItem: React.FC<{ item: ToastViewType }> = ({ item }) => {
  const { removeToast } = useToast()
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Use default TTL of 5000ms if not specified
    const ttl = item.ttl || 5000
    const interval = 10 // Update every 10ms for smooth animation
    const decrement = (100 * interval) / ttl

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement
        if (next <= 0) {
          clearInterval(progressTimer)
          return 0
        }
        return next
      })
    }, interval)

    const removeTimer = setTimeout(() => {
      removeToast(item)
    }, ttl)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(removeTimer)
    }
  }, [item, removeToast])

  const toastConfig = {
    WARNING: {
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning',
      textColor: 'text-warning',
      icon: AlertTriangle,
    },
    ERROR: {
      bgColor: 'bg-error/10',
      borderColor: 'border-error',
      textColor: 'text-error',
      icon: AlertCircle,
    },
    NOTIFICATION: {
      bgColor: 'bg-info/10',
      borderColor: 'border-info',
      textColor: 'text-info',
      icon: Info,
    },
    SUCCESS: {
      bgColor: 'bg-success/10',
      borderColor: 'border-success',
      textColor: 'text-success',
      icon: CheckCircle,
    },
  }

  const config = toastConfig[item.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border shadow-md backdrop-blur-sm',
        config.bgColor,
        config.borderColor,
      )}
      role="alert">
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <LucideIcon
            icon={Icon}
            size={20}
            className={cn(config.textColor, 'flex-shrink-0', item.description && 'self-start')}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-5 font-medium">{item.message}</p>
            {item.description && (
              <p className="text-base-content/60 mt-0.5 text-xs leading-4">{item.description}</p>
            )}
          </div>
          <button
            className={cn(
              'hover:bg-base-content/10 flex-shrink-0 rounded-md p-1 transition-colors',
              'focus:ring-base-content/20 focus:ring-2 focus:ring-offset-2 focus:outline-none',
            )}
            onClick={() => removeToast(item)}
            aria-label="Close notification">
            <LucideIcon icon={X} size={16} className="text-base-content/60" />
          </button>
        </div>
        {item.action && (
          <div className="flex justify-end pl-8">
            <Link
              href={item.action.href}
              className={cn(
                'text-xs font-medium underline transition-colors hover:no-underline',
                config.textColor,
              )}
              onClick={() => removeToast(item)}>
              {item.action.label}
            </Link>
          </div>
        )}
      </div>
      <div className="bg-base-content/10 absolute bottom-0 left-0 h-0.5">
        <div
          className={cn('h-full transition-all duration-100 ease-linear', config.bgColor)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export const Toasts: React.FC = () => {
  const { toastViews } = useToast()
  const isClient = useIsClient()
  if (!isClient) return null

  return (
    <div className="toast toast-end toast-bottom z-[9999]">
      <AnimatePresence mode="sync">
        {toastViews.map((toast) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-2 max-w-md min-w-[320px]">
            <ToastItem item={toast} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
