import { ImageResponse } from "next/og";

export const alt = "FilterMyDisco.gs";

export const contentType = "image/png";

export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
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
      <div style={{ fontSize: 56, fontWeight: 700 }}>FilterMyDisco.gs</div>
      <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9 }}>
        Discogs collection management
      </div>
    </div>,
    { ...size },
  );
}
