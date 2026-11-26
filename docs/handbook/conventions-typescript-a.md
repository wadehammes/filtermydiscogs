## TypeScript

- **Blank line after declarations.** After `const` / `let` declarations in a function or block, leave one blank line before the next statement when that statement is control flow (`if`, `for`, `while`, `switch`, `try`) or a `return` (or other logic that is not another declaration). Do not insert a blank line between consecutive declarations that form one setup block.

```ts
const username = searchParams.get("username");

if (!username) {
  return NextResponse.json({ error: "Username is required" }, { status: 400 });
}
```

- **Use arrow functions always.** Prefer `const fn = () => {}` over `function fn() {}` for components and helpers. **Exception:** Next.js route handlers and some `page.tsx` / `layout.tsx` exports may use `export async function GET` or `export default function Page` where the framework expects it.
- **If blocks always use `{}`.** Same for `else`, `for`, `while`, and `do`—never omit braces for single-line bodies.
- **Never use `any`.** Use proper types for props, state, and function signatures.
- **Components**: Use arrow functions where you control the export (e.g. `export const MyComponent = (props: Props) => { ... }`). Do not use `React.FC` / `FC` in new code; prefer typed props on arrow components. When editing older context files that still use `FC`, match the surrounding file unless you are refactoring that module.
- **Never use non-null assertion (`!`).** Use optional chaining, nullish coalescing (`??`), or explicit checks instead. For **`Buffer`**, index access **`buf[i]`** is typed as possibly **`undefined`** even inside bounds — prefer **`buf.readUInt8(i)`** (or similar) when you need a definite byte without `!`. For uniform random indices into a fixed alphabet, prefer **`crypto.randomInt`** (avoids modulo bias from raw bytes) — see OAuth nonce in [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts).
- **Ref bags:** Type shared **`useRef`** handles as **`RefObject<T>`** in hook params and utils — **`MutableRefObject`** is deprecated in React 19 **`@types/react`**.
- **Omit redundant return types** when the compiler can infer them. Add return types only for public API clarity or when inference would be wrong or unclear.
- **No nested ternaries.** Use `if`/`else` or extract to a variable or helper. A single ternary is fine; nesting is not.
- **No barrel files.** Do not add `index.ts` (or `index.tsx`) that re-export from other modules under `src/`. Import directly from the target file (e.g. `from "src/components/ReleaseCard/ReleaseCard.component"`). **Exception:** [`src/types/index.ts`](../../src/types/index.ts) aggregates shared domain/API types for historical imports — prefer importing from the defining `*.types.ts` file in new code.
- **Absolute imports (`src/…`).** Import application TS/TSX with paths rooted at `src/`. Do not use `../` across `src/` boundaries unless an exception below applies.
- **Exceptions to absolute imports:** (1) **CSS Modules** and static assets co-located with the importer (e.g. `import styles from "./MyComponent.module.css"`). (2) **Factory imports** within `src/tests/factories/` may use relative imports to sibling factories. (3) When reintroducing Vercel Flags SDK definitions, keep root **`flags.ts`** outside **`src/`** and add a **`paths`** / Jest mapper alias if needed — do not import **`../../flags`** from **`src/`**.
- **Do not re-export types (or values) from another module** just to shorten import paths. Consumers import from the defining module. Do not re-export types from a component file; use `src/types/` or a colocated `*.types.ts` if needed. **Exception — context hook barrels** ([`crate.context.tsx`](../../src/context/crate.context.tsx), [`releasePlayback.context.tsx`](../../src/context/releasePlayback.context.tsx), [`ReleaseNotesEditor.context.tsx`](../../src/components/ReleaseNotes/ReleaseNotesEditor.context.tsx), [`ReleaseNotesCollectionFields.context.tsx`](../../src/components/ReleaseNotes/ReleaseNotesCollectionFields.context.tsx)): re-export **`XProvider`** and **hooks** for a stable app import path; keep **`createContext`** exports on **`*Contexts.tsx`** / **`ReleaseNotesEditorContext.tsx`** / **`ReleaseNotesCollectionFieldsContext.tsx`** only ([patterns.md → Large context providers](patterns.md#large-context-providers-playback-crates-notes-editor)). **`useReleasePlaybackState`** is defined in [`useReleasePlaybackState.hook.ts`](../../src/context/useReleasePlaybackState.hook.ts) and re-exported from the playback barrel — **`useTrackListenRecorder`** imports the defining module to avoid provider import cycles.
