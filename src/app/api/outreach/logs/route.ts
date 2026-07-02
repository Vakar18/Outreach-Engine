import { NextResponse } from "next/server";
import { listOutreachLogs } from "@/lib/store";

export async function GET() {
  const logs = await listOutreachLogs();
  return NextResponse.json({ logs });
}