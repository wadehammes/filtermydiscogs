import type { CrateWithCount } from "src/types/crate.types";

export const resolveActiveCrateId = ({
  crates,
  activeCrateId,
}: {
  crates: CrateWithCount[];
  activeCrateId: string | null;
}): string | null => {
  if (crates.length === 0) {
    return null;
  }

  const hasActiveCrate =
    activeCrateId && crates.some((crate) => crate.id === activeCrateId);

  if (hasActiveCrate) {
    return activeCrateId;
  }

  const defaultCrate =
    crates.find((crate) => crate.is_default) ?? crates[0] ?? null;

  return defaultCrate?.id ?? null;
};
