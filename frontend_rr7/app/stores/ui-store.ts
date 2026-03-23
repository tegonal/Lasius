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

import { useMemo } from 'react'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { logger } from '~/lib/logger'

export type BackendConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'

interface ExplosionEvent {
  id: string
  timestamp: number
  x: number
  y: number
}

interface TabViewType {
  activeIndex: number
  id: string
}

interface ToastViewType {
  [key: string]: unknown
  id: string
  ttl?: number
}

interface UIStore {
  addToast: (toast: ToastViewType) => void
  // Backend health state (written by useHealthMonitor, read by BackendStatus indicator)
  backendStatus: BackendConnectionStatus
  clearExplosion: () => void
  clearTabs: () => void

  clearToasts: () => void
  closeContextMenu: () => void
  // Context Menu state
  contextMenuOpen: string
  // Explosion state
  explosionEvent: ExplosionEvent | null

  // Global loading state
  globalLoading: boolean
  globalLoadingCounter: number
  hideGlobalLoading: () => void
  removeTab: (id: string) => void

  removeToast: (id: string) => void
  setBackendStatus: (status: BackendConnectionStatus) => void
  setContextMenuOpen: (id: string) => void
  setGlobalLoading: (isLoading: boolean) => void
  setTabActive: (id: string, activeIndex: number) => void
  setVersionDrift: (drift: boolean) => void
  showGlobalLoading: () => void

  // Stats tile display preferences
  statsTileTimeAsDecimals: boolean
  // Tab state
  tabViews: TabViewType[]

  // Toast state
  toastViews: ToastViewType[]
  toggleStatsTileTimeAsDecimals: () => void
  triggerExplosion: (x: number, y: number) => void
  // Version drift state (written by useHealthMonitor, read by HealthMonitor component)
  versionDrift: boolean
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector(
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
          clearExplosion: () =>
            set((state) => {
              state.explosionEvent = null
            }),
          clearTabs: () =>
            set((state) => {
              state.tabViews = []
            }),

          clearToasts: () =>
            set((state) => {
              state.toastViews = []
            }),
          closeContextMenu: () =>
            set((state) => {
              state.contextMenuOpen = ''
            }),
          // Context Menu state
          contextMenuOpen: '',
          // Explosion state
          explosionEvent: null,

          // Global loading state
          globalLoading: false,
          globalLoadingCounter: 0,
          hideGlobalLoading: () =>
            set((state) => {
              state.globalLoadingCounter -= 1

              if (state.globalLoadingCounter < 0) {
                logger.info(
                  '[UIStore] globalLoadingCounter went negative. This indicates mismatched show/hide calls. Resetting to 0.',
                  {
                    counter: state.globalLoadingCounter,
                  },
                )
                state.globalLoadingCounter = 0
              }

              if (
                state.globalLoadingCounter > 0 &&
                state.globalLoadingCounter <= 3
              ) {
                setTimeout(() => {
                  const currentCounter =
                    useUIStore.getState().globalLoadingCounter
                  if (currentCounter > 0 && currentCounter <= 3) {
                    logger.info(
                      '[UIStore] globalLoadingCounter appears stuck. Auto-resetting after timeout.',
                      { counter: currentCounter },
                    )
                    useUIStore.getState().setGlobalLoading(false)
                  }
                }, 30000)
              }

              state.globalLoading = state.globalLoadingCounter > 0
            }),
          removeTab: (id) =>
            set((state) => {
              state.tabViews = state.tabViews.filter((t) => t.id !== id)
            }),

          removeToast: (id) =>
            set((state) => {
              state.toastViews = state.toastViews.filter((t) => t.id !== id)
            }),
          setBackendStatus: (status) =>
            set((state) => {
              state.backendStatus = status
            }),
          setContextMenuOpen: (id) =>
            set((state) => {
              state.contextMenuOpen = id
            }),
          setGlobalLoading: (isLoading) =>
            set((state) => {
              state.globalLoading = isLoading
              if (!isLoading) {
                state.globalLoadingCounter = 0
              }
            }),
          setTabActive: (id, activeIndex) =>
            set((state) => {
              const existingTab = state.tabViews.find((t) => t.id === id)
              if (existingTab) {
                existingTab.activeIndex = activeIndex
              } else {
                state.tabViews.push({ activeIndex, id })
              }
            }),

          setVersionDrift: (drift) =>
            set((state) => {
              state.versionDrift = drift
            }),
          showGlobalLoading: () =>
            set((state) => {
              state.globalLoadingCounter += 1
              state.globalLoading = true
            }),

          // Stats tile display preferences
          statsTileTimeAsDecimals: false,
          // Tab state
          tabViews: [],

          // Toast state
          toastViews: [],
          toggleStatsTileTimeAsDecimals: () =>
            set((state) => {
              state.statsTileTimeAsDecimals = !state.statsTileTimeAsDecimals
            }),
          triggerExplosion: (x, y) =>
            set((state) => {
              state.explosionEvent = {
                id: `explosion-${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                x,
                y,
              }
            }),
          // Version drift state
          versionDrift: false,
        })),
      ),
      {
        name: 'lasius-ui-store',
        partialize: (state) => ({
          statsTileTimeAsDecimals: state.statsTileTimeAsDecimals,
          tabViews: state.tabViews,
        }),
      },
    ),
    {
      name: 'lasius-ui-store-devtools',
    },
  ),
)

// Selector hooks for performance optimization
export const useContextMenuOpen = () =>
  useUIStore((state) => state.contextMenuOpen)
export const useToastViews = () => useUIStore((state) => state.toastViews)
export const useTabViews = () => useUIStore((state) => state.tabViews)
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)
export const useStatsTileTimeAsDecimals = () =>
  useUIStore((state) => state.statsTileTimeAsDecimals)
export const useExplosionEvent = () =>
  useUIStore((state) => state.explosionEvent)
export const useBackendStatus = () => useUIStore((state) => state.backendStatus)
export const useVersionDrift = () => useUIStore((state) => state.versionDrift)

// Action hooks — actions are stable Zustand references, so useMemo with
// them as deps produces a stable object that never triggers re-renders.
export const useUIActions = () => {
  const addToast = useUIStore((state) => state.addToast)
  const clearExplosion = useUIStore((state) => state.clearExplosion)
  const closeContextMenu = useUIStore((state) => state.closeContextMenu)
  const hideGlobalLoading = useUIStore((state) => state.hideGlobalLoading)
  const removeToast = useUIStore((state) => state.removeToast)
  const setContextMenuOpen = useUIStore((state) => state.setContextMenuOpen)
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading)
  const setTabActive = useUIStore((state) => state.setTabActive)
  const showGlobalLoading = useUIStore((state) => state.showGlobalLoading)
  const toggleStatsTileTimeAsDecimals = useUIStore(
    (state) => state.toggleStatsTileTimeAsDecimals,
  )
  const triggerExplosion = useUIStore((state) => state.triggerExplosion)

  return useMemo(
    () => ({
      addToast,
      clearExplosion,
      closeContextMenu,
      hideGlobalLoading,
      removeToast,
      setContextMenuOpen,
      setGlobalLoading,
      setTabActive,
      showGlobalLoading,
      toggleStatsTileTimeAsDecimals,
      triggerExplosion,
    }),
    [
      addToast,
      clearExplosion,
      closeContextMenu,
      hideGlobalLoading,
      removeToast,
      setContextMenuOpen,
      setGlobalLoading,
      setTabActive,
      showGlobalLoading,
      toggleStatsTileTimeAsDecimals,
      triggerExplosion,
    ],
  )
}
