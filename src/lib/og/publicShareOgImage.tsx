import { SITE_DOMAIN_LABEL } from "src/constants/siteMetadata";
import { formatDate } from "src/utils/dateHelpers";
import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";

const OG_COLLAGE_SIDE_PX = 630;
const OG_COLLAGE_CELL_PX = OG_COLLAGE_SIDE_PX / 2;

const OG_GRADIENT = "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";

export const PUBLIC_SHARE_OG_FONT_FAMILY = "DM Sans";

export type PublicShareOgKind = "playlist" | "crate";

export type PublicShareOgItemNoun = "track" | "release";

const KIND_LABEL: Record<PublicShareOgKind, string> = {
  crate: "Crate",
  playlist: "Playlist",
};

const textSideStyle = {
  background: "#000",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  fontFamily: PUBLIC_SHARE_OG_FONT_FAMILY,
  justifyContent: "space-between",
} as const;

export type PublicShareOgImageProps = {
  title: string;
  username: string | null;
  coverThumbUrls: string[];
  itemCount: number | null;
  itemNoun: PublicShareOgItemNoun;
  kind: PublicShareOgKind;
  updatedAt: string | null;
};

export const buildPublicShareOgCountLabel = (
  count: number | null | undefined,
  noun: PublicShareOgItemNoun,
): string | null => {
  if (count == null) {
    return null;
  }

  return `${count} ${count === 1 ? noun : `${noun}s`}`;
};

export const buildPublicShareOgUpdatedLabel = (
  updatedAt: string | null | undefined,
): string | null => {
  if (!updatedAt || Number.isNaN(new Date(updatedAt).getTime())) {
    return null;
  }

  const formatted = formatDate(updatedAt);
  if (!formatted || formatted === "Invalid Date") {
    return null;
  }

  return `Updated ${formatted}`;
};

const OgMetaChip = ({ label, offset }: { label: string; offset: boolean }) => (
  <div
    style={{
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: 999,
      display: "flex",
      fontSize: 22,
      lineHeight: 1,
      marginLeft: offset ? 12 : 0,
      padding: "12px 18px",
    }}
  >
    {label}
  </div>
);

const OgCopy = ({
  title,
  username,
  itemCount,
  itemNoun,
  kind,
  updatedAt,
  titleSize,
}: Omit<PublicShareOgImageProps, "coverThumbUrls"> & { titleSize: number }) => {
  const countLabel = buildPublicShareOgCountLabel(itemCount, itemNoun);
  const updatedLabel = buildPublicShareOgUpdatedLabel(updatedAt);
  const meta = [countLabel, updatedLabel].filter(
    (label): label is string => label != null,
  );

  return (
    <div
      style={{
        ...textSideStyle,
        alignItems: "flex-start",
        flex: 1,
        height: "100%",
        padding: 56,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 20 }}>
          <div style={{ fontWeight: 700 }}>{KIND_LABEL[kind]}</div>
          <div style={{ marginLeft: 12, opacity: 0.45 }}>·</div>
          <div style={{ letterSpacing: 0.4, marginLeft: 12, opacity: 0.62 }}>
            {SITE_DOMAIN_LABEL}
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            height: 3,
            marginTop: 22,
            width: 56,
          }}
        />
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.12,
            marginTop: 28,
          }}
        >
          {title}
        </div>
        {username ? (
          <div style={{ fontSize: 24, marginTop: 18, opacity: 0.78 }}>
            {`by ${username}`}
          </div>
        ) : null}
      </div>
      {meta.length > 0 ? (
        <div style={{ display: "flex", marginTop: 40 }}>
          {meta.map((label, index) => (
            <OgMetaChip key={label} label={label} offset={index > 0} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const PublicShareOgImage = ({
  title,
  username,
  coverThumbUrls,
  itemCount,
  itemNoun,
  kind,
  updatedAt,
}: PublicShareOgImageProps) => {
  const collageUrls = coverThumbUrls.slice(0, PLAYLIST_HERO_MOSAIC_MAX_TILES);
  const hasCollage = collageUrls.length > 0;
  const copy = (
    <OgCopy
      itemCount={itemCount}
      itemNoun={itemNoun}
      kind={kind}
      title={title}
      titleSize={hasCollage ? 48 : 64}
      updatedAt={updatedAt}
      username={username}
    />
  );

  if (!hasCollage) {
    return copy;
  }

  return (
    <div
      style={{
        background: OG_GRADIENT,
        color: "#fff",
        display: "flex",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          height: OG_COLLAGE_SIDE_PX,
          width: OG_COLLAGE_SIDE_PX,
        }}
      >
        {Array.from({ length: PLAYLIST_HERO_MOSAIC_MAX_TILES }, (_, index) => {
          const url = collageUrls[index];

          return (
            <div
              key={url ?? `empty-${index}`}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                display: "flex",
                height: OG_COLLAGE_CELL_PX,
                overflow: "hidden",
                width: OG_COLLAGE_CELL_PX,
              }}
            >
              {url ? (
                <img
                  alt=""
                  height={OG_COLLAGE_CELL_PX}
                  src={url}
                  style={{ objectFit: "cover" }}
                  width={OG_COLLAGE_CELL_PX}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {copy}
    </div>
  );
};
