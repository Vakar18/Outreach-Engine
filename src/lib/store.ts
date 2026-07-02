import fs from "node:fs/promises";
import path from "node:path";
import type { BrandAccount, Influencer, OutreachLog } from "./types";

/**
 * Persistence layer for the MVP.
 *
 * Tradeoff (documented in WRITEUP.md): this is a flat JSON-file store instead
 * of a real database. It's wrapped behind a small repository interface
 * (get/save functions below) so swapping to Postgres/SQLite later means
 * rewriting this one file, not the API routes or UI. Writes are serialized
 * with an in-process queue so concurrent requests can't clobber each other.
 *
 * On Vercel's read-only filesystem, DATA_DIR falls back to /tmp, which means
 * data resets between cold starts - fine for a click-through demo, not for
 * production (see WRITEUP.md).
 */

const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data"));

const FILES = {
  influencers: path.join(DATA_DIR, "influencers.json"),
  brandAccount: path.join(DATA_DIR, "brand-account.json"),
  outreachLogs: path.join(DATA_DIR, "outreach-logs.json"),
};

// Serializes writes per-file so two concurrent API calls never interleave
// a read-modify-write cycle.
const writeQueues = new Map<string, Promise<unknown>>();
function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = writeQueues.get(key) ?? Promise.resolve();
  const next = prev.then(task, task);
  writeQueues.set(
    key,
    next.catch(() => undefined)
  );
  return next;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

// ---------- Influencers ----------

export async function listInfluencers(): Promise<Influencer[]> {
  return readJson<Influencer[]>(FILES.influencers, []);
}

export async function addInfluencers(
  incoming: Omit<Influencer, "id" | "createdAt">[]
): Promise<{ added: number; skipped: number; influencers: Influencer[] }> {
  return enqueue("influencers", async () => {
    const existing = await readJson<Influencer[]>(FILES.influencers, []);
    const existingEmails = new Set(existing.map((i) => i.email.toLowerCase()));
    let added = 0;
    let skipped = 0;
    for (const row of incoming) {
      const email = row.email.trim().toLowerCase();
      if (!email || existingEmails.has(email)) {
        skipped++;
        continue;
      }
      existingEmails.add(email);
      existing.push({
        ...row,
        email,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      added++;
    }
    await writeJson(FILES.influencers, existing);
    return { added, skipped, influencers: existing };
  });
}

export async function clearInfluencers(): Promise<void> {
  return enqueue("influencers", async () => writeJson(FILES.influencers, []));
}

export async function deleteInfluencer(id: string): Promise<void> {
  return enqueue("influencers", async () => {
    const existing = await readJson<Influencer[]>(FILES.influencers, []);
    await writeJson(
      FILES.influencers,
      existing.filter((i) => i.id !== id)
    );
  });
}

// ---------- Brand account ----------

export async function getBrandAccount(): Promise<BrandAccount | null> {
  return readJson<BrandAccount | null>(FILES.brandAccount, null);
}

export async function saveBrandAccount(account: BrandAccount): Promise<void> {
  return enqueue("brandAccount", async () =>
    writeJson(FILES.brandAccount, account)
  );
}

export async function clearBrandAccount(): Promise<void> {
  return enqueue("brandAccount", async () =>
    writeJson(FILES.brandAccount, null)
  );
}

// ---------- Outreach logs ----------

export async function listOutreachLogs(): Promise<OutreachLog[]> {
  const logs = await readJson<OutreachLog[]>(FILES.outreachLogs, []);
  return [...logs].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );
}

export async function appendOutreachLog(log: OutreachLog): Promise<void> {
  return enqueue("outreachLogs", async () => {
    const existing = await readJson<OutreachLog[]>(FILES.outreachLogs, []);
    existing.push(log);
    await writeJson(FILES.outreachLogs, existing);
  });
}