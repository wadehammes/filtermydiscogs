"use client";

import classNames from "classnames";
import Image from "next/image";
import { useMemo } from "react";
import { HorizontalScrollRow } from "src/components/HorizontalScrollRow/HorizontalScrollRow.component";
import {
  ModalToolbar,
  ModalToolbarLink,
} from "src/components/ModalToolbar/ModalToolbar.component";
import { ReleaseCardMeta } from "src/components/ReleaseCard/ReleaseCardMeta.component";
import {
  ReleaseHeaderArtistLine,
  ReleaseHeaderTitle,
} from "src/components/ReleaseCard/ReleaseHeaderLinks.component";
import { ReleaseHeroRatingsRow } from "src/components/ReleaseHeroRatingsRow/ReleaseHeroRatingsRow.component";
import styles from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.module.css";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import typographyStyles from "src/styles/modules/typography.module.css";
import type { DiscogsLabel, DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getCommunityRatingFromReleaseDetail } from "src/utils/releaseDisplay";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import {
  mergeReleaseHeaderArtists,
  mergeReleaseHeaderLabel,
} from "src/utils/releaseHeaderMetadata";
import { parseReleaseId } from "src/utils/releaseNotes";

interface PublicReleaseSummaryHeroProps {
  release: DiscogsRelease;
  titleId?: string;
  onClose?: () => void;
}

export const PublicReleaseSummaryHero = ({
  release,
  titleId,
  onClose,
}: PublicReleaseSummaryHeroProps) => {
  const { basic_information: basicInfo } = release;
  const { formats: releaseFormats } = basicInfo;
  const formatTags =
    releaseFormats && releaseFormats.length > 0
      ? getReleaseFormatTags(releaseFormats)
      : [];
  const genreStyleTags = getReleaseGenreStyleTags(basicInfo);
  const { artists, labels, year } = basicInfo;
  const primaryLabel = labels[0];
  const releaseId = parseReleaseId(release);
  const { data: releaseDetail } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: releaseId !== null,
  });
  const heroArtists = useMemo(
    () => mergeReleaseHeaderArtists(artists, releaseDetail?.artists),
    [artists, releaseDetail?.artists],
  );
  const heroLabel = useMemo(
    () =>
      mergeReleaseHeaderLabel(
        primaryLabel,
        releaseDetail?.labels?.[0] as DiscogsLabel | undefined,
      ),
    [primaryLabel, releaseDetail?.labels],
  );
  const labelUrl = getResourceUrl({
    resourceUrl: heroLabel?.resource_url,
    type: "label",
    id: heroLabel?.id,
  });
  const catno = heroLabel?.catno ? String(heroLabel.catno) : null;
  const communityRating = getCommunityRatingFromReleaseDetail(releaseDetail);
  const releaseUrl = getResourceUrl({
    resourceUrl: basicInfo.resource_url,
    type: "release",
    id: releaseId,
  });
  const thumbUrl = getReleaseImageUrl({
    thumb: basicInfo.thumb,
    cover_image: basicInfo.cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  return (
    <div className={styles.hero} data-testid="fmdPublicReleaseSummaryHero">
      <ModalToolbar {...definedProps({ onClose })}>
        {releaseUrl ? (
          <ModalToolbarLink
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on Discogs"
            title="View on Discogs"
            onClick={() => {}}
          >
            <ExternalLinkIcon className={styles.actionIcon} aria-hidden />
          </ModalToolbarLink>
        ) : null}
      </ModalToolbar>
      <div className={styles.heroMain}>
        <div className={styles.coverWrapper}>
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={basicInfo.title}
              width={96}
              height={96}
              className={styles.cover}
              sizes="96px"
            />
          ) : null}
        </div>
        <div className={styles.details}>
          <div className={styles.detailsText}>
            <ReleaseHeaderArtistLine
              artists={heroArtists}
              className={classNames(
                typographyStyles.metaCaption,
                styles.artist,
              )}
            />
            <ReleaseHeaderTitle
              title={basicInfo.title}
              releaseUrl={releaseUrl}
              className={styles.title}
              linkClassName={styles.heroTitleLink}
              titleTag="h2"
              {...definedProps({ titleId })}
            />
            <ReleaseCardMeta
              labelName={heroLabel?.name}
              labelUrl={labelUrl}
              year={year}
              catno={catno}
              metaClassName={classNames(
                typographyStyles.metaCaption,
                styles.metaLine,
              )}
            />
            {communityRating ? (
              <ReleaseHeroRatingsRow communityRating={communityRating} />
            ) : null}
            {formatTags.length > 0 || genreStyleTags.length > 0 ? (
              <HorizontalScrollRow className={styles.tagsRow}>
                {formatTags.map((formatName) => (
                  <span
                    key={formatName}
                    className={classNames(
                      "pill",
                      "pillFormat",
                      styles.staticPill,
                    )}
                  >
                    {formatName}
                  </span>
                ))}
                {genreStyleTags.map((tag) => (
                  <span
                    key={tag}
                    className={classNames(
                      "pill",
                      "pillStyle",
                      styles.staticPill,
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </HorizontalScrollRow>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
