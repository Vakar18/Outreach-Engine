import { NextResponse } from "next/server";
import { isGoogleOAuthConfigured } from "@/lib/google";
import { getBrandAccount } from "@/lib/store";

export async function GET() {
  const account = await getBrandAccount();
  return NextResponse.json({
    connected: Boolean(account),
    email: account?.email ?? null,
    mock: account?.mock ?? false,
    connectedAt: account?.connectedAt ?? null,
    oauthConfigured: isGoogleOAuthConfigured(),
  });
}