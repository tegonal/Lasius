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
import { differenceBy, uniqBy } from 'es-toolkit'
import { Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
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
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'

type BaseProperties = {
  hideAddButton?: boolean
  onAddClick?: () => void
  tags: ModelsTag[]
}

type CallbackProperties = BaseProperties & {
  field?: never
  onTagsChange: (tags: ModelsTag[]) => void
}

type ConformProperties = BaseProperties & {
  field: FieldMetadata<string>
  /** @deprecated Use field prop instead */
  name?: never
  onTagsChange?: never
  tagGroupIndex?: never
}

type InputTagsAdminProperties = CallbackProperties | ConformProperties

/**
 * Shared tag admin UI — receives tags and callbacks from mode-specific wrapper.
 */
const TagsAdminCore = ({
  hideAddButton = false,
  onAddClick,
  onTagsChange,
  selectedTags,
}: BaseProperties & {
  onTagsChange: (tags: ModelsTag[]) => void
  selectedTags: ModelsTag[]
}) => {
  const { t } = useTranslation('common')
  const [inputText, setInputText] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const tagInputReference = useRef<HTMLInputElement>(null)

  const removeTag = (tag: ModelsTag) => {
    const toRemove = selectedTags.filter((t) => t.id === tag.id)
    const remaining = differenceBy(selectedTags, toRemove, (t) => t.id)
    onTagsChange(remaining)
  }

  const addTag = () => {
    if (!inputText.trim()) {
      return
    }

    const newTag: ModelsSimpleTag = {
      id: inputText.trim(),
      type: 'SimpleTag',
    }
    const merged = uniqBy([...selectedTags, newTag], (t) => t.id)
    setInputText('')
    onTagsChange(merged)
    setShowAddModal(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    addTag()
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
          variant="secondary">
          <LucideIcon icon={Plus} size={18} />
        </Button>
      )}

      {/* Add Tag Modal */}
      <Modal
        initialFocus={tagInputReference}
        onClose={() => {
          setShowAddModal(false)
          setInputText('')
        }}
        open={showAddModal}>
        <ModalCloseButton
          onClose={() => {
            setShowAddModal(false)
            setInputText('')
          }}
        />
        <FormElement>
          <Label htmlFor="newTag">
            {t('tag-manager:actions.addTag', {
              defaultValue: 'Add a tag',
            })}
          </Label>
          <Input
            autoComplete="off"
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('tag-manager:enterTagName', {
              defaultValue: 'Enter tag name',
            })}
            ref={tagInputReference}
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
            variant="secondary">
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
}: BaseProperties & { field: FieldMetadata<string> }) => {
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

export const InputTagsAdmin = (properties: InputTagsAdminProperties) => {
  if (properties.field) {
    return (
      <ConformTagsAdmin
        field={properties.field}
        hideAddButton={properties.hideAddButton}
        onAddClick={properties.onAddClick}
        tags={properties.tags}
      />
    )
  }
  return (
    <TagsAdminCore
      hideAddButton={properties.hideAddButton}
      onAddClick={properties.onAddClick}
      onTagsChange={properties.onTagsChange}
      selectedTags={properties.tags}
      tags={properties.tags}
    />
  )
}
