# Component Structure Migration Plan

## Overview
- **Total files to migrate**: 165 component files
- **Files with component imports to update**: 194 files
- **Strategy**: Direct migration with immediate import updates, no backwards compatibility

## New Directory Structure

```
src/components/
├── primitives/         # Base UI building blocks
├── ui/                 # Composed UI components
├── forms/              # Form-specific components
├── features/           # Domain-specific components
├── system/             # System-level components (unchanged)
└── utils/              # Utility components
```

## Migration Phases

### Phase 1: Create New Directory Structure
```bash
mkdir -p src/components/primitives/{buttons,inputs,typography,layout}
mkdir -p src/components/ui/{cards,feedback,navigation,overlays,data-display,icons,animations}
mkdir -p src/components/features/{booking,auth,organization,user,charts}
mkdir -p src/components/utils
```

### Phase 2: Component Migration Mapping

#### Primitives Layer

**primitives/buttons/**
- `src/components/shared/button.tsx` → `src/components/primitives/buttons/Button.tsx`
- `src/components/shared/buttonLeft.tsx` → `src/components/primitives/buttons/ButtonLeft.tsx`
- `src/components/shared/buttonRight.tsx` → `src/components/primitives/buttons/ButtonRight.tsx`
- `src/components/forms/input/shared/buttonCalendar.tsx` → `src/components/primitives/buttons/CalendarButton.tsx`
- `src/components/forms/input/shared/buttonUpDown.tsx` → `src/components/primitives/buttons/UpDownButton.tsx`

**primitives/inputs/**
- `src/components/shared/input.tsx` → `src/components/primitives/inputs/Input.tsx`
- `src/components/forms/input/shared/selectArrow.tsx` → `src/components/primitives/inputs/SelectArrow.tsx`

**primitives/typography/**
- `src/components/shared/text.tsx` → `src/components/primitives/typography/Text.tsx`
- `src/components/shared/heading.tsx` → `src/components/primitives/typography/Heading.tsx`
- `src/components/shared/label.tsx` → `src/components/primitives/typography/Label.tsx`
- `src/components/tags/p.tsx` → `src/components/primitives/typography/Paragraph.tsx`
- `src/components/tags/strong.tsx` → `src/components/primitives/typography/Strong.tsx`
- `src/components/tags/small.tsx` → `src/components/primitives/typography/Small.tsx`
- `src/components/tags/ol.tsx` → `src/components/primitives/typography/OrderedList.tsx`
- `src/components/tags/ul.tsx` → `src/components/primitives/typography/UnorderedList.tsx`
- `src/components/tags/nextLink.tsx` → `src/components/primitives/typography/Link.tsx`

**primitives/layout/**
- `src/components/scrollContainer.tsx` → `src/components/primitives/layout/ScrollContainer.tsx`
- `src/components/cardContainer.tsx` → `src/components/primitives/layout/CardContainer.tsx`
- `src/components/shared/columnList.tsx` → `src/components/primitives/layout/ColumnList.tsx`
- `src/components/shared/elementsAsColumn.tsx` → `src/components/primitives/layout/ElementsAsColumn.tsx`

#### UI Layer

**ui/cards/**
- `src/components/shared/card.tsx` → `src/components/ui/cards/Card.tsx`
- `src/components/shared/cardSmall.tsx` → `src/components/ui/cards/CardSmall.tsx`

**ui/feedback/**
- `src/components/shared/alert.tsx` → `src/components/ui/feedback/Alert.tsx`
- `src/components/error.tsx` → `src/components/ui/feedback/Error.tsx`
- `src/components/shared/errorSign.tsx` → `src/components/ui/feedback/ErrorSign.tsx`
- `src/components/shared/toolTip.tsx` → `src/components/ui/feedback/Tooltip.tsx`
- `src/components/shared/notifications/boxInfo.tsx` → `src/components/ui/feedback/InfoBox.tsx`
- `src/components/shared/notifications/boxWarning.tsx` → `src/components/ui/feedback/WarningBox.tsx`
- `src/components/toasts/toasts.tsx` → `src/components/ui/feedback/Toasts.tsx`
- `src/components/toasts/hooks/useToast.tsx` → `src/components/ui/feedback/hooks/useToast.tsx`

**ui/navigation/**
- `src/components/pagination.tsx` → `src/components/ui/navigation/Pagination.tsx`
- `src/components/shared/tabs.tsx` → `src/components/ui/navigation/Tabs.tsx`
- `src/components/shared/iconTabs.tsx` → `src/components/ui/navigation/IconTabs.tsx`
- `src/components/navigation/desktop/navigationMenuTabs.tsx` → `src/components/ui/navigation/desktop/MenuTabs.tsx`
- `src/components/navigation/desktop/navigationTabContent.tsx` → `src/components/ui/navigation/desktop/TabContent.tsx`
- `src/components/navigation/mobile/mobileNavigationButton.tsx` → `src/components/ui/navigation/mobile/NavigationButton.tsx`

**ui/overlays/**
- `src/components/portal.tsx` → `src/components/ui/overlays/Portal.tsx`
- `src/components/modal/modalConfirm.tsx` → `src/components/ui/overlays/ConfirmModal.tsx`
- `src/components/modal/modalResponsive.tsx` → `src/components/ui/overlays/ResponsiveModal.tsx`
- `src/components/modal/hooks/useModal.tsx` → `src/components/ui/overlays/hooks/useModal.tsx`
- `src/components/shared/timeDropdownWithModal.tsx` → `src/components/ui/overlays/TimeDropdownModal.tsx`
- `src/components/colorModeDropdown.tsx` → `src/components/ui/overlays/ColorModeDropdown.tsx`
- `src/components/contextMenuBar/*` → `src/components/ui/overlays/contextMenu/*`

**ui/data-display/**
- `src/components/shared/badge.tsx` → `src/components/ui/data-display/Badge.tsx`
- `src/components/shared/progressBar.tsx` → `src/components/ui/data-display/ProgressBar.tsx`
- `src/components/shared/progressBarSmall.tsx` → `src/components/ui/data-display/ProgressBarSmall.tsx`
- `src/components/shared/tagList.tsx` → `src/components/ui/data-display/TagList.tsx`
- `src/components/shared/dots/dotGreen.tsx` → `src/components/ui/data-display/dots/GreenDot.tsx`
- `src/components/shared/dots/dotOrange.tsx` → `src/components/ui/data-display/dots/OrangeDot.tsx`
- `src/components/shared/dots/dotRed.tsx` → `src/components/ui/data-display/dots/RedDot.tsx`
- `src/components/dataList/*` → `src/components/ui/data-display/DataList/*`
- `src/components/shared/fetchState/*` → `src/components/ui/data-display/fetchState/*`
- `src/components/shared/stats/*` → `src/components/ui/data-display/stats/*`
- `src/components/shared/statsGroup.tsx` → `src/components/ui/data-display/StatsGroup.tsx`
- `src/components/shared/statsTileHours.tsx` → `src/components/ui/data-display/StatsTileHours.tsx`
- `src/components/shared/statsTileNumber.tsx` → `src/components/ui/data-display/StatsTileNumber.tsx`
- `src/components/shared/statsTilePercentage.tsx` → `src/components/ui/data-display/StatsTilePercentage.tsx`

**ui/icons/**
- `src/components/shared/icon.tsx` → `src/components/ui/icons/Icon.tsx`
- `src/components/shared/lucideIcon.tsx` → `src/components/ui/icons/LucideIcon.tsx`
- `src/components/logo.tsx` → `src/components/ui/icons/Logo.tsx`

**ui/animations/**
- `src/components/shared/motion/*` → `src/components/ui/animations/*`

#### Forms Layer (keep mostly as-is, just reorganize)

**forms/**
- Keep existing structure but rename files to PascalCase
- `src/components/forms/formActions.tsx` → `src/components/forms/FormActions.tsx`
- `src/components/forms/formBody.tsx` → `src/components/forms/FormBody.tsx`
- etc.

**forms/inputs/**
- `src/components/forms/input/inputSelectAutocomplete.tsx` → `src/components/forms/inputs/SelectAutocomplete.tsx`
- `src/components/forms/input/inputTagsAdmin.tsx` → `src/components/forms/inputs/TagsAdmin.tsx`
- `src/components/forms/input/inputTagsAutocomplete.tsx` → `src/components/forms/inputs/TagsAutocomplete.tsx`
- `src/components/forms/input/datePicker/*` → `src/components/forms/inputs/DatePicker/*`
- `src/components/forms/input/calendar/*` → `src/components/forms/inputs/Calendar/*`
- `src/components/shared/dateRangeFilter.tsx` → `src/components/forms/inputs/DateRangeFilter.tsx`
- `src/components/shared/timeDropdown.tsx` → `src/components/forms/inputs/TimeDropdown.tsx`

**forms/shared/**
- `src/components/forms/input/shared/dropdownList.tsx` → `src/components/forms/shared/DropdownList.tsx`
- `src/components/forms/input/shared/dropdownListItem.tsx` → `src/components/forms/shared/DropdownListItem.tsx`
- `src/components/forms/input/shared/preventEnterOnForm.ts` → `src/components/forms/shared/preventEnterOnForm.ts`

#### Features Layer

**features/booking/**
- `src/components/bookingHistory/*` → `src/components/features/booking/history/*`
- `src/components/calendar/*` → `src/components/features/booking/calendar/*`

**features/auth/**
- `src/components/logoutButton.tsx` → `src/components/features/auth/LogoutButton.tsx`

**features/organization/**
- `src/components/shared/selectUserOrganisation.tsx` → `src/components/features/organization/SelectUserOrganization.tsx`
- `src/components/shared/selectUserOrganisationModal.tsx` → `src/components/features/organization/SelectUserOrganizationModal.tsx`
- `src/components/shared/avatar/avatarOrganisation.tsx` → `src/components/features/organization/OrganizationAvatar.tsx`

**features/user/**
- `src/components/shared/avatar/avatarUser.tsx` → `src/components/features/user/UserAvatar.tsx`
- `src/components/shared/avatar/avatarProject.tsx` → `src/components/features/user/ProjectAvatar.tsx`
- `src/components/shared/manageUserCard.tsx` → `src/components/features/user/ManageUserCard.tsx`
- `src/components/shared/manageUserInviteByEmailForm.tsx` → `src/components/features/user/InviteByEmailForm.tsx`

**features/charts/**
- `src/components/charts/*` → `src/components/features/charts/*`

#### Utils Layer

**utils/**
- `src/components/help.tsx` → `src/components/utils/Help.tsx`
- `src/components/shared/noSSRContainer.tsx` → `src/components/utils/NoSSRContainer.tsx`
- `src/components/shared/formatDate.tsx` → `src/components/utils/FormatDate.tsx`
- `src/components/shared/tegonalFooter.tsx` → `src/components/utils/TegonalFooter.tsx`

### Phase 3: Update Import Script

Create a script to update all imports automatically:

```typescript
// scripts/updateComponentImports.ts
const importMappings = {
  // Primitives
  'components/shared/button': 'components/primitives/buttons/Button',
  'components/shared/buttonLeft': 'components/primitives/buttons/ButtonLeft',
  'components/shared/buttonRight': 'components/primitives/buttons/ButtonRight',
  'components/shared/text': 'components/primitives/typography/Text',
  'components/shared/heading': 'components/primitives/typography/Heading',
  'components/shared/label': 'components/primitives/typography/Label',

  // UI Layer
  'components/shared/card': 'components/ui/cards/Card',
  'components/shared/cardSmall': 'components/ui/cards/CardSmall',
  'components/shared/alert': 'components/ui/feedback/Alert',
  'components/error': 'components/ui/feedback/Error',
  'components/pagination': 'components/ui/navigation/Pagination',
  'components/portal': 'components/ui/overlays/Portal',
  'components/shared/badge': 'components/ui/data-display/Badge',
  'components/shared/icon': 'components/ui/icons/Icon',
  'components/logo': 'components/ui/icons/Logo',

  // Features
  'components/logoutButton': 'components/features/auth/LogoutButton',
  'components/bookingHistory/bookingHistoryLayout': 'components/features/booking/history/BookingHistoryLayout',
  'components/charts/pieDiagram': 'components/features/charts/PieDiagram',

  // Add all other mappings...
};
```

### Phase 4: Execution Steps

1. **Create new directory structure**
   ```bash
   # Run directory creation commands
   ```

2. **Move and rename files**
   ```bash
   # For each mapping, move and rename
   mv src/components/shared/button.tsx src/components/primitives/buttons/Button.tsx
   # etc...
   ```

3. **Update all imports in moved files**
   - Update relative imports within components
   - Update imports from other modules

4. **Update all imports in consuming files**
   - Run import update script on all 194 files

5. **Run yarn check after each batch**
   ```bash
   yarn check
   ```

6. **Fix any TypeScript/ESLint issues**

7. **Remove old empty directories**
   ```bash
   rm -rf src/components/shared
   rm -rf src/components/tags
   # etc...
   ```

### Phase 5: Validation

After each phase:
1. Run `yarn check` to ensure no lint/type errors
2. Run `yarn build` to ensure production build works
3. Run `yarn dev` and test critical user flows

### Phase 6: Cleanup

1. Delete `.bak` file: `src/components/shared/manageUserInviteByEmailForm.tsx.bak`
2. Remove any empty directories
3. Update any documentation referring to old structure

## Execution Order

### Batch 1: Primitives (Low Risk)
- Move typography components
- Move button components
- Move layout components
- Update imports
- Run `yarn check`

### Batch 2: UI Layer (Medium Risk)
- Move cards, badges, progress bars
- Move navigation components
- Move feedback components
- Update imports
- Run `yarn check`

### Batch 3: Features (Higher Risk)
- Move booking components
- Move user/org components
- Move charts
- Update imports
- Run `yarn check`

### Batch 4: Forms (Complex)
- Reorganize form components
- Move form inputs
- Update imports
- Run `yarn check`

### Batch 5: System & Utils
- Move utility components
- System components stay in place
- Update imports
- Run `yarn check`

## Import Update Examples

**Before:**
```typescript
import { Button } from 'components/shared/button';
import { Card } from 'components/shared/card';
import Logo from 'components/logo';
```

**After:**
```typescript
import { Button } from 'components/primitives/buttons/Button';
import { Card } from 'components/ui/cards/Card';
import { Logo } from 'components/ui/icons/Logo';
```

## Risk Mitigation

1. **Create full backup first**
   ```bash
   cp -r src/components src/components.backup
   ```

2. **Test incrementally**
   - Move one component category at a time
   - Run tests after each category

3. **Have rollback plan**
   - Keep backup until migration is validated in production

## Success Criteria

- [ ] All 165 component files moved to new locations
- [ ] All 194 files with imports updated
- [ ] `yarn check` passes with no errors
- [ ] `yarn build` completes successfully
- [ ] Dev server runs without console errors
- [ ] Critical user flows work correctly

## Notes

- No aliases will be created
- All changes are breaking, no backwards compatibility
- Component names changed to PascalCase for consistency
- Folder structure follows atomic design principles