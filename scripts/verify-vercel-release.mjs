import path from "node:path";
import { pathToFileURL } from "node:url";

export function evaluateMembership(membership) {
  const raw = membership?.role;
  const role =
    raw == null || raw === ""
      ? ""
      : typeof raw === "string"
        ? raw
        : String(raw);

  if (role === "OWNER" || role === "MEMBER") {
    return { allowed: true, role };
  }

  return { allowed: false, role };
}

async function main() {
  const jsonRaw = process.env.VC_JSON;
  const token = process.env.VC_TOKEN;
  const teamSlug = process.env.VC_TEAM;

  if (!(jsonRaw && token && teamSlug)) {
    console.error("Missing VC_JSON, VC_TOKEN, or VC_TEAM.");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(jsonRaw);
  } catch {
    console.error("VC_JSON is not valid JSON.");
    process.exit(1);
  }

  const mem = data.membership;
  const m =
    mem != null && typeof mem === "object" && !Array.isArray(mem) ? mem : {};
  const { allowed, role } = evaluateMembership(m);

  if (!allowed) {
    console.error(
      `Release requires Vercel team role Member or Owner (Developer and below cannot run release). Current role: ${role || "unknown"}.`,
    );
    process.exit(1);
  }

  let userBlob;
  try {
    const res = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(
        `Could not load Vercel user: ${res.status} ${res.statusText}`,
      );
      process.exit(1);
    }
    userBlob = await res.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Could not load Vercel user: ${msg}`);
    process.exit(1);
  }

  const uRaw = userBlob.user;
  const u =
    uRaw != null && typeof uRaw === "object" && !Array.isArray(uRaw)
      ? uRaw
      : {};
  const name =
    typeof u.username === "string" && u.username
      ? u.username
      : typeof u.email === "string" && u.email
        ? u.email
        : "unknown";

  console.log(
    `Vercel OK: ${name} — role ${role || "?"} on team ${teamSlug} (release allowed).`,
  );
}

const invokedAsMain = (() => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
  } catch {
    return false;
  }
})();

if (invokedAsMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
