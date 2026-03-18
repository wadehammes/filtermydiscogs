import { ImageResponse } from "next/og";
import { getPublicCrateForOg } from "src/lib/public-crate.server";

export const revalidate = 300;

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const crate = await getPublicCrateForOg(id);
  const title = crate?.name ?? "Crate";
  const line2 = crate?.username
    ? `by ${crate.username} · FilterMyDisco.gs`
    : "FilterMyDisco.gs";

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
