import { NextResponse } from "next/server";
import { clearBrandAccount } from "@/lib/store";

export async function POST() {
  await clearBrandAccount();
  return NextResponse.json({ ok: true });
}