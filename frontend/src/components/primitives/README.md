# Primitives

## Overview
Primitives are the foundational building blocks of the UI. They are the most basic, reusable components that have no knowledge of business logic or application context. These components follow atomic design principles and represent the "atoms" of our component architecture.

## Criteria for Primitives
A component belongs in the primitives directory if it:
- ✅ Is completely presentation-focused with no business logic
- ✅ Has no dependencies on application state or context
- ✅ Can be used across any project without modification
- ✅ Accepts only primitive props (strings, numbers, booleans, simple callbacks)
- ✅ Has a single, focused responsibility
- ✅ Could theoretically be published as a standalone npm package

## Directory Structure

### `/buttons`
Basic interactive elements for user actions

### `/inputs`
Form controls and data entry components

### `/typography`
Text and content display elements

### `/layout`
Basic structural components

## Usage Guidelines

### DO ✅
- Keep components pure and stateless
- Use composition over configuration
- Provide clear, semantic prop interfaces
- Include TypeScript types for all props
- Follow DaisyUI/Tailwind conventions
- Export variant types for use in other components
- Use class-variance-authority (CVA) for managing component variants

### DON'T ❌
- Include business logic or API calls
- Use application-specific context or state
- Import from features or domain directories
- Create overly complex or multi-purpose components
- Use non-primitive prop types (except children/className)

## Variant Management with CVA

Use class-variance-authority (CVA) to create type-safe, maintainable component variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'btn', // base classes
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
      },
      size: {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ variant, size, className, ...props }) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
)
```

## Examples

### Good Primitive Component
```tsx
// Simple, reusable, no business logic, uses CVA for variants
export const Button = ({ variant, size, children, onClick }) => (
  <button className={buttonVariants({ variant, size })} onClick={onClick}>
    {children}
  </button>
)
```

### Not a Primitive
```tsx
// Has business logic and app context
export const SaveBookingButton = () => {
  const { booking } = useBookingContext()  // ❌ App context
  const { mutate } = useSaveBooking()      // ❌ API logic

  return <button onClick={() => mutate(booking)}>Save</button>
}
```

## Migration Notes
Components were migrated here from various locations following atomic design principles. All components in this directory should be regularly reviewed to ensure they maintain primitive characteristics as the application evolves.