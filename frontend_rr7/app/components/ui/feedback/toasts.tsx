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

import type React from 'react'

import { Toast } from '@base-ui/react/toast'
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { Link } from 'react-router'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cn } from '~/lib/utils/cn'

import { type ToastData, toastManager, type ToastType } from './toast-manager'

const toastConfig: Record<
  ToastType,
  {
    bgColor: string
    borderColor: string
    icon: typeof AlertCircle
    textColor: string
  }
> = {
  ERROR: {
    bgColor: 'bg-error/10',
    borderColor: 'border-error',
    icon: AlertCircle,
    textColor: 'text-error',
  },
  NOTIFICATION: {
    bgColor: 'bg-info/10',
    borderColor: 'border-info',
    icon: Info,
    textColor: 'text-info',
  },
  SUCCESS: {
    bgColor: 'bg-success/10',
    borderColor: 'border-success',
    icon: CheckCircle,
    textColor: 'text-success',
  },
  WARNING: {
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning',
    icon: AlertTriangle,
    textColor: 'text-warning',
  },
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Toast.Provider timeout={5000} toastManager={toastManager}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 left-4 z-[9999] flex flex-col items-center gap-2 md:left-auto md:items-end">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

const ToastList = () => {
  const { toasts } = Toast.useToastManager<ToastData>()

  return toasts.map((toast) => {
    const type = (toast.type as ToastType) || 'NOTIFICATION'
    const config = toastConfig[type]
    const Icon = config.icon
    const action = toast.data?.action

    return (
      <Toast.Root
        className={cn(
          'relative overflow-hidden rounded-lg border shadow-md backdrop-blur-sm',
          'max-w-md min-w-[320px]',
          'transition-all duration-200 ease-out',
          'data-[starting-style]:translate-y-5 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          'data-[ending-style]:translate-y-5 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
          config.bgColor,
          config.borderColor,
        )}
        key={toast.id}
        toast={toast}
      >
        <Toast.Content className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <LucideIcon
              className={cn(
                config.textColor,
                'shrink-0',
                toast.description && 'self-start',
              )}
              icon={Icon}
              size={20}
            />
            <div className="min-w-0 flex-1">
              <Toast.Title className="text-sm leading-5 font-medium" />
              <Toast.Description className="text-base-content/60 mt-0.5 text-xs leading-4" />
            </div>
            <Toast.Close
              aria-label="Close notification"
              className={cn(
                'shrink-0 rounded-md p-1 transition-colors',
                'hover:bg-base-content/10',
                'focus:ring-base-content/20 focus:ring-2 focus:ring-offset-2 focus:outline-none',
              )}
            >
              <LucideIcon className="text-base-content/60" icon={X} size={16} />
            </Toast.Close>
          </div>
          {action && (
            <div className="flex justify-end pl-8">
              <Toast.Close
                render={
                  <Link
                    className={cn(
                      'text-xs font-medium underline transition-colors hover:no-underline',
                      config.textColor,
                    )}
                    to={action.href}
                  />
                }
              >
                {action.label}
              </Toast.Close>
            </div>
          )}
        </Toast.Content>
      </Toast.Root>
    )
  })
}
