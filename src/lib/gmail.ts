import { google } from "googleapis";
import { createOAuthClient } from "./google";
import type { BrandAccount } from "./types";

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMimeMessage(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): string {
  // Minimal RFC 2822 message, UTF-8, single HTML part. Good enough for an
  // MVP - a real implementation would use a MIME library and add a
  // text/plain alternative part for deliverability.
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: =?utf-8?B?${Buffer.from(opts.subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ];
  return `${headers.join("\r\n")}\r\n\r\n${opts.html}`;
}

export type SendResult =
  | { status: "sent"; messageId: string }
  | { status: "failed"; error: string };

export async function sendGmailMessage(
  account: BrandAccount,
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  try {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
      access_token: account.accessToken,
      expiry_date: account.expiryDate,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const raw = toBase64Url(
      buildMimeMessage({ from: account.email, to, subject, html })
    );

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return { status: "sent", messageId: res.data.id ?? "unknown" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gmail API error";
    return { status: "failed", error: message };
  }
}

export async function sendMockMessage(
  account: BrandAccount,
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  // Simulates network latency and an occasional bounce so the tracking
  // table has something realistic to show without needing real credentials.
  await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 250));
  console.log(`[mock-send] from=${account.email} to=${to} subject="${subject}"\n${html}`);

  if (to.toLowerCase().includes("bounce")) {
    return { status: "failed", error: "Simulated bounce (mock mode): address contains 'bounce'" };
  }
  return { status: "sent", messageId: `mock-${crypto.randomUUID()}` };
}