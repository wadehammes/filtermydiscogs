## Collection notes (custom fields)

Discogs collection instances can include user-defined note fields (Media, Notes, etc.). Values are already present on each release in the **`/api/collection`** pagination payload as **`notes: [{ field_id, value }]`**. Normalize missing notes to **`[]`** when ingesting collection pages ([`useCollectionData.hook.ts`](../../src/hooks/useCollectionData.hook.ts)).

| Operation              | App route                                                      | Discogs API                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List field definitions | `GET /api/collection/fields?username=`                         | `GET /users/{username}/collection/fields`                                                                                                              |
| Read note values       | Included in collection pages                                   | `GET /users/{username}/collection/folders/0/releases`                                                                                                  |
| Update a note value    | `POST /api/collection/instances/{instanceId}/fields/{fieldId}` | `POST /users/{username}/collection/folders/{folder_id}/releases/{release_id}/instances/{instance_id}/fields/{field_id}` with body `{ "value": "..." }` |
| Update your rating     | `PUT /api/collection/releases/{releaseId}/rating`              | `PUT /releases/{release_id}/rating/{username}` with body `{ "rating": 1..5 }`                                                                          |
| Clear your rating      | `DELETE /api/collection/releases/{releaseId}/rating?username=` | `DELETE /releases/{release_id}/rating/{username}`                                                                                                      |

Client helpers: **`api.collectionFields`**, **`api.updateCollectionNote`**, **`api.updateReleaseRating`**, **`api.clearReleaseRating`** in [`src/api/urls.ts`](../../src/api/urls.ts). **`api.updateCollectionNote`** must tolerate empty success bodies from the app route (same as the Discogs **`204`** case).

React Query: **`useCollectionFieldsQuery`** ([`src/hooks/queries/useCollectionFieldsQuery.ts`](../../src/hooks/queries/useCollectionFieldsQuery.ts)) with **`CollectionFieldsQueryKeys`**.

Display/edit UI lives in [`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/). Note labels, search text, write helpers, and **multi text-field picker** helpers (**`sortTextCollectionFields`**, **`getInitialActiveTextFieldId`**, **`getReleaseNotesTextFieldPickerOptions`**, **`parseReleaseNotesTextFieldPickerValue`**, **`RELEASE_NOTES_TEXT_FIELD_PICKER_LABEL`**) are in [`src/utils/releaseNotes.ts`](../../src/utils/releaseNotes.ts). Picker helpers expect text fields **already sorted** by **`sortTextCollectionFields`** (Discogs **`position`**).

**Write requests** require `releaseId`, `folderId`, `instanceId`, and `fieldId`:
- **`releaseId`**: **`parseReleaseId`** prefers **`basic_information.id`**, then top-level **`id`**, then **`basic_information.resource_url`**.
- **`folderId`**: **`getReleaseFolderId`** reads **`release.folder_id`**; defaults to **`0`** (All) when missing.
- **`instanceId`**: collection item **`instance_id`**.

**Length limit:** Discogs does not document a single global max for free-text note values; the app enforces **`COLLECTION_NOTE_MAX_LENGTH` (10,000)** via [`releaseNotes.schemas.ts`](../../src/lib/validation/releaseNotes.schemas.ts) in [`NoteEditDialog`](../../src/components/ReleaseNotes/NoteEditDialog.component.tsx) (inline counter + React Hook Form / Zod validation) and [`collection.schemas.ts`](../../src/lib/validation/collection.schemas.ts) on **`POST /api/collection/instances/[instanceId]/fields/[fieldId]`**. Constant lives in [`src/constants/collection.ts`](../../src/constants/collection.ts).

**Ratings:** **`PUT /api/collection/releases/[releaseId]/rating`** validates **`username`** + **`rating`** (1–5) via [`collection.schemas.ts`](../../src/lib/validation/collection.schemas.ts); shared **`discogsUsernameSchema`** lives in [`discogs.shared.schemas.ts`](../../src/lib/validation/discogs.shared.schemas.ts).

**Editing scope:** text and textarea fields (**`isEditableCollectionField`**) plus Media/Sleeve Condition dropdowns (**`isConditionCollectionField`**, **`getEditableConditionFields`**) via shared **`ReleaseNotesFormFields`**. When the user has **more than one** text/textarea field, a **Note Field** **`Select`** shows one active textarea; option labels include link-colored **`(N chars)`** when trimmed value is non-empty (**`Select`** **`storedCharCount`**). All note field labels compose **[`field-label.module.css`](../../src/styles/modules/field-label.module.css)** (same uppercase muted style as filter controls and condition **`Select`** labels). Card editing uses **`NoteEditDialog`**; **`ReleaseModal`** uses **`ReleaseNotesModalEditor`** inline; crate rows use **`ReleaseNotesCrateScratchpad`** with the same picker when multiple text fields exist. **`releaseHasStoredConditionNotes`** keeps the modal notes section visible when only condition values are set. Condition values stay hidden from release-card/table display (**`forCard: true`** / **`isCardDisplayNoteField`**).

