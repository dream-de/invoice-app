# UI System Roadmap

Dream Invoice already has a solid UI foundation. The next design-system work
should be incremental: improve consistency and accessibility without rewriting
large app surfaces in one step.

## Direction

Use a professional B2B style:

- clear information density,
- calm neutral surfaces,
- restrained shadows,
- consistent form controls,
- visible keyboard focus,
- accessible status and error states.

Avoid large visual rewrites unless a page is already being touched for product
work.

## Phase 1: Safe Foundation Fixes

- Add accessible labels and dialog semantics to shared modal components.
- Keep shared form controls visually consistent.
- Connect form errors to controls with `aria-describedby`.
- Mark invalid controls with `aria-invalid`.
- Keep status badges text-based so color is not the only signal.

## Phase 2: Consistency

- Replace raw form controls in app pages with shared UI components.
- Move repeated hex colors into design tokens.
- Standardize border radius for controls and compact UI.
- Document component usage rules.

## Phase 3: Navigation And Mobile

- Verify mobile navigation behavior.
- Add breadcrumbs where nested pages need context.
- Ensure tables scroll safely on small screens.

## Phase 4: Larger Refresh

- Revisit heavy shadows and large corner radii.
- Add missing shared components such as tabs, tooltips, skeletons, and
  pagination.
- Consider Storybook or a lightweight component catalog.

## Working Rule

Make UI-system changes in small batches. Each batch should include lint and
typecheck verification before commit.
