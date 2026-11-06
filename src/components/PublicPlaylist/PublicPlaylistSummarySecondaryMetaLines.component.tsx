import classNames from "classnames";
import typographyStyles from "src/styles/modules/typography.module.css";
import heroStyles from "./PublicPlaylistSummaryHero.module.css";

export interface PublicPlaylistSummarySecondaryMetaLinesProps {
  lines: readonly string[];
  className?: string;
}

export const PublicPlaylistSummarySecondaryMetaLines = ({
  lines,
  className,
}: PublicPlaylistSummarySecondaryMetaLinesProps) => {
  const visibleLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (visibleLines.length === 0) {
    return null;
  }

  const linesMarkup = visibleLines.map((line, lineIndex) => (
    <p
      key={`secondary-meta-${lineIndex}`}
      className={classNames(
        typographyStyles.metaCaption,
        heroStyles.secondaryMetaLine,
      )}
    >
      {line}
    </p>
  ));

  if (!className) {
    return <>{linesMarkup}</>;
  }

  return <div className={className}>{linesMarkup}</div>;
};
