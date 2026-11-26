## Discogs API service

[`DiscogsOAuthService`](../../src/services/discogs-oauth.service.ts) centralizes:
- OAuth header generation
- **`getIdentity`**, **`getUserProfile`** ( **`avatar_url`** for header account pill), **`getCollection`**, **`getCollectionFields`**, **`updateCollectionInstanceField`**, **`api.updateReleaseRating`**, **`deleteReleaseRating`**, **`getCollectionValue`**, **`search`**, release fetches
- Error handling for HTTP failures (including mapping upstream 5xx to clearer client responses where implemented)
- **Empty success bodies**: Discogs often returns **`204 No Content`** (or an empty body) for successful field writes. **`makeAuthenticatedRequest`** treats **`204`/`205`** and empty bodies as success—do not call **`response.json()`** on those responses.

All Discogs HTTP calls include a **`User-Agent`** identifying the app (required by Discogs API terms).

