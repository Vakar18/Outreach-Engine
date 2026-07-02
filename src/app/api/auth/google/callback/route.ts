import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createOAuthClient } from "@/lib/google";
import { saveBrandAccount } from "@/lib/store";

function redirectHome(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/", req.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const oauthError = req.nextUrl.searchParams.get("error");

  if (oauthError) {
    return redirectHome(req, { connect_error: oauthError });
  }
  if (!code) {
    return redirectHome(req, { connect_error: "missing_code" });
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) throw new Error("Google did not return an email address");
    if (!tokens.refresh_token) {
      // Happens if the user has already granted consent before and Google
      // doesn't re-issue a refresh_token. prompt=consent (set when building
      // the auth URL) avoids this on first connect.
      throw new Error(
        "No refresh token returned. Disconnect any prior grant at https://myaccount.google.com/permissions and reconnect."
      );
    }

    await saveBrandAccount({
      email: data.email,
      mock: false,
      accessToken: tokens.access_token ?? undefined,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date ?? undefined,
      connectedAt: new Date().toISOString(),
    });

    return redirectHome(req, { connected: "1" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth exchange failed";
    return redirectHome(req, { connect_error: message });
  }
}