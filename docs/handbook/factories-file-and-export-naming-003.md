## File and export naming

- **One factory per file**: `Release.factory.ts` → **`releaseFactory`** (camelCase singleton).
- **Options type** in the same file: `ReleaseFactoryOptions`, or `Record<string, never>` when there are no options.

