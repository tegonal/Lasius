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

/**
 * Plausible Analytics Event Tracking for Lasius
 *
 * Event naming convention follows i18n pattern: domain.feature.action
 * - Common events: auth.*, navigation.*, error.*
 * - Feature-specific: booking.*, project.*, organisation.*, etc.
 *
 * Props are optional context data for each event.
 * All events should be added as goals in Plausible dashboard.
 */

// Common event props (shared across multiple events)
export type CommonEventProps = {
  status?: 'success' | 'error' | 'cancelled'
  error?: string
  source?: string
}

// Define the props for each event type
export type LasiusPlausibleEventProps = {
  // ==================== AUTH ====================
  'auth.login.success': { provider: 'internal' | 'oauth' | 'saml' }
  'auth.login.error': { provider: string; error: string }
  'auth.register.success': { provider: 'internal' }
  'auth.register.error': { error: string }
  'auth.logout.success': Record<string, never>
  'auth.logout.error': { error: string }

  // ==================== ONBOARDING ====================
  'onboarding.tutorial.start': Record<string, never>
  'onboarding.tutorial.complete': { slides_viewed: number }
  'onboarding.tutorial.dismiss': { current_slide: number; total_slides: number }
  'onboarding.tutorial.slide_view': { slide_id: string; slide_number: number }
  'onboarding.tutorial.reset': { source: 'settings' | 'manual' }

  // ==================== BOOKING ====================
  'booking.create.success': { has_tags: boolean; has_project: boolean }
  'booking.create.error': { error: string }
  'booking.start.success': { source: 'form' | 'context_menu' | 'favorite' | 'team_booking' }
  'booking.start.error': { error: string; source?: string }
  'booking.stop.success': { duration_minutes: number }
  'booking.stop.error': { error: string }
  'booking.edit.success': { field_changed: string }
  'booking.edit.error': { error: string; field?: string }
  'booking.delete.success': Record<string, never>
  'booking.delete.error': { error: string }
  'booking.copy.success': { source: 'context_menu' | 'button' }
  'booking.favorite.add': { has_project: boolean; has_tags: boolean }
  'booking.favorite.remove': Record<string, never>

  // ==================== PROJECT ====================
  'project.create.success': { is_private: boolean; has_tags: boolean }
  'project.create.error': { error: string }
  'project.edit.success': { field_changed: string }
  'project.edit.error': { error: string }
  'project.delete.success': Record<string, never>
  'project.delete.error': { error: string }
  'project.join.success': { source: 'invitation' | 'admin_add' }
  'project.leave.success': Record<string, never>
  'project.deactivate.success': Record<string, never>
  'project.activate.success': Record<string, never>

  // ==================== ORGANISATION ====================
  'organisation.create.success': { is_first: boolean }
  'organisation.create.error': { error: string }
  'organisation.switch.success': { organisation_count: number }
  'organisation.edit.success': { field_changed: string }
  'organisation.delete.success': Record<string, never>
  'organisation.invite.send': { role: 'admin' | 'member' }
  'organisation.invite.accept': { source: 'link' | 'other_session' }
  'organisation.invite.reject': Record<string, never>
  'organisation.member.add': { role: 'admin' | 'member' }
  'organisation.member.remove': Record<string, never>
  'organisation.member.role_change': { new_role: 'admin' | 'member' }

  // ==================== TAGS ====================
  'tag.create.success': { has_color: boolean }
  'tag.edit.success': Record<string, never>
  'tag.delete.success': Record<string, never>
  'tag_group.create.success': { tag_count: number }
  'tag_group.edit.success': Record<string, never>
  'tag_group.delete.success': Record<string, never>

  // ==================== SETTINGS ====================
  'settings.app.language_change': { from: string; to: string }
  'settings.app.theme_change': { theme: 'light' | 'dark' | 'system' }
  'settings.app.onboarding_toggle': { enabled: boolean }
  'settings.account.update': { field_changed: string }
  'settings.account.delete': Record<string, never>
  'settings.password.change.success': Record<string, never>
  'settings.password.change.error': { error: string }
  'settings.working_hours.update': { total_hours: number }

  // ==================== LISTS & REPORTS ====================
  'lists.export.success': { format: 'csv' | 'excel' | 'pdf'; date_range: string }
  'lists.export.error': { error: string; format: string }
  'lists.filter.apply': { filter_type: string }
  'lists.view.change': { view: 'day' | 'week' | 'month' | 'custom' }

  // ==================== STATISTICS & DASHBOARD ====================
  'dashboard.view': { tab: 'overview' | 'charts' | 'breakdown' }
  'statistics.view': { chart_type: string; date_range: string }
  'statistics.export': { format: string }

  // ==================== NAVIGATION ====================
  'navigation.tab.switch': { from: string; to: string }
  'navigation.help.open': { source: 'button' | 'shortcut' }
  'navigation.search.use': { result_count: number }

  // ==================== CALENDAR ====================
  'calendar.view.change': { view: 'day' | 'week' | 'month' }
  'calendar.date.select': { source: 'picker' | 'navigation' }

  // ==================== CONTEXT MENU ====================
  'context_menu.open': { target: 'booking' | 'project' | 'favorite' | 'team_booking' }
  'context_menu.action': { action: string; target: string }

  // ==================== ERRORS ====================
  'error.api': { endpoint: string; status: number; message: string }
  'error.network': { message: string }
  'error.validation': { form: string; field: string; error: string }
  'error.auth': { type: 'session_expired' | 'unauthorized' | 'forbidden'; message: string }
  'error.runtime': { message: string; component?: string }

  // ==================== PERFORMANCE ====================
  'performance.slow_load': { component: string; duration_ms: number }
  'performance.api_slow': { endpoint: string; duration_ms: number }
}

