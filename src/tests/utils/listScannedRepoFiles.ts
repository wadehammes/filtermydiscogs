import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const listScannedRepoFiles = ({
  rootDir,
  scanRoots,
  matchesPath,
}: {
  rootDir: string;
  scanRoots: readonly string[];
  matchesPath: (relativePath: string) => boolean;
}): string[] => {
  const files: string[] = [];

  const walk = (directory: string, relativeRoot: string) => {
    for (const entry of readdirSync(directory)) {
      const absolutePath = join(directory, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath, relativeRoot);
        continue;
      }

      const relativePath = relative(relativeRoot, absolutePath).replace(
        /\\/g,
        "/",
      );

      if (matchesPath(relativePath)) {
        files.push(relativePath);
      }
    }
  };

  for (const scanRoot of scanRoots) {
    walk(join(rootDir, scanRoot), rootDir);
  }

  return files.sort();
};
