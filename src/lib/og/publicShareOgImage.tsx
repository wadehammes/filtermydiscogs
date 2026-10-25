import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";

const OG_COLLAGE_SIDE_PX = 630;
const OG_COLLAGE_CELL_PX = OG_COLLAGE_SIDE_PX / 2;

const OG_GRADIENT = "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";

export type PublicShareOgImageProps = {
  title: string;
  line2: string;
  coverThumbUrls: string[];
};

export const PublicShareOgImage = ({
  title,
  line2,
  coverThumbUrls,
}: PublicShareOgImageProps) => {
  const collageUrls = coverThumbUrls.slice(0, PLAYLIST_HERO_MOSAIC_MAX_TILES);
  const hasCollage = collageUrls.length > 0;

  if (!hasCollage) {
    return (
      <div
        style={{
          alignItems: "center",
          background: OG_GRADIENT,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          fontSize: 48,
          height: "100%",
          justifyContent: "center",
          padding: 64,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9 }}>{line2}</div>
      </div>
    );
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
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.15 }}>
          {title}
        </div>
        <div style={{ fontSize: 26, marginTop: 20, opacity: 0.9 }}>{line2}</div>
      </div>
    </div>
  );
};
