import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";
import {
  type VercelFlagEntities,
  vercelFlagIdentify,
} from "src/lib/vercelFlagIdentify.server";

export const playlistsFeature = flag<boolean, VercelFlagEntities>({
  key: "playlists",
  description:
    "Cross-release playlists: side panel, track menus, playback add-to, and API",
  adapter: vercelAdapter(),
  defaultValue: false,
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
  identify: vercelFlagIdentify,
});
