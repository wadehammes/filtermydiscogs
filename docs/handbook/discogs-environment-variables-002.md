## Environment variables

| Variable                  | Where used                                                         |
| ------------------------- | ------------------------------------------------------------------ |
| `DISCOGS_CONSUMER_KEY`    | OAuth consumer key (server + exposed via `next.config` `env`)      |
| `DISCOGS_CONSUMER_SECRET` | OAuth consumer secret (server only in practice)                    |
| `DISCOGS_CALLBACK_URL`    | OAuth callback (default `http://localhost:6767/api/auth/callback`) |
| `DISCOGS_API_USER_AGENT`  | Optional override for Discogs API `User-Agent` header              |

Register the callback URL in the [Discogs developer app](https://www.discogs.com/settings/developers) for each environment.

