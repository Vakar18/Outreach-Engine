import { NextResponse } from "next/server";
import { saveBrandAccount } from "@/lib/store";

export async function POST() {
  await saveBrandAccount({
    email: "demo-brand@brandley.mock",
    mock: true,
    connectedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}