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

import { getFormProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  addHours,
  getHours,
  getMinutes,
  isToday,
  setHours,
  setMinutes,
} from 'date-fns'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpToLine,
  HelpCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { InputDatePickerDuration } from '~/components/ui/forms/input/date-picker/input-date-picker-duration'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import {
  createBookingSchema,
  parseTagsFromFormData,
} from '~/features/bookings/lib/booking-schemas'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { untyped } from '~/lib/i18n-types'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking, type ModelsTag } from '~/services/api/lasius'
import {
  useAddUserBookingByOrganisation,
  useUpdateUserBooking,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'

import { BookingPresetSelector } from './booking-preset-selector'

type BookingAddUpdateFormProps = {
  bookingAfter?: ModelsBooking
  bookingBefore?: ModelsBooking
  itemReference?: ModelsBooking
  itemUpdate?: ModelsBooking
  latestBooking?: ModelsBooking
  mode: 'add' | 'addBetween' | 'update'
  onClose: () => void
  selectedDate?: Date
  selectedOrgId: string
}

type PresetSelection = {
  projectId: string
  projectName: string
  tags: ModelsTag[]
}

const isWithinSameMinute = (time1: string, time2: string): boolean => {
  if (!time1 || !time2) return false
  const date1 = new Date(time1)
  const date2 = new Date(time2)
  const diffMs = Math.abs(date1.getTime() - date2.getTime())
  return diffMs < 60_000
}

const computeInitialValues = (
  mode: 'add' | 'addBetween' | 'update',
  dateForForm: Date,
  itemUpdate?: ModelsBooking,
  itemReference?: ModelsBooking,
  bookingBefore?: ModelsBooking,
) => {
  if (itemUpdate) {
    return {
      end: formatISOLocale(new Date(itemUpdate?.end?.dateTime ?? '')),
      projectId: itemUpdate.projectReference.id,
      start: formatISOLocale(new Date(itemUpdate.start.dateTime)),
      tags: JSON.stringify(itemUpdate.tags),
    }
  }

  if (mode === 'add' && !itemReference) {
    if (!isToday(new Date(dateForForm))) {
      return {
        end: formatISOLocale(setHours(new Date(dateForForm), 12)),
        projectId: '',
        start: formatISOLocale(setHours(new Date(dateForForm), 8)),
        tags: '',
      }
    }
    return {
      end: formatISOLocale(new Date()),
      projectId: '',
      start: formatISOLocale(addHours(new Date(), -1)),
      tags: '',
    }
  }

  if (mode === 'add' && itemReference) {
    const reference = new Date(itemReference.end?.dateTime ?? '')
    return {
      end: formatISOLocale(addHours(reference, 1)),
      projectId: '',
      start: formatISOLocale(reference),
      tags: '',
    }
  }

  if (mode === 'addBetween' && itemReference) {
    return {
      end: formatISOLocale(new Date(itemReference?.start?.dateTime ?? '')),
      projectId: '',
      start: formatISOLocale(new Date(bookingBefore?.end?.dateTime ?? '')),
      tags: '',
    }
  }

  return { end: '', projectId: '', start: '', tags: '' }
}

export const BookingAddUpdateForm = ({
  bookingAfter,
  bookingBefore,
  itemReference,
  itemUpdate,
  latestBooking,
  mode,
  onClose,
  selectedDate,
  selectedOrgId,
}: BookingAddUpdateFormProps) => {
  const { t } = useTranslation('common')
  const addBookingApi = useAddUserBookingByOrganisation({
    onSuccess: () => onClose(),
  })
  const updateBookingApi = useUpdateUserBooking({
    onSuccess: () => onClose(),
  })
  // Projects from layout loader
  const { userProjects } = useProjects()
  const projects = userProjects.map((p) => p.projectReference)

  // Tags via Orval hook
  const tagsApi = useGetTagsByProject()
  const tagsSubmitRef = useRef(tagsApi.submit)
  tagsSubmitRef.current = tagsApi.submit

  const isSubmitting = addBookingApi.isLoading || updateBookingApi.isLoading

  const [startResetButton, setStartResetButton] =
    useState<React.ReactNode>(null)
  const [endResetButton, setEndResetButton] = useState<React.ReactNode>(null)
  const [showPresetPanel, setShowPresetPanel] = useState(false)

  const previousEndDate = useRef('')

  const dateForForm = useMemo(() => selectedDate ?? new Date(), [selectedDate])

  const schema = useMemo(() => createBookingSchema(untyped(t)), [t])

  const initialValues = useMemo(
    () =>
      computeInitialValues(
        mode,
        dateForForm,
        itemUpdate,
        itemReference,
        bookingBefore,
      ),
    [mode, dateForForm, itemUpdate, itemReference, bookingBefore],
  )

  // Track the initial end date for auto-adjustment
  useEffect(() => {
    previousEndDate.current = initialValues.end
  }, [initialValues.end])

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: initialValues,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const startControl = useInputControl(fields.start)
  const endControl = useInputControl(fields.end)
  const projectIdControl = useInputControl(fields.projectId)
  const tagsControl = useInputControl(fields.tags)

  const prevProjectKeyRef = useRef('')

  // Load tags when project changes
  useEffect(() => {
    const pid = projectIdControl.value
    const key = `${selectedOrgId}:${pid}`
    if (selectedOrgId && pid && key !== prevProjectKeyRef.current) {
      prevProjectKeyRef.current = key
      tagsSubmitRef.current({ orgId: selectedOrgId, projectId: pid })
    }
  }, [selectedOrgId, projectIdControl.value])

  const projectTags = tagsApi.data ?? []

  // Calculate duration for warning
  const durationHours = useMemo(() => {
    const sv = startControl.value
    const ev = endControl.value
    if (!sv || !ev) return 0
    const start = new Date(sv)
    const end = new Date(ev)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, [startControl.value, endControl.value])
  const showDurationWarning = durationHours > 8

  // Auto-focus tags after project selection
  useEffect(() => {
    if (projectIdControl.value && fields.tags.id) {
      document.querySelector<HTMLElement>(`#${fields.tags.id}`)?.focus()
    }
  }, [projectIdControl.value, fields.tags.id])

  // Auto-adjust end date when start changes — preserve time offset
  const prevStartRef = useRef(startControl.value)
  useEffect(() => {
    const sv = startControl.value
    const ev = endControl.value
    if (sv && sv !== prevStartRef.current && previousEndDate.current === ev) {
      const endHours = getHours(new Date(ev))
      const endMinutes = getMinutes(new Date(ev))
      const endDate = formatISOLocale(
        setMinutes(setHours(new Date(sv), endHours), endMinutes),
      )
      endControl.change(endDate)
      previousEndDate.current = endDate
    }
    prevStartRef.current = sv
  }, [startControl.value, endControl.value, endControl])

  // Compute preset start props
  const presetStart = useMemo(() => {
    if (mode === 'addBetween') return {}

    const referenceTime =
      mode === 'add'
        ? latestBooking?.end?.dateTime
        : bookingBefore?.end?.dateTime

    if (!referenceTime) return {}

    if (isWithinSameMinute(startControl.value ?? '', referenceTime)) {
      return {}
    }

    return {
      presetDate: formatISOLocale(new Date(referenceTime)),
      presetIcon: ArrowDownToLine,
      presetLabel:
        mode === 'add'
          ? t(
              'bookings:hints.useEndTimeOfLatest',
              'Use end time of latest booking as start time for this one',
            )
          : t(
              'bookings:hints.useEndTimeOfPrevious',
              'Use end time of previous booking as start time for this one',
            ),
    }
  }, [mode, latestBooking, bookingBefore, startControl.value, t])

  // Compute preset end props
  const presetEnd = useMemo(() => {
    if (mode === 'add' || mode === 'addBetween') return {}

    const referenceTime = bookingAfter?.start?.dateTime
    if (!referenceTime) return {}

    if (isWithinSameMinute(endControl.value ?? '', referenceTime)) {
      return {}
    }

    return {
      presetDate: formatISOLocale(new Date(referenceTime)),
      presetIcon: ArrowUpToLine,
      presetLabel: t(
        'bookings:hints.useStartTimeOfNext',
        'Use start time of next booking as end time for this one',
      ),
    }
  }, [mode, bookingAfter, endControl.value, t])

  const handlePresetSelect = useCallback(
    (preset: PresetSelection) => {
      projectIdControl.change(preset.projectId)
      tagsControl.change(
        preset.tags.length > 0 ? JSON.stringify(preset.tags) : '',
      )
      setShowPresetPanel(false)
    },
    [projectIdControl, tagsControl],
  )

  const handleEndChange = useCallback(
    (isoString: string) => {
      endControl.change(isoString)
    },
    [endControl],
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const result = parseWithZod(formData, { schema })
    if (result.status !== 'success') return

    const { end, projectId, start, tags: tagsJson } = result.value

    if (!projectId) return

    const tags = parseTagsFromFormData(tagsJson) as ModelsTag[]

    if (mode === 'add' || mode === 'addBetween') {
      addBookingApi.submit({
        body: { end, projectId, start, tags },
        orgId: selectedOrgId,
      })
    } else if (mode === 'update' && itemUpdate) {
      updateBookingApi.submit({
        body: {
          end: end || undefined,
          projectId,
          start: start || undefined,
          tags,
        },
        bookingId: itemUpdate.id,
        orgId: selectedOrgId,
      })
    }
  }

  return (
    <div className="relative w-full overflow-x-hidden">
      <div
        className="flex w-[200%] items-stretch transition-transform duration-300 ease-out"
        style={{
          transform: showPresetPanel ? 'translateX(-50%)' : 'translateX(0)',
        }}
      >
        {/* Form content */}
        <div className="w-1/2">
          <form {...getFormProps(form)} onSubmit={handleSubmit}>
            <FormBody>
              <FieldSet>
                <div className="mb-4 flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowPresetPanel(true)}
                    size="sm"
                    type="button"
                    variant="neutral"
                  >
                    {t('bookings:presets.browse', 'Browse presets')}
                    <LucideIcon icon={ArrowRight} size={16} />
                  </Button>
                  <ModalHelpButton helpKey="modal-add-edit-booking" />
                </div>
                <FormElement
                  htmlFor={fields.projectId.id}
                  label={t('projects:label', 'Project')}
                  required
                >
                  <ProjectSelect
                    errors={fields.projectId.errors}
                    fallbackProject={itemUpdate?.projectReference}
                    id={fields.projectId.id}
                    name={fields.projectId.name}
                    onChange={(id) => projectIdControl.change(id)}
                    projects={projects}
                    value={projectIdControl.value ?? ''}
                  />
                </FormElement>
                <FormElement
                  htmlFor={fields.tags.id}
                  label={t('tag-manager:label', 'Tags')}
                >
                  <InputTagsAutocomplete
                    field={fields.tags}
                    id={fields.tags.id}
                    projectId={projectIdControl.value}
                    suggestions={projectTags}
                  />
                </FormElement>
              </FieldSet>

              <FieldSet className="flex items-start gap-4">
                <div className="flex-grow space-y-4 pb-6">
                  <FormElement
                    htmlFor={fields.start.id}
                    label={t('time.starts', 'Starts')}
                    labelActionSlot={startResetButton}
                  >
                    <InputDatePicker
                      field={fields.start}
                      onRenderLabelAction={setStartResetButton}
                      {...presetStart}
                    />
                  </FormElement>
                  <FormElement
                    htmlFor={fields.end.id}
                    label={t('time.ends', 'Ends')}
                    labelActionSlot={endResetButton}
                  >
                    <InputDatePicker
                      field={fields.end}
                      onRenderLabelAction={setEndResetButton}
                      {...presetEnd}
                    />
                  </FormElement>
                </div>
                <div className="flex w-28 flex-col items-center pt-8">
                  <InputDatePickerDuration
                    endValue={endControl.value ?? ''}
                    onEndChange={handleEndChange}
                    startValue={startControl.value ?? ''}
                  />
                </div>
              </FieldSet>

              {showDurationWarning && (
                <div className="alert alert-warning mb-4" role="alert">
                  <LucideIcon icon={HelpCircle} size={20} />
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">
                      {t(
                        'bookings:warnings.longDuration',
                        'Long duration detected',
                      )}
                    </div>
                    <div className="text-sm">
                      {t(
                        'bookings:warnings.longDurationDescription',
                        'This booking is longer than a typical 8-hour work day. Please verify that the start and end times are correct.',
                      )}
                    </div>
                  </div>
                </div>
              )}

              <ButtonGroup>
                <Button
                  data-testid="booking-form-save-btn"
                  loading={isSubmitting}
                  type="submit"
                >
                  {t('actions.save', 'Save')}
                </Button>
                <Button
                  data-testid="booking-form-close-btn"
                  disabled={isSubmitting}
                  onClick={onClose}
                  type="button"
                  variant="secondary"
                >
                  {t('actions.close', 'Close')}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </div>
        {/* Preset panel — absolute so it doesn't stretch the container beyond the form height */}
        <div className="relative w-1/2">
          <div className="absolute inset-0">
            <BookingPresetSelector
              onBack={() => setShowPresetPanel(false)}
              onSelect={handlePresetSelect}
              selectedOrgId={selectedOrgId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
