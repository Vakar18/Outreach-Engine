import { NextResponse } from "next/server";
import { createOAuthClient, GMAIL_SCOPES, isGoogleOAuthConfigured } from "@/lib/google";

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env, or use Demo Mode.",
      },
      { status: 400 }
    );
  }

  const oauth2Client = createOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: false, // never merge old incomplete grants
    scope: GMAIL_SCOPES,
  });

  return NextResponse.redirect(url);
}