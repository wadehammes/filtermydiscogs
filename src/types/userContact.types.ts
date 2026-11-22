export type UserContact = {
  email: string | null;
  marketingEmailsOptIn: boolean;
};

export type UserContactPatch = {
  email?: string | null;
  marketingEmailsOptIn?: boolean;
};
