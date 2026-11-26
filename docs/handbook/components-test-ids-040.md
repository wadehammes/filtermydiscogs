## Test IDs

- Component root: **`data-testid="fmd<ComponentName>"`** (PascalCase component name).
- Page object **`testId`** must match exactly.
- Specs query with **`screen.getByTestId(po.testId)`** after PO render setup.
