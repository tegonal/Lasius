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
import { useToast } from 'components/ui/feedback/hooks/useToast'
import React from 'react'

export const ToastDemo: React.FC = () => {
  const { addToast } = useToast()

  const toastExamples = [
    {
      type: 'SUCCESS' as const,
      message: 'Changes saved successfully',
      description: 'Your profile has been updated',
    },
    {
      type: 'ERROR' as const,
      message: 'Failed to save changes',
      description: 'Please check your connection and try again',
    },
    {
      type: 'WARNING' as const,
      message: 'Limited functionality',
      description: 'Some features are disabled in demo mode',
    },
    {
      type: 'NOTIFICATION' as const,
      message: 'New booking created',
      description: 'Project: Internal • 2 hours',
    },
  ]

  const showToast = (example: (typeof toastExamples)[0]) => {
    addToast({
      type: example.type,
      message: example.message,
      description: example.description,
      ttl: 5000,
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {toastExamples.map((example) => (
        <Button
          key={example.type}
          variant={
            example.type === 'SUCCESS'
              ? 'success'
              : example.type === 'ERROR'
                ? 'error'
                : example.type === 'WARNING'
                  ? 'warning'
                  : 'info'
          }
          size="sm"
          onClick={() => showToast(example)}>
          Show {example.type.toLowerCase()} toast
        </Button>
      ))}
    </div>
  )
}
