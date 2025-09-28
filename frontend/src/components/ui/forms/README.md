# UI Forms

## Overview
Form components are UI-level components that integrate with form libraries like React Hook Form. Unlike primitive inputs which are pure and stateless, form components handle validation, form context, and complex form behaviors.

## Criteria for Form Components
A component belongs in the ui/forms directory if it:
- ✅ Uses form context (React Hook Form, Formik, etc.)
- ✅ Handles validation logic
- ✅ Manages form state or submission
- ✅ Coordinates multiple form fields
- ✅ Provides form-specific behaviors (auto-save, field dependencies)
- ✅ Integrates with form libraries

## Difference from Primitives/Inputs
- **Primitives/Inputs**: Pure, stateless, no form library dependencies
- **UI/Forms**: Form-aware, uses validation, integrates with form context

## Examples

### Form Component (belongs here)
```tsx
// Uses form context and validation
export const DateRangeFilter = () => {
  const { control, setValue } = useFormContext()  // ✅ Form context

  return (
    <Controller
      control={control}
      rules={{ validate: customValidation }}  // ✅ Validation
      render={...}
    />
  )
}
```

### Primitive Input (does NOT belong here)
```tsx
// Pure input without form dependencies
export const Input = ({ value, onChange }) => (
  <input value={value} onChange={onChange} />  // ❌ No form context
)
```

## Guidelines
- Always use form context for validation and state management
- Compose from primitive inputs when possible
- Keep form-specific logic isolated from presentation
- Document complex validation rules