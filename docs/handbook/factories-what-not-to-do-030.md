## What not to do

- Do not colocate factories under **`src/components/`**.
- Do not use **Rosie** or hand-maintained JSON fixtures when a factory would stay in sync with types.
- Do not share assertion strings via exported constants between PO and spec—duplicate literals intentionally.
- Do not hand-write inline mock objects for typed domain/API data when a factory or preset already exists (or should exist)—see [Always use factories](#always-use-factories).

