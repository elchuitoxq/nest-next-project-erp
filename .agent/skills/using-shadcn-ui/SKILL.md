---
name: using-shadcn-ui
description: Use when building frontend components to ensure Shadcn UI standards, correct library versions, and accessibility patterns.
---

# Using Shadcn UI Standards

This skill defines the standards for building frontend components using Shadcn UI in this project. Adherence to these guidelines ensures design consistency, accessibility, and library compatibility.

## Core Principles

1.  **Shadcn First**: Always prefer using existing Shadcn UI components from `@/components/ui` over creating custom raw HTML/CSS elements.
2.  **Tailwind CSS**: Use Tailwind CSS utility classes for layout, spacing, and styling. Avoid custom CSS files or `style` attributes.
3.  **Lucide React**: Use `lucide-react` for all icons.
4.  **Radix UI**: Shadcn is built on Radix UI primitives. Understand the underlying accessibility features they provide.

## Component Specific Rules

### Calendar & DatePicker

- **Library Version**: This project uses `react-day-picker` **v8** (specifically `^8.10.1`) for compatibility with standard Shadcn components.
- **Do NOT** upgrade to v9 unless the entire Shadcn registry in the project is migrated.
- **Imports**: Import `Calendar` from `@/components/ui/calendar`.
- **Icons**: Ensure `ChevronLeft` and `ChevronRight` are properly passed to the `components` prop if customizing the `Calendar` component directly (though the standard component handles this).

### Forms

- **React Hook Form**: Use `react-hook-form` with `zod` resolvers.
- **Form Wrapper**: Always use the `<Form>` wrapper and `FormField` components from `@/components/ui/form`.
- **Validation**: Define schemas in a separate file (e.g., `feature.schema.ts`) using `zod`.

### Dialogs & Modals

- **Control**: Use the `open` and `onOpenChange` props for controlled dialogs.
- **Content**: Ensure `DialogContent` includes a `DialogHeader`, `DialogTitle`, and `DialogDescription` for accessibility.

### Data Tables

- **TanStack Table**: Use `@tanstack/react-table` for complex tables.
- **Structure**: Follow the pattern: `TableHeader` -> `TableRow` -> `TableHead` and `TableBody` -> `TableRow` -> `TableCell`.

## File Structure

- **UI Components**: Reusable, generic components live in `apps/web/components/ui`.
- **Feature Components**: Business-logic specific components live in `apps/web/modules/[module-name]/components`.

## Example: Standard Form Field

```tsx
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input placeholder="shadcn" {...field} />
      </FormControl>
      <FormDescription>This is your public display name.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```
