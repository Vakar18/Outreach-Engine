import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendGmailMessage, sendMockMessage } from "@/lib/gmail";
import { appendOutreachLog, getBrandAccount, listInfluencers } from "@/lib/store";
import { renderTemplate } from "@/lib/template";
import type { OutreachLog } from "@/lib/types";

const SendRequest = z.object({
  brand: z.string().trim().min(1, "Brand name is required"),
  subject: z.string().trim().min(1, "Subject template is required"),
  body: z.string().trim().min(1, "Body template is required"),
  influencerIds: z.array(z.string()).min(1, "Select at least one influencer"),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = SendRequest.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const account = await getBrandAccount();
  if (!account) {
    return NextResponse.json(
      { error: "No email account connected. Connect Gmail (or use Demo Mode) first." },
      { status: 400 }
    );
  }

  const { brand, subject, body, influencerIds } = parsed.data;
  const allInfluencers = await listInfluencers();
  const targets = allInfluencers.filter((i) => influencerIds.includes(i.id));

  if (targets.length === 0) {
    return NextResponse.json({ error: "None of the selected influencers were found." }, { status: 400 });
  }

  const logs: OutreachLog[] = [];

  // Sent sequentially and deliberately un-parallelized: it's kind to Gmail's
  // per-user send rate limit, and it keeps the tracking log's write order
  // matching send order. See WRITEUP.md for what this doesn't handle yet
  // (retries, backoff, queueing) and why that's out of scope here.
  for (const influencer of targets) {
    const vars = {
      name: influencer.name,
      brand,
      niche: influencer.niche,
      followers: influencer.followers,
    };
    const renderedSubject = renderTemplate(subject, vars);
    const renderedBody = renderTemplate(body, vars).replace(/\n/g, "<br/>");

    const result = account.mock
      ? await sendMockMessage(account, influencer.email, renderedSubject, renderedBody)
      : await sendGmailMessage(account, influencer.email, renderedSubject, renderedBody);

    const log: OutreachLog = {
      id: crypto.randomUUID(),
      influencerId: influencer.id,
      influencerName: influencer.name,
      influencerEmail: influencer.email,
      subject: renderedSubject,
      status: result.status,
      error: result.status === "failed" ? result.error : undefined,
      messageId: result.status === "sent" ? result.messageId : undefined,
      mock: account.mock,
      sentAt: new Date().toISOString(),
    };
    await appendOutreachLog(log);
    logs.push(log);
  }

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;

  return NextResponse.json({ sent, failed, logs });
}