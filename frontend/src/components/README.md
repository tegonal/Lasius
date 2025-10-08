# Component Architecture

## Overview
This directory contains all React components organized following atomic design principles. Components are categorized into three hierarchical layers based on their complexity, reusability, and business logic awareness.

## Component Hierarchy

```
Features
    ↓ uses
UI Components
    ↓ uses
Primitives
```

## The Three Categories

### 1. `/primitives` - Foundation Layer
**The atoms of our component system**

Basic, pure components with no business logic or application context. These are the smallest building blocks that could theoretically be published as a standalone npm package.

**Examples**: Button, Input, Text, Badge, Label

### 2. `/ui` - Composition Layer
**The molecules and organisms**

Composed components that combine primitives and other UI components to create reusable patterns. They handle UI state and behavior but remain domain-agnostic.

**Examples**: Modal, DataTable, Card, NavigationMenu, DatePicker

### 3. `/features` - Business Layer
**The templates and pages**

Domain-specific components that implement complete features with business logic, API integrations, and state management. These are organized by business domain.

**Examples**: BookingHistory, UserProfile, OrganizationSettings, ProjectManagement

## Naming Conventions

### File Naming
- **Components**: PascalCase with `.tsx` extension
  - `Button.tsx`, `DataTable.tsx`, `BookingHistory.tsx`
- **Hooks**: camelCase starting with `use`
  - `useModal.tsx`, `useToast.tsx`
- **Utilities**: camelCase with `.ts` extension
  - `dateHelpers.ts`, `validation.ts`
- **Types**: PascalCase with `.types.ts` extension
  - `Button.types.ts`, `Modal.types.ts`

### Component Naming
- **Export name matches filename**: `Button.tsx` exports `Button`
- **Descriptive and specific**: `UserAvatar` not just `Avatar`
- **Avoid generic names**: `ProjectCard` not just `Card` (unless in primitives)

### Directory Structure
- **Group by function**: `/buttons`, `/inputs`, `/overlays`
- **Feature domains**: `/auth`, `/projects`, `/user`
- **Keep related files together**: Component, types, and tests in same directory

## Quick Decision Guide

**Where does my component belong?**

Ask yourself:
1. **Does it have business logic or API calls?** → `/features`
2. **Does it compose multiple components into a pattern?** → `/ui`
3. **Is it a basic, pure presentation component?** → `/primitives`

**Can it be used in any application?**
- ✅ Yes → `/primitives` or `/ui`
- ❌ No, it's specific to Lasius → `/features`

**Does it know about the domain (users, projects, bookings)?**
- ✅ Yes → `/features`
- ❌ No → `/primitives` or `/ui`

## Component Standards

### All Components Must:
- Be written in TypeScript with proper types
- Include the AGPL license header
- Follow existing code style and patterns
- Use Tailwind CSS and DaisyUI classes
- Implement accessibility best practices

### Variant Management
- Use **class-variance-authority (CVA)** for component variants
- Define variants in a type-safe, maintainable way
- Leverage DaisyUI component classes as base styles

### Import Rules
- Features can import from UI and Primitives
- UI can import from Primitives only
- Primitives cannot import from UI or Features
- Never create circular dependencies

## Hybrid Components & Coherence

### The Importance of Colocation
**Coherence and colocation of related code** is important for maintainability. When you have a system of components that work tightly together:

1. **Keep the entire system in one place** - don't split related components across multiple directories
2. **Choose the appropriate layer based on the highest-level component** - if any component has business logic, the entire system belongs in `/features`
3. **Maintain natural cohesion** - components that are always used together should live together

### The Clear Rule
**If a component has domain/project-specific state or business logic, it belongs in `/features`**

This rule is absolute. There are no exceptions.

### Example: Context Menu
The context menu (`/ui/overlays/contextMenu`) contains both pure UI components and business logic components. Since it has business logic, it should be moved to `/features`. The fact that it's currently in `/ui` is a violation that needs to be corrected.

### How to Handle Hybrid Systems
When you have a hybrid component system:
1. Identify if any component has business logic or domain knowledge
2. If yes → entire system goes to `/features`
3. If no → can stay in `/ui` or `/primitives` based on complexity
4. Keep all related components together for coherence

## Migration Status
This structure was established through a comprehensive migration following atomic design principles. All components have been audited and placed in their semantically correct locations. New components should follow these established patterns.

## Further Reading
- See individual README files in each category for detailed guidelines
- Check CLAUDE.md for project-wide conventions
- Review existing components for pattern examples