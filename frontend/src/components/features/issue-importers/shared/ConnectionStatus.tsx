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

import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import React from 'react'

type ConnectionStatusType = 'success' | 'error' | 'testing' | 'idle'

type Props = {
  status: ConnectionStatusType
  message?: string
}

export const ConnectionStatus: React.FC<Props> = ({ status, message }) => {
  if (status === 'idle') return null

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-success h-5 w-5" />
      case 'error':
        return <XCircle className="text-error h-5 w-5" />
      case 'testing':
        return <Loader2 className="text-info h-5 w-5 animate-spin" />
    }
  }

  const getStatusClass = () => {
    switch (status) {
      case 'success':
        return 'alert-success'
      case 'error':
        return 'alert-error'
      case 'testing':
        return 'alert-info'
    }
  }

  return (
    <div className={`alert ${getStatusClass()} mt-4`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span>{message}</span>
      </div>
    </div>
  )
}
