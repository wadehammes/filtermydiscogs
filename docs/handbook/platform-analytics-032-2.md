- Settings → **Privacy** toggle updates consent and persists when authenticated; revoking reloads the page so injected GTM scripts stop.
- **Delete account** clears analytics consent (user is re-prompted). Normal logout does **not** reset consent.

Manual follow-up (out of repo): configure **Google Consent Mode v2** in the GTM container to default-deny until consent.