// This type matches the PlausibleOptions structure from usePlausible
export type LasiusPlausibleEvents = {
  [K in keyof LasiusPlausibleEventProps]: {
    props?: LasiusPlausibleEventProps[K]
    callback?: () => void
  }
}

/**
 * List of all event names for easy copy-paste into Plausible Goals
 * (sorted alphabetically by category)
 */
export const PLAUSIBLE_GOALS = [
  // Auth
  'auth.login.error',
  'auth.login.success',
  'auth.logout.error',
  'auth.logout.success',
  'auth.register.error',
  'auth.register.success',

  // Booking
  'booking.copy.success',
  'booking.create.error',
  'booking.create.success',
  'booking.delete.error',
  'booking.delete.success',
  'booking.edit.error',
  'booking.edit.success',
  'booking.favorite.add',
  'booking.favorite.remove',
  'booking.start.error',
  'booking.start.success',
  'booking.stop.error',
  'booking.stop.success',

  // Calendar
  'calendar.date.select',
  'calendar.view.change',

  // Context Menu
  'context_menu.action',
  'context_menu.open',

  // Dashboard
  'dashboard.view',

  // Errors
  'error.api',
  'error.auth',
  'error.network',
  'error.runtime',
  'error.validation',

  // Lists & Reports
  'lists.export.error',
  'lists.export.success',
  'lists.filter.apply',
  'lists.view.change',

  // Navigation
  'navigation.help.open',
  'navigation.search.use',
  'navigation.tab.switch',

  // Onboarding
  'onboarding.tutorial.complete',
  'onboarding.tutorial.dismiss',
  'onboarding.tutorial.reset',
  'onboarding.tutorial.slide_view',
  'onboarding.tutorial.start',

  // Organisation
  'organisation.create.error',
  'organisation.create.success',
  'organisation.delete.success',
  'organisation.edit.success',
  'organisation.invite.accept',
  'organisation.invite.reject',
  'organisation.invite.send',
  'organisation.member.add',
  'organisation.member.remove',
  'organisation.member.role_change',
  'organisation.switch.success',

  // Performance
  'performance.api_slow',
  'performance.slow_load',

  // Project
  'project.activate.success',
  'project.create.error',
  'project.create.success',
  'project.deactivate.success',
  'project.delete.error',
  'project.delete.success',
  'project.edit.error',
  'project.edit.success',
  'project.join.success',
  'project.leave.success',

  // Settings
  'settings.account.delete',
  'settings.account.update',
  'settings.app.language_change',
  'settings.app.onboarding_toggle',
  'settings.app.theme_change',
  'settings.password.change.error',
  'settings.password.change.success',
  'settings.working_hours.update',

  // Statistics
  'statistics.export',
  'statistics.view',

  // Tags
  'tag.create.success',
  'tag.delete.success',
  'tag.edit.success',
  'tag_group.create.success',
  'tag_group.delete.success',
  'tag_group.edit.success',
] as const
