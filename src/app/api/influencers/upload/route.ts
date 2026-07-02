import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { addInfluencers } from "@/lib/store";

// Accepts a few common header spellings so real-world export CSVs (from a
// spreadsheet, a creator database export, etc.) don't need manual cleanup.
const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  full_name: "name",
  fullname: "name",
  influencer: "name",
  email: "email",
  "e-mail": "email",
  niche: "niche",
  category: "niche",
  vertical: "niche",
  followers: "followers",
  follower_count: "followers",
  followers_count: "followers",
  subscribers: "followers",
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/\s+/g, "_");
  return HEADER_ALIASES[key] ?? key;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No CSV file uploaded (field name: file)." }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: `CSV parse error: ${parsed.errors[0].message} (row ${parsed.errors[0].row})` },
      { status: 400 }
    );
  }

  const rows = parsed.data
    .map((row) => ({
      name: (row.name ?? "").trim(),
      email: (row.email ?? "").trim(),
      niche: (row.niche ?? "").trim(),
      followers: Number.parseInt(String(row.followers ?? "0").replace(/[^\d]/g, ""), 10) || 0,
    }))
    .filter((row) => row.name && row.email);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. CSV needs at least 'name' and 'email' columns." },
      { status: 400 }
    );
  }

  const result = await addInfluencers(rows);
  return NextResponse.json(result);
}