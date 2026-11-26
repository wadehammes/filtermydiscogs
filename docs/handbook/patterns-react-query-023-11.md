**Orchestrators** (wire queries/mutations to context, atoms, or toasts): **`useCollectionData`**, **`useUserPreferencesSync`**, **`useCrateCollectionSync`**, **`useCrateMigration`** (legacy localStorage → **`useMigrateLegacyCrateMutation`**), **`DeploymentUpdateToast`**.

**`useCollectionData`** composes auth state + collection query + context dispatch for the releases/dashboard pages. Invalidate with **`DiscogsCollectionQueryKeys`** when the username changes ([`useCollectionData.hook.ts`](../../src/hooks/useCollectionData.hook.ts), [`auth.context.tsx`](../../src/context/auth.context.tsx)).

