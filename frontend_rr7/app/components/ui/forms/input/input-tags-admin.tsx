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

import { type FieldMetadata, useInputControl } from '@conform-to/react'
import { differenceBy, filter, uniqBy } from 'es-toolkit/compat'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { TagList } from '~/components/ui/data-display/tag-list'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'

type BaseProps = {
  hideAddButton?: boolean
  onAddClick?: () => void
  tags: ModelsTag[]
}

type CallbackProps = BaseProps & {
  field?: never
  onTagsChange: (tags: ModelsTag[]) => void
}

type ConformProps = BaseProps & {
  field: FieldMetadata<string>
  /** @deprecated Use field prop instead */
  name?: never
  onTagsChange?: never
  tagGroupIndex?: never
}

type InputTagsAdminProps = CallbackProps | ConformProps

/**
 * Shared tag admin UI — receives tags and callbacks from mode-specific wrapper.
 */
const TagsAdminCore = ({
  hideAddButton = false,
  onAddClick,
  onTagsChange,
  selectedTags,
}: BaseProps & {
  onTagsChange: (tags: ModelsTag[]) => void
  selectedTags: ModelsTag[]
}) => {
  const { t } = useTranslation('common')
  const [inputText, setInputText] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)

  const removeTag = (tag: ModelsTag) => {
    const toRemove = filter(selectedTags, { id: tag.id })
    const remaining = differenceBy(selectedTags, toRemove, 'id')
    onTagsChange(remaining)
  }

  const addTag = () => {
    if (inputText.trim()) {
      const newTag: ModelsSimpleTag = {
        id: inputText.trim(),
        type: 'SimpleTag',
      }
      const merged = uniqBy([...selectedTags, newTag], 'id')
      setInputText('')
      onTagsChange(merged)
      setShowAddModal(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick()
    } else {
      setShowAddModal(true)
    }
  }

  return (
    <div>
      {Array.isArray(selectedTags) && selectedTags.length > 0 && (
        <div className="mb-2">
          <TagList clickHandler={removeTag} items={selectedTags} />
        </div>
      )}

      {!hideAddButton && (
        <Button
          fullWidth={false}
          onClick={handleAddClick}
          shape="circle"
          size="sm"
          type="button"
          variant="secondary"
        >
          <LucideIcon icon={Plus} size={18} />
        </Button>
      )}

      {/* Add Tag Modal */}
      <Modal
        onClose={() => {
          setShowAddModal(false)
          setInputText('')
        }}
        open={showAddModal}
      >
        <FormElement>
          <Label htmlFor="newTag">
            {t('tag-manager:actions.addTag', {
              defaultValue: 'Add a tag',
            })}
          </Label>
          <Input
            autoComplete="off"
            autoFocus
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('tag-manager:enterTagName', {
              defaultValue: 'Enter tag name',
            })}
            value={inputText}
          />
        </FormElement>
        <ButtonGroup>
          <Button onClick={addTag} type="button" variant="primary">
            {t('actions.add', 'Add')}
          </Button>
          <Button
            onClick={() => {
              setShowAddModal(false)
              setInputText('')
            }}
            type="button"
            variant="secondary"
          >
            {t('actions.close', 'Close')}
          </Button>
        </ButtonGroup>
      </Modal>
    </div>
  )
}

/** Conform mode — stores tags as JSON string via useInputControl */
const ConformTagsAdmin = ({
  field,
  hideAddButton,
  onAddClick,
  tags,
}: BaseProps & { field: FieldMetadata<string> }) => {
  const control = useInputControl(field)

  const selectedTags: ModelsTag[] = useMemo(() => {
    if (!control.value) return tags
    try {
      return JSON.parse(control.value) as ModelsTag[]
    } catch {
      return tags
    }
  }, [control.value, tags])

  const handleTagsChange = (updatedTags: ModelsTag[]) => {
    control.change(updatedTags.length > 0 ? JSON.stringify(updatedTags) : '')
  }

  return (
    <>
      <input name={field.name} type="hidden" value={control.value ?? ''} />
      <TagsAdminCore
        hideAddButton={hideAddButton}
        onAddClick={onAddClick}
        onTagsChange={handleTagsChange}
        selectedTags={selectedTags}
        tags={tags}
      />
      <FormFieldErrors errors={field.errors} />
    </>
  )
}

export const InputTagsAdmin = (props: InputTagsAdminProps) => {
  if (props.field) {
    return (
      <ConformTagsAdmin
        field={props.field}
        hideAddButton={props.hideAddButton}
        onAddClick={props.onAddClick}
        tags={props.tags}
      />
    )
  }
  return (
    <TagsAdminCore
      hideAddButton={props.hideAddButton}
      onAddClick={props.onAddClick}
      onTagsChange={props.onTagsChange}
      selectedTags={props.tags}
      tags={props.tags}
    />
  )
}
