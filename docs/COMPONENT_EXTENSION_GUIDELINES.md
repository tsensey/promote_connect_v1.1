# Component Extension Guidelines

This document provides guidelines for creating and using custom components that extend the shadcn/ui foundation in Promote-Connect.

## Philosophy

We extend rather than replace shadcn/ui components to:
- Leverage battle-tested primitives and accessibility
- Maintain consistency with upstream updates
- Reduce duplication of common patterns
- Focus our efforts on application-specific enhancements

## When to Create Custom Components

Create a custom component when you need to:

1. **Combine multiple shadcn primitives** with specific layout/logic
   - Example: ButtonWithIcon (Button + Spinner + conditional layout)
   - Example: FormField (Label + Input/Textarea/Select + helper/error text)

2. **Apply consistent variants/properties** across multiple use cases
   - Example: EnhancedCard with featured/actions/expandable variants
   - Example: AvatarGroup with overlapping avatars and count

3. **Encapsulate complex state or behavior**
   - Example: ButtonWithIcon loading state management
   - Example: EnhancedCard expandable state

4. **Provide application-specific semantics**
   - Components that represent domain concepts (EventCard, UserProfileCard, etc.)

## When NOT to Create Custom Components

Avoid creating custom components when:

1. **Simple variant changes** can be achieved with props
   - Instead of: `PrimaryButton`, `SecondaryButton`
   - Use: `<Button variant="primary" />`, `<Button variant="secondary" />`

2. **One-off styling** that doesn't repeat
   - Use Tailwind utility classes directly for unique cases
   - Consider if the pattern might emerge before creating a component

3. **Functionality already covered** by existing shadcn components
   - Check the shadcn/ui documentation first
   - Look in `@base-ui/react` for available primitives

## Structure

Custom components live in: `components/custom/`

Each custom component should:
- Export a single default component function
- Re-export relevant types/variants from base components when appropriate
- Include comprehensive JSDoc documentation
- Follow existing TypeScript and React conventions
- Be fully accessible (WCAG 2.1 AA)
- Be responsive and mobile-first

## Naming Conventions

- Use descriptive, specific names: `ButtonWithIcon`, `EnhancedCard`, `FormField`
- Avoid generic names that could conflict: prefer `EventCard` over `CardV2`
- For variants, use descriptive names: `featured`, `actions`, `expandable` rather than `v1`, `v2`
- Prefix with application domain when relevant: `EventCalendar`, `UserProfileHeader`

## Implementation Guidelines

### 1. Extending Base Components

```tsx
// Good: Extending and enhancing
import { Button } from "@/components/ui/button";

interface ButtonWithIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
}

export function ButtonWithIcon({ icon, iconOnly = false, loading = false, ...props }) {
  return (
    <Button {...props}>
      {loading ? <Spinner /> : icon}
      {!iconOnly && <span>{props.children}</span>}
    </Button>
  );
}

// Avoid: Reimplementing from scratch when not necessary
// Unless you need fundamentally different behavior
```

### 2. Type Safety

- Extend base component props when adding features:
  ```tsx
  interface MyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // your additional props
  }
  ```
- Use generic constraints when wrapping:
  ```tsx
  interface WrapperProps<T extends React.ReactNode> {
    children: T;
    // ...
  }
  ```

### 3. Accessibility

- Don't remove or override accessibility features from base components
- Add appropriate ARIA labels, roles, and states for new functionality
- Ensure keyboard navigability for interactive elements
- Test with screen readers for custom interactions
- Maintain focus management and trap focus where appropriate

### 4. Styling

- Use `cn` utility for conditional class merging
- Respect the base component's styling API
- Add your custom classes without breaking base functionality
- Consider CSS custom properties for themeability
- Test in both light and dark modes

### 5. Performance

- Memoize expensive calculations with `useMemo`/`useCallback`
- Consider `React.memo` for components with stable props
- Lazy load dependencies when appropriate
- Avoid unnecessary re-renders

## Documentation

Each custom component should include:

1. **Purpose statement**: What problem does this solve?
2. **Usage examples**: Common patterns with code samples
3. **Props documentation**: Types, defaults, and descriptions
4. **Variants**: If applicable, list and describe each variant
5. **Accessibility notes**: Any special considerations
6. **Examples**: Visual examples in Storybook or similar

## Publishing to Storybook

When adding to Storybook:
- Create stories in `components/custom/[ComponentName].stories.tsx`
- Include all variants and common use cases
- Show interactive states (hover, focus, loading, disabled)
- Add accessibility notes and keyboard controls
- Test with different themes and viewport sizes

## Migration Strategy

When replacing existing implementations:

1. **Identify usage**: Search for patterns that match your component
2. **Create the component**: Build it following these guidelines
3. **Replace incrementally**: Update one usage at a time
4. **Test thoroughly**: Ensure no regressions in functionality or appearance
5. **Document the change**: Update any relevant documentation

## Examples of Good Extensions

See: `components/custom/ButtonWithIcon.tsx`, `EnhancedCard.tsx`, `FormField.tsx`

## Examples of When NOT to Extend

- Simple color/size variations → use props on base component
- One-off layout tweaks → use utility classes or local component
- Behavioral changes that break base contract → consider if extension is right approach