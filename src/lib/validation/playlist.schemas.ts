import { PLAYLIST_PUBLIC_DESCRIPTION_MAX_LENGTH } from "src/constants/publicPlaylist.constants";
import { userTrackMetadataBodySchema } from "src/lib/validation/userTrack.schemas";
import { z } from "zod";

const playlistNameFieldSchema = z
  .string()
  .trim()
  .min(1, "Playlist name is required")
  .max(120, "Playlist name must be 120 characters or less");

const playlistPublicDescriptionFieldSchema = z
  .string()
  .max(
    PLAYLIST_PUBLIC_DESCRIPTION_MAX_LENGTH,
    `Public description must be ${PLAYLIST_PUBLIC_DESCRIPTION_MAX_LENGTH} characters or less`,
  );

export const createPlaylistFormSchema = z.object({
  name: playlistNameFieldSchema,
  publicDescription: playlistPublicDescriptionFieldSchema,
});

export type CreatePlaylistFormValues = z.infer<typeof createPlaylistFormSchema>;

export const createPlaylistBodySchema = createPlaylistFormSchema
  .pick({ name: true })
  .extend({
    publicDescription: playlistPublicDescriptionFieldSchema.optional(),
  });

export const updatePlaylistBodySchema = z
  .object({
    name: playlistNameFieldSchema.optional(),
    private: z.boolean().optional(),
    publicDescription: playlistPublicDescriptionFieldSchema
      .nullable()
      .optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.private !== undefined ||
      body.publicDescription !== undefined,
    "At least one field is required",
  );

export const addPlaylistTrackBodySchema = userTrackMetadataBodySchema;

export const reorderPlaylistTracksBodySchema = z.object({
  track_keys: z.array(z.string().min(1).max(512)).min(1),
});

export const removePlaylistTrackBodySchema = z.object({
  track_key: z.string().min(1).max(512),
});

export const listPlaylistsQuerySchema = z.object({
  trackKey: z.string().min(1).max(512).optional(),
});
