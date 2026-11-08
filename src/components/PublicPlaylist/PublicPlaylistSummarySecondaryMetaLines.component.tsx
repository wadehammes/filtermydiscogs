import classNames from "classnames";
import releaseHeroStyles from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.module.css";
import StarSolidIcon from "src/styles/icons/star-solid.svg";
import typographyStyles from "src/styles/modules/typography.module.css";
import { formatCommunityRatingAverage } from "src/utils/releaseDisplay";
import heroStyles from "./PublicPlaylistSummaryHero.module.css";

export type PublicPlaylistSummaryCommunityRating = {
  average: number;
  count: number;
};

export interface PublicPlaylistSummarySecondaryMetaLinesProps {
  lines: readonly string[];
  communityRating?: PublicPlaylistSummaryCommunityRating | null;
  className?: string;
}

export const PublicPlaylistSummarySecondaryMetaLines = ({
  lines,
  communityRating,
  className,
}: PublicPlaylistSummarySecondaryMetaLinesProps) => {
  const visibleLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const isHaveWantLine = (line: string) => line.includes(" have · ");

  const leadingLines = visibleLines.filter((line) => !isHaveWantLine(line));
  const haveWantLines = visibleLines.filter(isHaveWantLine);

  const showCommunityRating =
    communityRating !== null &&
    communityRating !== undefined &&
    communityRating.count > 0;

  if (
    leadingLines.length === 0 &&
    haveWantLines.length === 0 &&
    !showCommunityRating
  ) {
    return null;
  }

  const renderMetaLine = (line: string, key: string) => (
    <p
      key={key}
      className={classNames(
        typographyStyles.metaCaption,
        heroStyles.secondaryMetaLine,
      )}
    >
      {line}
    </p>
  );

  const leadingMarkup = leadingLines.map((line, lineIndex) =>
    renderMetaLine(line, `secondary-meta-leading-${lineIndex}`),
  );

  const haveWantMarkup = haveWantLines.map((line, lineIndex) =>
    renderMetaLine(line, `secondary-meta-have-want-${lineIndex}`),
  );

  const communityRatingMarkup = showCommunityRating ? (
    <p
      className={classNames(
        typographyStyles.metaCaption,
        heroStyles.secondaryMetaLine,
        releaseHeroStyles.communityRating,
      )}
      title="Discogs community average"
    >
      <StarSolidIcon
        className={releaseHeroStyles.communityStarIcon}
        aria-hidden
      />
      <span>
        {formatCommunityRatingAverage(communityRating.average)} (
        {communityRating.count})
      </span>
    </p>
  ) : null;

  const content = (
    <>
      {leadingMarkup}
      {communityRatingMarkup}
      {haveWantMarkup}
    </>
  );

  if (!className) {
    return content;
  }

  return <div className={className}>{content}</div>;
};
