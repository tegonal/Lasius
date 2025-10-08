# Features

## Overview
Feature components are domain-specific, business-logic-aware components that implement complete features or pages. They represent the "templates" and "pages" in atomic design - the highest level of component composition that brings together primitives, UI components, and business logic to create functional features.

## Criteria for Feature Components
A component belongs in the features directory if it:
- ✅ Contains business logic specific to a feature or domain
- ✅ Integrates with APIs and manages data fetching
- ✅ Uses application context and state management
- ✅ Implements complete user workflows or page sections
- ✅ Combines multiple UI components with domain logic
- ✅ Is specific to the application's business requirements

## Directory Structure

### Feature domains are organized by business context:
- `/auth` - Authentication and authorization
- `/bookingHistory` - Time tracking history features
- `/invitation` - User invitation workflows
- `/login` - Login page and related components
- `/organisation` - Organization management features
- `/projects` - Project management features
- `/settings` - User and app settings
- `/system` - System-level features and utilities
- `/user` - User-specific features and profiles

## Usage Guidelines

### DO ✅
- Organize by feature/domain boundaries
- Keep related components together
- Use dependency injection for services
- Implement proper error handling
- Follow domain-driven design principles
- Reuse UI and primitive components

### DON'T ❌
- Create generic/reusable components here
- Mix features from different domains
- Expose internal feature logic globally
- Bypass the component hierarchy
- Import features into primitives or UI layers

## Architectural Principles

### Component Hierarchy
```
Features (this layer)
    ↓ uses
UI Components
    ↓ uses
Primitives
```

### Characteristics
- **Domain-focused**: Each subdirectory represents a business domain
- **Self-contained**: Features should be as independent as possible
- **State-aware**: Can use stores, context, and API integrations
- **Complete workflows**: Implement full user journeys

## Examples

### Feature Component (belongs here)
```tsx
// Complete booking feature with business logic
export const BookingHistory = () => {
  const { bookings } = useBookingAPI()      // ✅ API integration
  const { user } = useAuthStore()           // ✅ State management
  const { mutate } = useUpdateBooking()     // ✅ Business operations

  return (
    <PageLayout>
      <BookingFilters />
      <BookingTable data={bookings} />
      <BookingExport />
    </PageLayout>
  )
}
```

### Not a Feature Component
```tsx
// Generic table component
export const DataTable = ({ data, columns }) => (
  <table>...</table>  // ❌ Too generic, belongs in UI
)
```

## Migration Notes
Feature components were consolidated from various locations including:
- Page-specific components from `layout/pages/`
- Domain components from `components/[domain]/`
- System features from various locations

This organization provides clear boundaries between business domains and promotes maintainability through feature isolation.