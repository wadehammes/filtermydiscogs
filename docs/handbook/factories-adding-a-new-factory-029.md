## Adding a new factory

1. Create **`src/tests/factories/<Name>.factory.ts`** extending **`BaseFactory`**.
2. Import **`faker`**, target type from **`src/types/`**, nested factories from **`src/tests/factories/`**.
3. Fill every field with **`faker.*`** or nested **`.build()`**; use **`nullish`** for nullable fields.
4. Add **`KeysMatch`** when the type has no index signature.
5. Export a **singleton** (`export const myTypeFactory = new MyTypeFactory()`).
6. Document the new row in the table above.

