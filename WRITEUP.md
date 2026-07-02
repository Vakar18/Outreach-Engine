# Write-up

## What I'd build next if this were a real product

1. **A real database with a job queue.** Sends would move off the request/
   response cycle into a queue (BullMQ/Redis or a hosted equivalent) so a
   send-to-500-creators click returns instantly and progresses in the
   background, with retries and backoff on transient Gmail errors instead
   of one pass, sent-or-failed.
2. **Per-brand, multi-user accounts with encrypted token storage.** Right
   now there's a single implicit "brand" and refresh tokens sit in a JSON
   file. A real version needs brand orgs, teammates, and tokens encrypted
   at rest (e.g. KMS-backed), not floating in plaintext on disk.
3. **Rate limiting and warm-up sending**, matched to Gmail's per-user daily
   send quota, plus per-domain throttling so one big send doesn't look like
   a spam burst to the receiving mail servers. The assignment explicitly
   scoped this out of the build, but it's the first thing that would break
   a real brand's inbox reputation.
4. **Reply detection / thread status**, at least "did they reply" via the
   Gmail History API, so outreach doesn't look like a one-way blast in the
   product even though the MVP's tracking stops at sent/failed.
5. **CSV validation UX** - a preview/diff step before import (which rows
   are new, which are dupes, which look malformed) instead of a fire-and-
   forget upload.

## Shortcuts I took, and why

- **JSON-file store instead of a real database.** Prisma's engine binaries
  couldn't be fetched in the sandboxed environment I built this in, and
  standing up Postgres for a 4-6 hour MVP is more infra than the assignment
  asked for. I wrote it behind a small repository interface
  (`src/lib/store.ts`: `listInfluencers`, `appendOutreachLog`, etc.) so the
  API routes and UI don't know or care that it's JSON on disk — swapping in
  Postgres/Prisma later is a rewrite of one file, not the app.
- **Demo Mode alongside real Gmail OAuth.** The assignment explicitly
  allows a mocked provider if documented, so I built both: real Gmail OAuth
  is the primary, fully-implemented path, and a one-click Demo Mode (fake
  connected account, simulated send with a deliberate one-in-six bounce so
  the tracking table has something to show) lets anyone try the full flow
  without setting up a Google Cloud OAuth app first.
- **Sequential sending, no queue.** Sends run one at a time in the API
  request handler. It's the simplest thing that's correct - keeps log
  order matching send order and doesn't blow through Gmail's send rate -
  but it means a send-to-many call blocks until every email is out, and a
  server restart mid-send loses whatever hadn't been attempted yet.
- **No retry/backoff on failure.** A failed send is just logged as failed.
  Good enough to see tracking work; a real system would retry transient
  errors (rate limit, timeout) before marking a row failed.
- **Single implicit brand, no auth.** There's one sender account for the
  whole app, no login. Fine for a click-through demo, not for anything
  multi-tenant.
- **Minimal MIME message.** The Gmail send builds a bare HTML-only MIME
  part - no plain-text alternative, no unsubscribe header, no DKIM/SPF
  concerns beyond what Gmail's own sending infrastructure already handles.
  A production sender needs the plain-text part at minimum for
  deliverability.

## What would break first at 10,000 influencers / 100 brands

1. **The JSON file store, immediately, well before 10k rows.** Every read
   parses the entire file and every write rewrites it whole; with 100
   brands writing concurrently, the in-process write queue (which only
   serializes within a single Node process) stops being enough the moment
   this runs on more than one server instance - two instances can each
   queue writes locally and still race on the same file. This is the
   very first thing to replace with Postgres (or similar) with an index on
   `(brand_id, email)` for the dedupe check.
2. **Send throughput and Gmail's rate limits, right after that.** Sequential
   per-request sending means sending to 10,000 creators would hold an HTTP
   request open for a very long time (and time out well before finishing).
   That work needs to move to a background queue with per-brand
   concurrency limits tuned to Gmail's send quota, with the UI polling job
   status instead of waiting on the request.
3. **CSV upload memory usage.** The current upload reads the whole file
   into memory and parses it synchronously in one request. A 10k-row CSV is
   still small enough to be fine, but the *pattern* (whole-file read +
   parse in the request handler, blocking on `addInfluencers` rewriting an
   ever-growing JSON array) is the wrong shape past this point regardless
   of the datastore - it wants streaming CSV parsing and batched inserts.
4. **The dedupe check itself.** `addInfluencers` builds a `Set` of every
   existing email on every import to check for duplicates. That's fine at
   thousands of rows; at real scale it wants a unique DB constraint doing
   the work instead of an in-memory set rebuilt on every call.