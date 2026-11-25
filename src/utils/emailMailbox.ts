export type ParsedEmailMailbox = {
  address: string;
  displayName?: string;
};

const QUOTED_MAILBOX_PATTERN = /^"([^"]+)"\s*<([^>]+)>$/;
const NAMED_MAILBOX_PATTERN = /^([^<]+?)\s*<([^>]+)>$/;

export const parseEmailMailbox = (value: string): ParsedEmailMailbox => {
  const trimmed = value.trim();
  const quotedMatch = trimmed.match(QUOTED_MAILBOX_PATTERN);

  if (quotedMatch?.[1] != null && quotedMatch[2] != null) {
    return {
      displayName: quotedMatch[1].trim(),
      address: quotedMatch[2].trim(),
    };
  }

  const namedMatch = trimmed.match(NAMED_MAILBOX_PATTERN);

  if (namedMatch?.[1] != null && namedMatch[2] != null) {
    return {
      displayName: namedMatch[1].trim(),
      address: namedMatch[2].trim(),
    };
  }

  return { address: trimmed };
};

export const emailFooterContactLink = (
  contactEmail: string,
): { href: string; label: string } => {
  const { address, displayName } = parseEmailMailbox(contactEmail);

  return {
    href: `mailto:${address}`,
    label: displayName ?? address,
  };
};
