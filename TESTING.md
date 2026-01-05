# Testing Guide

## Test Suite Overview

Comprehensive test coverage for the crate functionality including:

- ✅ API Routes
- ✅ React Query Hooks
- ✅ Context/State Management
- ✅ Components
- ✅ Custom Hooks

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:file

# Run tests in CI mode
pnpm test:ci

# Run a specific test file
pnpm test src/app/api/crates/__tests__/route.test.ts
```

## Test Structure

### Test Utilities

Located in `src/tests/utils/`:

- **`testQueryClient.tsx`**: Creates a test QueryClient with disabled retries
- **`testProviders.tsx`**: Wrapper component with all context providers

### Test Mocks

Located in `src/tests/mocks/`:

- **`mockPrisma.ts`**: Mock Prisma Client for testing database operations

## Test Coverage

### API Routes

#### `/api/crates` (`src/app/api/crates/__tests__/route.test.ts`)
- ✅ GET: Returns crates for authenticated user
- ✅ GET: Returns 401 if not authenticated
- ✅ GET: Creates default crate if none exists
- ✅ POST: Creates new crate
- ✅ POST: Returns 409 if crate name exists
- ✅ POST: Validates crate name is required

#### `/api/crates/[id]` (`src/app/api/crates/[id]/__tests__/route.test.ts`)
- ✅ GET: Returns crate with releases
- ✅ GET: Returns 404 if crate not found
- ✅ PUT: Updates crate name
- ✅ PUT: Makes crate default and unsets others
- ✅ DELETE: Deletes a crate
- ✅ DELETE: Prevents deleting last crate

#### `/api/crates/[id]/releases` (`src/app/api/crates/[id]/releases/__tests__/route.test.ts`)
- ✅ POST: Adds release to crate
- ✅ POST: Returns 409 if release already in crate
- ✅ POST: Returns 401 if not authenticated

### React Query Hooks

#### `useCratesQuery` (`src/hooks/queries/__tests__/useCratesQuery.test.ts`)
- ✅ Fetches crates successfully
- ✅ Handles fetch errors
- ✅ Does not fetch if user not authenticated

#### `useCrateQuery` (`src/hooks/queries/__tests__/useCratesQuery.test.ts`)
- ✅ Fetches single crate successfully
- ✅ Does not fetch if crateId is null

#### Mutations (`src/hooks/queries/__tests__/useCrateMutations.test.ts`)
- ✅ `useCreateCrateMutation`: Creates crate
- ✅ `useUpdateCrateMutation`: Updates crate
- ✅ `useDeleteCrateMutation`: Deletes crate
- ✅ `useAddReleaseToCrateMutation`: Adds release
- ✅ `useRemoveReleaseFromCrateMutation`: Removes release
- ✅ All mutations handle errors correctly

### Context

#### `CrateProvider` (`src/context/__tests__/crate.context.test.tsx`)
- ✅ Provides crates from query
- ✅ Sets default crate as active on mount
- ✅ Creates crate and switches to it
- ✅ Updates crate
- ✅ Deletes crate
- ✅ Adds release to crate
- ✅ Removes release from crate
- ✅ Toggles drawer
- ✅ Selects crate

### Components

#### `CrateDrawer` (`src/components/CrateDrawer/__tests__/CrateDrawer.test.tsx`)
- ✅ Renders empty state when no releases
- ✅ Renders releases list
- ✅ Calls removeFromCrate when remove button clicked
- ✅ Shows clear crate dialog
- ✅ Shows delete crate dialog
- ✅ Hides delete button for default crate
- ✅ Shows make default button for non-default crates
- ✅ Shows make default dialog

#### `CrateSelector` (`src/components/CrateSelector/__tests__/CrateSelector.test.tsx`)
- ✅ Renders crate selector with crates
- ✅ Shows create form when new crate button clicked
- ✅ Creates crate when form submitted
- ✅ Cancels create form
- ✅ Shows loading state

### Custom Hooks

#### `useCrateSync` (`src/hooks/__tests__/useCrateSync.test.ts`)
- ✅ Does not sync if user not authenticated
- ✅ Syncs when collection data available
- ✅ Does not sync if collection data not ready

## Writing New Tests

### Example: Testing an API Route

```typescript
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createMockPrisma } from "src/tests/mocks/mockPrisma";

jest.mock("src/lib/db", () => ({
  prisma: createMockPrisma().crate,
}));

describe("/api/crates", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  it("should return crates", async () => {
    mockPrisma.crate.findMany = jest.fn().mockResolvedValue([]);

    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "123456" }),
      },
    } as unknown as NextRequest;

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
  });
});
```

### Example: Testing a Component

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "../MyComponent";
import { TestProviders } from "src/tests/utils/testProviders";

jest.mock("src/context/crate.context", () => ({
  useCrate: jest.fn(),
}));

describe("MyComponent", () => {
  beforeEach(() => {
    require("src/context/crate.context").useCrate.mockReturnValue({
      crates: [],
      activeCrateId: null,
    });
  });

  it("should render", () => {
    render(<MyComponent />, { wrapper: TestProviders });
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Example: Testing a Hook

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMyHook } from "../useMyHook";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";

describe("useMyHook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it("should work", async () => {
    const { result } = renderHook(() => useMyHook(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

## Best Practices

1. **Mock External Dependencies**: Always mock Prisma, fetch, and context providers
2. **Use Test Utilities**: Use `TestProviders` and `createTestQueryClient` for consistent setup
3. **Clean Up**: Use `beforeEach` to reset mocks between tests
4. **Test User Interactions**: Use `@testing-library/user-event` for realistic interactions
5. **Test Error Cases**: Don't just test happy paths - test error handling too
6. **Test Edge Cases**: Test null/undefined values, empty arrays, etc.

## Continuous Integration

Tests run automatically in CI via `pnpm test:ci`. Make sure all tests pass before merging PRs.

## Coverage Goals

- **API Routes**: 100% coverage
- **Hooks**: 90%+ coverage
- **Components**: 80%+ coverage
- **Context**: 90%+ coverage

## Debugging Tests

```bash
# Run tests with verbose output
pnpm test --verbose

# Run a specific test file
pnpm test src/app/api/crates/__tests__/route.test.ts

# Run tests in watch mode for a file
pnpm test:file src/app/api/crates/__tests__/route.test.ts
```

