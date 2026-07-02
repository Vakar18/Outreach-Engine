import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addInfluencers, clearInfluencers, listInfluencers } from "@/lib/store";

export async function GET() {
  const influencers = await listInfluencers();
  return NextResponse.json({ influencers });
}

const InfluencerInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  niche: z.string().trim().default(""),
  followers: z.coerce.number().int().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = InfluencerInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const result = await addInfluencers([parsed.data]);
  return NextResponse.json(result);
}

export async function DELETE() {
  await clearInfluencers();
  return NextResponse.json({ ok: true });
}