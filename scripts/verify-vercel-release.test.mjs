import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateMembership } from "./verify-vercel-release.mjs";

describe("evaluateMembership", () => {
  it("allows OWNER", () => {
    const { allowed, role } = evaluateMembership({
      role: "OWNER",
      teamPermissions: [],
    });
    assert.equal(allowed, true);
    assert.equal(role, "OWNER");
  });

  it("allows MEMBER", () => {
    const { allowed, role } = evaluateMembership({
      role: "MEMBER",
      teamPermissions: [],
    });
    assert.equal(allowed, true);
    assert.equal(role, "MEMBER");
  });

  it("denies DEVELOPER even with FullProductionDeployment", () => {
    const { allowed, role } = evaluateMembership({
      role: "DEVELOPER",
      teamPermissions: ["FullProductionDeployment"],
    });
    assert.equal(allowed, false);
    assert.equal(role, "DEVELOPER");
  });

  it("denies DEVELOPER", () => {
    const { allowed, role } = evaluateMembership({
      role: "DEVELOPER",
      teamPermissions: [],
    });
    assert.equal(allowed, false);
    assert.equal(role, "DEVELOPER");
  });

  it("denies VIEWER", () => {
    const { allowed, role } = evaluateMembership({
      role: "VIEWER",
      teamPermissions: [],
    });
    assert.equal(allowed, false);
    assert.equal(role, "VIEWER");
  });

  it("denies VIEWER_FOR_PLUS", () => {
    const { allowed, role } = evaluateMembership({
      role: "VIEWER_FOR_PLUS",
      teamPermissions: [],
    });
    assert.equal(allowed, false);
    assert.equal(role, "VIEWER_FOR_PLUS");
  });

  it("denies empty membership", () => {
    const { allowed } = evaluateMembership({});
    assert.equal(allowed, false);
  });
});
