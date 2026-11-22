import { SITE_NAME } from "src/constants/siteMetadata";

export const WELCOME_SIGNUP_EMAIL_SUBJECT = `Welcome to ${SITE_NAME}`;

export const buildWelcomeSignupEmailPreview = (username: string): string =>
  `Welcome, ${username}. Your Discogs collection is connected.`;

export const welcomeSignupEmailCopy = {
  greeting: (username: string) => `Welcome, ${username}.`,
  body: "Thanks for connecting with Discogs. Your collection is linked and ready to filter, play, and organize.",
  syncNote:
    "The first time you open Collection, sync may take a moment while releases load.",
  donateLeadPrefix: `${SITE_NAME} is free to use. `,
  donateLinkLabel: "One-time donations",
  donateLeadSuffix: " help cover hosting and development.",
  settingsNote:
    "This is a one-time welcome note. Contact email and optional product mail live under",
  ctaCollection: "Open Collection",
  ctaSettings: "Account settings",
} as const;
