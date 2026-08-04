import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "src/constants/siteMetadata";
import { getPublicCrateForOg } from "src/lib/public-crate.server";

async function getCachedCrateForOg(id: string) {
  "use cache";
  cacheLife({ revalidate: 300 });

  return getPublicCrateForOg(id);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const crate = await getCachedCrateForOg(id);
  const title = crate?.name ?? "Crate";
  const line2 = crate?.username
    ? `by ${crate.username} · ${SITE_NAME}`
    : SITE_NAME;

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
      <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9 }}>{line2}</div>
    </div>,
    {
      height: 630,
      width: 1200,
    },
  );
}
