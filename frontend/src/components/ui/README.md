# UI Components

## Overview
UI components are composed, reusable interface elements built from primitives and other UI components. They represent the "molecules" and "organisms" in atomic design - more complex than primitives but still generic and reusable across different features.

## Criteria for UI Components
A component belongs in the ui directory if it:
- ✅ Combines multiple primitives or other UI components
- ✅ Provides common UI patterns (cards, modals, navigation)
- ✅ Is reusable across different features/domains
- ✅ May have internal state for UI behavior (open/closed, active tab)
- ✅ Has no knowledge of specific business entities or API calls
- ✅ Could be used in different applications with similar needs

## Directory Structure

### `/cards`
Container components for content presentation

### `/feedback`
User feedback and notification components

### `/navigation`
Navigation and routing components

### `/overlays`
Overlay and modal components

### `/data-display`
Components for displaying data and information

### `/icons`
Icon components and systems

### `/animations`
Motion and animation components

## Usage Guidelines

### DO ✅
- Compose from primitives when possible
- Keep components focused on UI behavior
- Use TypeScript for all props
- Provide loading and error states
- Follow accessibility best practices
- Document complex component behavior
- Use class-variance-authority (CVA) for managing component variants
- Leverage Tailwind CSS and DaisyUI classes

### DON'T ❌
- Include business logic or domain knowledge
- Make API calls directly
- Import from features directory
- Create components specific to one feature
- Mix presentation with data fetching

## Variant Management with CVA

UI components should use CVA for consistent variant handling:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  'card', // DaisyUI base
  {
    variants: {
      variant: {
        default: 'bg-base-100',
        bordered: 'card-bordered',
        compact: 'card-compact',
      },
      interactive: {
        true: 'hover:shadow-xl transition-shadow cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  }
)
```

## Examples

### Good UI Component
```tsx
// Composed from primitives, reusable UI pattern, uses CVA
export const Card = ({ title, children, variant, actions }) => (
  <div className={cardVariants({ variant })}>
    <Heading>{title}</Heading>
    <div>{children}</div>
    {actions && <CardActions>{actions}</CardActions>}
  </div>
)
```

### Not a UI Component
```tsx
// Too specific to booking feature
export const BookingCard = () => {
  const booking = useBooking()  // ❌ Domain-specific
  const { mutate } = useAPI()   // ❌ API calls

  return <Card>...</Card>
}
```

## Component Categories

### Display Components
Show information without interaction
- Badges, labels, tags
- Progress indicators
- Statistics displays
- Avatar displays

### Interactive Components
Respond to user input
- Navigation elements
- Modals and overlays
- Dropdowns and menus
- Form feedback

### Layout Components
Structure and organize content
- Cards and containers
- Lists and grids
- Tab layouts
- Responsive wrappers

### Animation Components
Provide motion and transitions
- Enter/exit animations
- State transitions
- Loading indicators
- Interactive feedback

## Important Note on Business Logic

### The Absolute Rule
**If a component has domain/project-specific state or business logic, it belongs in the `/features` layer**

This includes:
- Components that make API calls
- Components that use business/domain hooks (useOrganisation, useBooking, etc.)
- Components that know about domain entities (users, projects, bookings)
- Components that implement business workflows

### Current Violations
The context menu (`/overlays/contextMenu`) currently violates this rule as it contains buttons with business logic. This needs to be moved to `/features` to maintain architectural consistency.

### Coherence and Colocation
When moving hybrid component systems, keep all related components together:
- Move the entire system as a unit
- Maintain the internal structure
- Keep tightly coupled components in the same directory

## Migration Notes
Components were migrated from shared/ following atomic design principles. Regular audits should ensure components remain generic and don't accumulate feature-specific logic over time.