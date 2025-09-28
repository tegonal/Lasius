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

import { ModalViewType, TabViewType, ToastViewType } from 'types/dynamicViews'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface UIStore {
  // Context Menu state
  contextMenuOpen: string
  setContextMenuOpen: (id: string) => void
  closeContextMenu: () => void

  // Modal state
  modalViews: ModalViewType[]
  addModal: (modal: ModalViewType) => void
  removeModal: (id: string) => void
  setModalOpen: (id: string, isOpen: boolean) => void
  clearModals: () => void

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

          // Modal state
          modalViews: [],
          addModal: (modal) =>
            set((state) => {
              // Check if modal already exists
              const exists = state.modalViews.find((m) => m.id === modal.id)
              if (!exists) {
                state.modalViews.push(modal)
              } else {
                // Update existing modal
                const index = state.modalViews.findIndex((m) => m.id === modal.id)
                state.modalViews[index] = modal
              }
            }),
          removeModal: (id) =>
            set((state) => {
              state.modalViews = state.modalViews.filter((m) => m.id !== id)
            }),
          setModalOpen: (id, isOpen) =>
            set((state) => {
              const modal = state.modalViews.find((m) => m.id === id)
              if (modal) {
                modal.isOpen = isOpen
              }
            }),
          clearModals: () =>
            set((state) => {
              state.modalViews = []
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
        })),
      ),
      {
        name: 'lasius-ui-store', // localStorage key
        partialize: (state) => ({
          // Only persist tab views, not modals or toasts
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
export const useContextMenuOpen = () => useUIStore((state) => state.contextMenuOpen)
export const useModalViews = () => useUIStore((state) => state.modalViews)
export const useToastViews = () => useUIStore((state) => state.toastViews)
export const useTabViews = () => useUIStore((state) => state.tabViews)

// Action hooks
export const useUIActions = () => {
  const setContextMenuOpen = useUIStore((state) => state.setContextMenuOpen)
  const closeContextMenu = useUIStore((state) => state.closeContextMenu)
  const addModal = useUIStore((state) => state.addModal)
  const removeModal = useUIStore((state) => state.removeModal)
  const setModalOpen = useUIStore((state) => state.setModalOpen)
  const addToast = useUIStore((state) => state.addToast)
  const removeToast = useUIStore((state) => state.removeToast)
  const setTabActive = useUIStore((state) => state.setTabActive)

  return {
    setContextMenuOpen,
    closeContextMenu,
    addModal,
    removeModal,
    setModalOpen,
    addToast,
    removeToast,
    setTabActive,
  }
}
