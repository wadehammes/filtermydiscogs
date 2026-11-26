## Base class

Every factory extends [`BaseFactory`](../../src/tests/factories/BaseFactory.ts):
- **`build(attributes?, options?)`** — one instance; pass **`Partial<Type>`** overrides for fields the test cares about ( **`releaseFactory`** uses **`ReleaseFactoryAttributes`** — see [`Release.factory.ts`](../../src/tests/factories/Release.factory.ts)).
- **`buildList(n, attributes?, options?)`** — array of `n` instances.
- **`buildModel`** — optional when a domain class wraps the built type.

