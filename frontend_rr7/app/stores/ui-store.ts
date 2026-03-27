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

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type BackendConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'

interface ToastViewType {
  [key: string]: unknown
  id: string
  ttl?: number
}

interface UIStore {
  addToast: (toast: ToastViewType) => void
  // Backend health state (written by useHealthMonitor, read by BackendStatus indicator)
  backendStatus: BackendConnectionStatus
  clearToasts: () => void
  // Global loading state
  globalLoading: boolean
  removeToast: (id: string) => void
  setBackendStatus: (status: BackendConnectionStatus) => void
  setGlobalLoading: (isLoading: boolean) => void
  // Session expiry state (written by TokenWatcher, read by DevInfoBadge)
  setTokenExpiresAt: (expiresAt: null | number) => void
  setVersionDrift: (drift: boolean) => void
  // Stats tile display preferences
  statsTileTimeAsDecimals: boolean
  // Toast state
  toastViews: ToastViewType[]
  toggleStatsTileTimeAsDecimals: () => void
  // Session token expiry timestamp (epoch ms), null when unknown
  tokenExpiresAt: null | number
  // Version drift state (written by useHealthMonitor, read by HealthMonitor component)
  versionDrift: boolean
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set) => ({
        addToast: (toast) =>
          set((state) => {
            const toastWithId = {
              ...toast,
              id: toast.id || `toast-${Date.now()}-${Math.random()}`,
            }
            state.toastViews.push(toastWithId)

            if (toast.ttl) {
              setTimeout(() => {
                useUIStore.getState().removeToast(toastWithId.id)
              }, toast.ttl)
            }
          }),
        // Backend health state
        backendStatus: 'connecting' as BackendConnectionStatus,
        clearToasts: () =>
          set((state) => {
            state.toastViews = []
          }),
        // Global loading state
        globalLoading: false,
        removeToast: (id) =>
          set((state) => {
            state.toastViews = state.toastViews.filter((t) => t.id !== id)
          }),
        setBackendStatus: (status) =>
          set((state) => {
            state.backendStatus = status
          }),
        setGlobalLoading: (isLoading) =>
          set((state) => {
            state.globalLoading = isLoading
          }),
        setTokenExpiresAt: (expiresAt) =>
          set((state) => {
            state.tokenExpiresAt = expiresAt
          }),
        setVersionDrift: (drift) =>
          set((state) => {
            state.versionDrift = drift
          }),
        // Stats tile display preferences
        statsTileTimeAsDecimals: false,
        // Toast state
        toastViews: [],
        toggleStatsTileTimeAsDecimals: () =>
          set((state) => {
            state.statsTileTimeAsDecimals = !state.statsTileTimeAsDecimals
          }),
        // Session token expiry
        tokenExpiresAt: null,
        // Version drift state
        versionDrift: false,
      })),
      {
        name: 'lasius-ui-store',
        partialize: (state) => ({
          statsTileTimeAsDecimals: state.statsTileTimeAsDecimals,
        }),
      },
    ),
    {
      name: 'lasius-ui-store-devtools',
    },
  ),
)

// Selector hooks for performance optimization
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)
export const useStatsTileTimeAsDecimals = () =>
  useUIStore((state) => state.statsTileTimeAsDecimals)
export const useBackendStatus = () => useUIStore((state) => state.backendStatus)
export const useTokenExpiresAt = () =>
  useUIStore((state) => state.tokenExpiresAt)
export const useVersionDrift = () => useUIStore((state) => state.versionDrift)
