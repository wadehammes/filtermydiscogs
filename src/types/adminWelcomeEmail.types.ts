export type AdminWelcomeEmailPendingUser = {
  discogsUserId: number;
  username: string;
  email: string;
  createdAt: string;
  loginCount: number;
};

export type AdminWelcomeEmailPendingResponse = {
  users: AdminWelcomeEmailPendingUser[];
};

export type AdminWelcomeEmailSendResponse = {
  sent: true;
  discogsUserId: number;
};
