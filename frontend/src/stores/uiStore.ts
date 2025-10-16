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

import { logger } from 'lib/logger'
import { TabViewType, ToastViewType } from 'types/dynamicViews'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface ExplosionEvent {
  id: string
  x: number
  y: number
  timestamp: number
}

interface UIStore {
  // Context Menu state
  contextMenuOpen: string
  setContextMenuOpen: (id: string) => void
  closeContextMenu: () => void

  // Toast state
  toastViews: ToastViewType[]
  addToast: (toast: ToastViewType) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Tab state
  tabViews: TabViewType[]
  setTabActive: (id: string, activeIndex: number) => void
  removeTab: (id: string) => void
  clearTabs: () => void

  // Global loading state
  globalLoading: boolean
  globalLoadingCounter: number
  setGlobalLoading: (isLoading: boolean) => void
  showGlobalLoading: () => void
  hideGlobalLoading: () => void

  // Stats tile display preferences
  statsTileTimeAsDecimals: boolean
  toggleStatsTileTimeAsDecimals: () => void

  // Explosion state
  explosionEvent: ExplosionEvent | null
  triggerExplosion: (x: number, y: number) => void
  clearExplosion: () => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          // Context Menu state
          contextMenuOpen: '',
          setContextMenuOpen: (id) =>
            set((state) => {
              state.contextMenuOpen = id
            }),
          closeContextMenu: () =>
            set((state) => {
              state.contextMenuOpen = ''
            }),

          // Toast state
          toastViews: [],
          addToast: (toast) =>
            set((state) => {
              // Auto-generate ID if not provided
              const toastWithId = {
                ...toast,
                id: toast.id || `toast-${Date.now()}-${Math.random()}`,
              }
              state.toastViews.push(toastWithId)

              // Auto-remove toast after TTL if specified
              if (toast.ttl) {
                setTimeout(() => {
                  useUIStore.getState().removeToast(toastWithId.id)
                }, toast.ttl)
              }
            }),
          removeToast: (id) =>
            set((state) => {
              state.toastViews = state.toastViews.filter((t) => t.id !== id)
            }),
          clearToasts: () =>
            set((state) => {
              state.toastViews = []
            }),

          // Tab state
          tabViews: [],
          setTabActive: (id, activeIndex) =>
            set((state) => {
              const existingTab = state.tabViews.find((t) => t.id === id)
              if (existingTab) {
                existingTab.activeIndex = activeIndex
              } else {
                state.tabViews.push({ id, activeIndex })
              }
            }),
          removeTab: (id) =>
            set((state) => {
              state.tabViews = state.tabViews.filter((t) => t.id !== id)
            }),
          clearTabs: () =>
            set((state) => {
              state.tabViews = []
            }),

          // Global loading state
          globalLoading: false,
          globalLoadingCounter: 0,
          setGlobalLoading: (isLoading) =>
            set((state) => {
              state.globalLoading = isLoading
              // Reset counter when explicitly setting to false
              if (!isLoading) {
                state.globalLoadingCounter = 0
              }
            }),
          showGlobalLoading: () =>
            set((state) => {
              state.globalLoadingCounter += 1
              state.globalLoading = true
            }),
          hideGlobalLoading: () =>
            set((state) => {
              state.globalLoadingCounter -= 1

              // Escape hatch: detect negative counter and reset
              if (state.globalLoadingCounter < 0) {
                logger.info(
                  '[UIStore] globalLoadingCounter went negative. This indicates mismatched show/hide calls. Resetting to 0.',
                  { counter: state.globalLoadingCounter },
                )
                state.globalLoadingCounter = 0
              }

              // Safety: If counter is stuck at a low number for too long, auto-reset
              if (state.globalLoadingCounter > 0 && state.globalLoadingCounter <= 3) {
                setTimeout(() => {
                  const currentCounter = useUIStore.getState().globalLoadingCounter
                  if (currentCounter > 0 && currentCounter <= 3) {
                    logger.info(
                      '[UIStore] globalLoadingCounter appears stuck. Auto-resetting after timeout.',
                      { counter: currentCounter },
                    )
                    useUIStore.getState().setGlobalLoading(false)
                  }
                }, 30000) // 30 second timeout
              }

              state.globalLoading = state.globalLoadingCounter > 0
            }),

          // Stats tile display preferences
          statsTileTimeAsDecimals: false,
          toggleStatsTileTimeAsDecimals: () =>
            set((state) => {
              state.statsTileTimeAsDecimals = !state.statsTileTimeAsDecimals
            }),

          // Explosion state
          explosionEvent: null,
          triggerExplosion: (x, y) =>
            set((state) => {
              state.explosionEvent = {
                id: `explosion-${Date.now()}-${Math.random()}`,
                x,
                y,
                timestamp: Date.now(),
              }
            }),
          clearExplosion: () =>
            set((state) => {
              state.explosionEvent = null
            }),
        })),
      ),
      {
        name: 'lasius-ui-store', // localStorage key
        partialize: (state) => ({
          // Persist tab views and stats tile preferences
          tabViews: state.tabViews,
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
export const useContextMenuOpen = () => useUIStore((state) => state.contextMenuOpen)
export const useToastViews = () => useUIStore((state) => state.toastViews)
export const useTabViews = () => useUIStore((state) => state.tabViews)
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)
export const useStatsTileTimeAsDecimals = () => useUIStore((state) => state.statsTileTimeAsDecimals)
export const useExplosionEvent = () => useUIStore((state) => state.explosionEvent)

// Action hooks
export const useUIActions = () => {
  const setContextMenuOpen = useUIStore((state) => state.setContextMenuOpen)
  const closeContextMenu = useUIStore((state) => state.closeContextMenu)
  const addToast = useUIStore((state) => state.addToast)
  const removeToast = useUIStore((state) => state.removeToast)
  const setTabActive = useUIStore((state) => state.setTabActive)
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading)
  const showGlobalLoading = useUIStore((state) => state.showGlobalLoading)
  const hideGlobalLoading = useUIStore((state) => state.hideGlobalLoading)
  const toggleStatsTileTimeAsDecimals = useUIStore((state) => state.toggleStatsTileTimeAsDecimals)
  const triggerExplosion = useUIStore((state) => state.triggerExplosion)
  const clearExplosion = useUIStore((state) => state.clearExplosion)

  return {
    setContextMenuOpen,
    closeContextMenu,
    addToast,
    removeToast,
    setTabActive,
    setGlobalLoading,
    showGlobalLoading,
    hideGlobalLoading,
    toggleStatsTileTimeAsDecimals,
    triggerExplosion,
    clearExplosion,
  }
}
