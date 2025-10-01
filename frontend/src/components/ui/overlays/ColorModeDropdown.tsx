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

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Button } from 'components/primitives/buttons/Button'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useColorMode } from 'lib/hooks/useColorMode'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { cn } from 'lib/utils/cn'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

const themeModeToDataTheme: Record<string, string> = {
  light: 'light',
  dark: 'dark',
}

export const ColorModeDropdown: React.FC = () => {
  const { t } = useTranslation('common')
  const [mode, setMode] = useColorMode()
  const [themeSource, setThemeSource] = useState<'manual' | 'system'>('system')
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('system')
  const plausible = usePlausible<LasiusPlausibleEvents>()

  useEffect(() => {
    const dataTheme = themeModeToDataTheme[mode] || 'light'
    document.documentElement.setAttribute('data-theme', dataTheme)

    if (typeof window !== 'undefined' && themeSource === 'manual') {
      localStorage.setItem('theme', dataTheme)
    }
  }, [mode, themeSource])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      setThemeSource('manual')
      setActiveTheme(savedTheme as ThemeMode)

      const themeUIMode = savedTheme === 'dark' ? 'dark' : 'light'
      if (themeUIMode !== mode) {
        setMode(themeUIMode)
      }
    } else {
      setThemeSource('system')
      setActiveTheme('system')

      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        if (systemTheme !== mode) {
          setMode(systemTheme)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', systemTheme)
      setMode(systemTheme)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [setMode])

  const selectTheme = (theme: ThemeMode) => {
    setActiveTheme(theme)

    if (theme === 'system') {
      setThemeSource('system')
      localStorage.removeItem('theme')

      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        setMode(systemTheme)
      }
    } else {
      setThemeSource('manual')
      setMode(theme)
      localStorage.setItem('theme', theme)
    }

    plausible('uiAction', {
      props: {
        name: 'colorModeDropdown',
      },
    })
  }

  const getCurrentIcon = () => {
    if (activeTheme === 'system') {
      return Monitor
    } else if (activeTheme === 'dark') {
      return Moon
    } else {
      return Sun
    }
  }

  const CurrentIcon = getCurrentIcon()

  const themeOptions = [
    {
      value: 'light' as ThemeMode,
      label: t('common.themes.light', { defaultValue: 'Light' }),
      icon: Sun,
    },
    {
      value: 'dark' as ThemeMode,
      label: t('common.themes.dark', { defaultValue: 'Dark' }),
      icon: Moon,
    },
    {
      value: 'system' as ThemeMode,
      label: t('common.themes.system', { defaultValue: 'System' }),
      icon: Monitor,
    },
  ]

  return (
    <Menu as="div" className="relative">
      <ToolTip
        toolTipContent={t('common.themes.title', { defaultValue: 'Theme' })}
        placement="bottom">
        <MenuButton as={Button} variant="ghost" shape="circle">
          <LucideIcon icon={CurrentIcon} size={20} />
        </MenuButton>
      </ToolTip>

      <MenuItems
        className={cn(
          'absolute right-0 mt-2 w-36 origin-top-right',
          'bg-base-100 border-base-content/20 rounded-lg border',
          'z-50 py-1 shadow-lg',
          'focus:outline-none',
        )}>
        {themeOptions.map((option) => (
          <MenuItem key={option.value}>
            {({ focus }) => (
              <button
                onClick={() => selectTheme(option.value)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-sm',
                  'transition-colors duration-150',
                  focus && 'bg-base-200',
                  activeTheme === option.value && 'text-primary',
                )}>
                <LucideIcon icon={option.icon} size={16} strokeWidth={2} />
                <span className="flex-1 text-left">{option.label}</span>
                {activeTheme === option.value && (
                  <LucideIcon icon={Check} size={16} strokeWidth={2} className="text-primary" />
                )}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
