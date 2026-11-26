## API and server

| If you need… | Use | Not |
| ------------ | --- | --- |
| Browser calls our App Router APIs | **`api.*`** in [`src/api/urls.ts`](../../src/api/urls.ts) | Inline `/api/...` strings in components |
| New authenticated JSON response | **`privateRouteJson`** / **`createErrorResponse`** | Ad-hoc `Response.json` shapes |
| Request body/query validation on routes | Zod in [`src/lib/validation/`](../../src/lib/validation/) + [`parseRequestBody`](../../src/lib/validation/parseRequestBody.ts) | Inline validation in the handler |
| Discogs upstream calls | [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) | Unsigned `fetch` to Discogs |
| Username validation in routes | **`isValidDiscogsUsername`** | Copy-paste regex |

Details: [api-routes.md](api-routes.md), [database.md → API routes](database.md#api-routes), [discogs.md](discogs.md).

