# Form Components Structure Guide

## Required Component Hierarchy

Forms MUST follow this structure:

```
FormBody
  └── FieldSet (ALWAYS required, even for single group)
        └── FormElement
              ├── Label (automatic if label prop provided)
              └── Input/Component
  └── ButtonGroup (for buttons at end of form)
        └── Buttons (Submit, Cancel, etc.)

## Components

### FormBody
Outermost container providing consistent spacing and layout.

```tsx
<FormBody>
  {/* FieldSets go here */}
</FormBody>
```

### FieldSet
Groups related fields semantically. **Always use, even for a single group of fields.**

```tsx
<FieldSet legend="User Details">
  {/* FormElements go here */}
</FieldSet>
```

Props: `legend?`, `variant?` (default|bordered), `size?` (xs|sm|md|lg), `legendAlign?`, `legendSize?`

### FormElement
Transparent wrapper handling label-input relationship.

```tsx
<FormElement label="Email" htmlFor="email" required>
  <Input id="email" name="email" type="email" />
  <FormErrorBadge id="email-error" error={errors.email} />
</FormElement>
```

Props: `label?`, `htmlFor?`, `required?`, `children`

### ButtonGroup
Container for form action buttons. **Place directly under FormBody, after FieldSet(s).**

```tsx
<FormBody>
  <FieldSet>
    {/* form fields */}
  </FieldSet>
  <ButtonGroup>
    <Button type="submit">Submit</Button>
    <Button type="button" variant="secondary">Cancel</Button>
  </ButtonGroup>
</FormBody>
```

## Examples

### Single FieldSet Form

```tsx
<form onSubmit={handleSubmit}>
  <FormBody>
    <FieldSet>
      <FormElement label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" />
      </FormElement>
      <FormElement label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" />
      </FormElement>
    </FieldSet>
    <ButtonGroup>
      <Button type="submit">Sign In</Button>
    </ButtonGroup>
  </FormBody>
</form>
```

### Multiple FieldSets Form

```tsx
<form onSubmit={handleSubmit}>
  <FormBody>
    <FieldSet legend="Personal Information">
      <FormElement label="Name" htmlFor="name" required>
        <Input id="name" name="name" />
      </FormElement>
      <FormElement label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" />
      </FormElement>
    </FieldSet>

    <FieldSet legend="Security">
      <FormElement label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" />
      </FormElement>
    </FieldSet>

    <ButtonGroup>
      <Button type="submit">Create Account</Button>
    </ButtonGroup>
  </FormBody>
</form>
```

### With Custom Components

```tsx
<form onSubmit={handleSubmit}>
  <FormBody>
    <FieldSet>
      <FormElement label={t('projects.label')} htmlFor="projectId" required>
        <InputSelectAutocomplete
          id="projectId"
          name="projectId"
          suggestions={projectSuggestions}
          required
        />
      </FormElement>
      <FormElement label={t('tags.label')} htmlFor="tags">
        <InputTagsAutocomplete id="tags" name="tags" suggestions={tagSuggestions} />
      </FormElement>
    </FieldSet>
    <ButtonGroup>
      <Button type="submit">Save</Button>
    </ButtonGroup>
  </FormBody>
</form>
```

## DaisyUI Join Classes

Use `join` classes to visually connect inputs with buttons (e.g., calendar buttons, search actions):

```tsx
<FormElement label="Date" htmlFor="date">
  <div className="join">
    <Input id="date" name="date" className="join-item" />
    <CalendarButton className="join-item" onClick={openCalendar} />
  </div>
</FormElement>
```

For vertical stacking, use `join-vertical`:

```tsx
<FormElement label="Date Range" htmlFor="dateRange">
  <div className="join join-vertical">
    <Input id="startDate" name="startDate" className="join-item" placeholder="Start date" />
    <Input id="endDate" name="endDate" className="join-item" placeholder="End date" />
  </div>
</FormElement>
```

## Key Principles

- **Always use FormBody → FieldSet → FormElement structure**
- **FieldSet is required even for single groups**
- **FormElement is transparent** - outputs label and children directly
- **Accessibility**: Match `htmlFor` with input `id`, use `aria-describedby` for errors
- **DaisyUI Integration**: Components use DaisyUI classes with CVA for variants