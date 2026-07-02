export type Influencer = {
  id: string;
  name: string;
  email: string;
  niche: string;
  followers: number;
  createdAt: string;
};

export type BrandAccount = {
  email: string;
  mock: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  connectedAt: string;
};

export type OutreachStatus = "sent" | "failed";

export type OutreachLog = {
  id: string;
  influencerId: string;
  influencerName: string;
  influencerEmail: string;
  subject: string;
  status: OutreachStatus;
  error?: string;
  messageId?: string;
  mock: boolean;
  sentAt: string;
};

export type OutreachTemplate = {
  brand: string;
  subject: string;
  body: string;
};