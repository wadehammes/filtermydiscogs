import { userTrackMetadataBodySchema } from "src/lib/validation/userTrack.schemas";
import { z } from "zod";

const playlistNameFieldSchema = z
  .string()
  .trim()
  .min(1, "Playlist name is required")
  .max(120, "Playlist name must be 120 characters or less");

export const createPlaylistBodySchema = z.object({
  name: playlistNameFieldSchema,
});

export type CreatePlaylistFormValues = z.infer<typeof createPlaylistBodySchema>;

export const updatePlaylistBodySchema = z.object({
  name: playlistNameFieldSchema,
});

export const addPlaylistTrackBodySchema = userTrackMetadataBodySchema;

export const reorderPlaylistTracksBodySchema = z.object({
  track_keys: z.array(z.string().min(1).max(512)).min(1),
});

export const removePlaylistTrackBodySchema = z.object({
  track_key: z.string().min(1).max(512),
});
